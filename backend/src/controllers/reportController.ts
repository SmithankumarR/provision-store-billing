import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import { sendSuccess } from '../utils/response';
import * as reportService from '../services/reportService';

export const getDashboardSummary = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const storeId = req.user!.storeId;
    const summary = await reportService.getDashboardSummary(storeId);
    sendSuccess(res, 'Dashboard summary retrieved successfully', summary);
  } catch (error) {
    next(error);
  }
};

export const getDashboardCharts = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const storeId = req.user!.storeId;
    const charts = await reportService.getDashboardCharts(storeId);
    sendSuccess(res, 'Dashboard charts retrieved successfully', charts);
  } catch (error) {
    next(error);
  }
};

export const getSalesReport = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const storeId = req.user!.storeId;
    const period = (req.query.period as any) || 'monthly';
    const startDate = req.query.startDate ? String(req.query.startDate) : undefined;
    const endDate = req.query.endDate ? String(req.query.endDate) : undefined;

    const report = await reportService.getSalesReport(storeId, period, startDate, endDate);
    sendSuccess(res, 'Sales report retrieved successfully', report);
  } catch (error) {
    next(error);
  }
};

export const getTopAndLowSellingItems = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const storeId = req.user!.storeId;
    const period = (req.query.period as any) || 'monthly';
    const result = await reportService.getTopAndLowSellingItems(storeId, period);
    sendSuccess(res, 'Item performance report retrieved successfully', result);
  } catch (error) {
    next(error);
  }
};
