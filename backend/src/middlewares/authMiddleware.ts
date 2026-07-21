import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ApiError } from './errorHandler';
import User, { UserRole } from '../models/User';

export interface AuthUserPayload {
  id: string;
  role: UserRole;
  storeId: string;
}

export interface AuthRequest extends Request {
  user?: AuthUserPayload;
}

export const protect = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  let token: string | undefined;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new ApiError('Not authorized to access this route. Token missing.', 401));
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'development_secret_access_key_provision_store_998877'
    ) as AuthUserPayload;

    const user = await User.findById(decoded.id).select('+isActive');

    if (!user) {
      return next(new ApiError('User belonging to this token no longer exists.', 401));
    }

    if (!user.isActive) {
      return next(new ApiError('User account has been deactivated.', 403));
    }

    req.user = {
      id: user._id.toString(),
      role: user.role,
      storeId: user.storeId.toString(),
    };

    next();
  } catch (error) {
    return next(new ApiError('Not authorized to access this route. Invalid or expired token.', 401));
  }
};

export const authorize = (...roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new ApiError('Not authorized to access this route.', 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new ApiError(
          `User role '${req.user.role}' is not authorized to access this route. Requires one of: [${roles.join(', ')}]`,
          403
        )
      );
    }

    next();
  };
};
