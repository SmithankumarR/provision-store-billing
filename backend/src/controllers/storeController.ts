import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import { sendSuccess } from '../utils/response';
import * as storeService from '../services/storeService';

export const getStoreProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const storeId = req.user!.storeId;
    const store = await storeService.getStoreProfile(storeId);
    sendSuccess(res, 'Store profile retrieved', store);
  } catch (error) {
    next(error);
  }
};

export const updateStoreProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const storeId = req.user!.storeId;
    const store = await storeService.updateStoreProfile(storeId, req.body);
    sendSuccess(res, 'Store profile updated successfully', store);
  } catch (error) {
    next(error);
  }
};

export const getAppSettings = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const storeId = req.user!.storeId;
    const settings = await storeService.getAppSettings(storeId);
    sendSuccess(res, 'App settings retrieved', settings);
  } catch (error) {
    next(error);
  }
};

export const updateAppSettings = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const storeId = req.user!.storeId;
    const settings = await storeService.updateAppSettings(storeId, req.body);
    sendSuccess(res, 'App settings updated successfully', settings);
  } catch (error) {
    next(error);
  }
};
