import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../utils/response';
import { AuthRequest } from '../middlewares/authMiddleware';
import * as authService from '../services/authService';

export const registerStore = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await authService.registerStoreAndOwner(req.body);
    sendSuccess(res, 'Store and Owner account created successfully', result, 201);
  } catch (error) {
    next(error);
  }
};

export const registerBiller = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const storeId = req.user!.storeId;
    const result = await authService.registerBiller(storeId, req.body);
    sendSuccess(res, 'Biller account created successfully', result, 201);
  } catch (error) {
    next(error);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { identifier, password } = req.body;
    const result = await authService.login(identifier, password);
    sendSuccess(res, 'Login successful', result);
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { refreshToken } = req.body;
    const tokens = await authService.refreshTokens(refreshToken);
    sendSuccess(res, 'Token refreshed successfully', tokens);
  } catch (error) {
    next(error);
  }
};

export const logout = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await authService.logout(req.user!.id);
    sendSuccess(res, 'Logged out successfully');
  } catch (error) {
    next(error);
  }
};

export const getMe = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await authService.getMe(req.user!.id);
    sendSuccess(res, 'User profile retrieved', result);
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;
    await authService.changePassword(req.user!.id, currentPassword, newPassword);
    sendSuccess(res, 'Password changed successfully');
  } catch (error) {
    next(error);
  }
};
