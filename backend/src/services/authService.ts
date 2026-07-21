import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { Store, User, UserRole, IUser } from '../models';
import { ApiError } from '../middlewares/errorHandler';

const JWT_SECRET = process.env.JWT_SECRET || 'development_secret_access_key_provision_store_998877';
const JWT_EXPIRE = process.env.JWT_EXPIRE || '15m';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'development_secret_refresh_key_provision_store_112233';
const JWT_REFRESH_EXPIRE = process.env.JWT_REFRESH_EXPIRE || '7d';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export const generateTokens = (user: IUser): TokenPair => {
  const payload = {
    id: user._id,
    role: user.role,
    storeId: user.storeId,
  };

  const accessToken = jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRE,
  } as jwt.SignOptions);

  const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRE,
  } as jwt.SignOptions);

  return { accessToken, refreshToken };
};

export const registerStoreAndOwner = async (data: {
  storeName: string;
  storeAddress: string;
  storePhone: string;
  gstNumber?: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  password: string;
}) => {
  const existingUser = await User.findOne({
    $or: [{ email: data.ownerEmail.toLowerCase() }, { phone: data.ownerPhone }],
  });

  if (existingUser) {
    throw new ApiError('An account with this email or phone number already exists.', 400);
  }

  // Create store document
  const store = new Store({
    name: data.storeName,
    address: data.storeAddress,
    phone: data.storePhone,
    gstNumber: data.gstNumber || '',
  });

  let session: mongoose.ClientSession | null = null;
  try {
    session = await mongoose.startSession();
    session.startTransaction();

    await store.save({ session });

    const owner = new User({
      name: data.ownerName,
      email: data.ownerEmail.toLowerCase(),
      phone: data.ownerPhone,
      password: data.password,
      role: UserRole.OWNER,
      storeId: store._id,
    });

    const tokens = generateTokens(owner);
    owner.refreshToken = tokens.refreshToken;
    await owner.save({ session });

    await session.commitTransaction();
    session.endSession();

    return {
      tokens,
      user: {
        id: owner._id,
        name: owner.name,
        email: owner.email,
        phone: owner.phone,
        role: owner.role,
        storeId: owner.storeId,
      },
      store,
    };
  } catch (error: any) {
    if (session) {
      await session.abortTransaction().catch(() => {});
      session.endSession().catch(() => {});
    }

    // If transaction failed due to standalone mongod, fallback without session
    if (error.message && error.message.includes('Transaction numbers are only allowed')) {
      await store.save();

      const owner = new User({
        name: data.ownerName,
        email: data.ownerEmail.toLowerCase(),
        phone: data.ownerPhone,
        password: data.password,
        role: UserRole.OWNER,
        storeId: store._id,
      });

      const tokens = generateTokens(owner);
      owner.refreshToken = tokens.refreshToken;
      await owner.save();

      return {
        tokens,
        user: {
          id: owner._id,
          name: owner.name,
          email: owner.email,
          phone: owner.phone,
          role: owner.role,
          storeId: owner.storeId,
        },
        store,
      };
    }

    throw error;
  }
};

export const registerBiller = async (
  storeId: string,
  data: {
    name: string;
    email: string;
    phone: string;
    password: string;
  }
) => {
  const existingUser = await User.findOne({
    $or: [{ email: data.email.toLowerCase() }, { phone: data.phone }],
  });

  if (existingUser) {
    throw new ApiError('A user with this email or phone number already exists.', 400);
  }

  const biller = new User({
    name: data.name,
    email: data.email.toLowerCase(),
    phone: data.phone,
    password: data.password,
    role: UserRole.BILLER,
    storeId,
  });

  await biller.save();

  return {
    id: biller._id,
    name: biller.name,
    email: biller.email,
    phone: biller.phone,
    role: biller.role,
    storeId: biller.storeId,
  };
};

export const login = async (identifier: string, password: string) => {
  const cleanIdentifier = identifier.trim().toLowerCase();

  const user = await User.findOne({
    $or: [{ email: cleanIdentifier }, { phone: identifier.trim() }],
  }).select('+password +isActive');

  if (!user) {
    throw new ApiError('Invalid email/phone or password.', 401);
  }

  if (!user.isActive) {
    throw new ApiError('Account has been deactivated. Please contact store owner.', 403);
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new ApiError('Invalid email/phone or password.', 401);
  }

  const tokens = generateTokens(user);
  user.refreshToken = tokens.refreshToken;
  await user.save();

  const store = await Store.findById(user.storeId);

  return {
    tokens,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      storeId: user.storeId,
    },
    store,
  };
};

export const refreshTokens = async (refreshToken: string) => {
  try {
    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as any;

    const user = await User.findById(decoded.id).select('+refreshToken +isActive');
    if (!user || !user.isActive || user.refreshToken !== refreshToken) {
      throw new ApiError('Invalid or revoked refresh token.', 401);
    }

    const newTokens = generateTokens(user);
    user.refreshToken = newTokens.refreshToken;
    await user.save();

    return newTokens;
  } catch (error) {
    throw new ApiError('Invalid or expired refresh token.', 401);
  }
};

export const logout = async (userId: string) => {
  await User.findByIdAndUpdate(userId, { refreshToken: '' });
};

export const getMe = async (userId: string) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError('User not found.', 404);
  }
  const store = await Store.findById(user.storeId);

  return {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      storeId: user.storeId,
    },
    store,
  };
};

export const changePassword = async (
  userId: string,
  currentPassword: string,
  newPassword: string
) => {
  const user = await User.findById(userId).select('+password');
  if (!user) {
    throw new ApiError('User not found.', 404);
  }

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    throw new ApiError('Current password is incorrect.', 400);
  }

  user.password = newPassword;
  await user.save();
};
