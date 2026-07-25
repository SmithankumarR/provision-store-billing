import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import { sendSuccess } from '../utils/response';
import * as billService from '../services/billService';

export const createBill = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const storeId = req.user!.storeId;
    const cashierId = req.user!.id;
    const bill = await billService.createBill(storeId, cashierId, req.body);
    sendSuccess(res, 'Bill created successfully', bill, 201);
  } catch (error) {
    next(error);
  }
};

export const getBills = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const storeId = req.user!.storeId;
    const { page, limit, startDate, endDate, paymentMethod, cashierId, customerId, search } = req.query;
    const result = await billService.getBills(storeId, {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      startDate: startDate ? String(startDate) : undefined,
      endDate: endDate ? String(endDate) : undefined,
      paymentMethod: paymentMethod ? (String(paymentMethod) as any) : undefined,
      cashierId: cashierId ? String(cashierId) : undefined,
      customerId: customerId ? String(customerId) : undefined,
      search: search ? String(search) : undefined,
    });
    sendSuccess(res, 'Bills retrieved successfully', result);
  } catch (error) {
    next(error);
  }
};

export const getTodayBillsSummary = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const storeId = req.user!.storeId;
    // Optional filter by current cashier or all
    const cashierId = req.query.myBills === 'true' ? req.user!.id : undefined;
    const summary = await billService.getTodayBillsSummary(storeId, cashierId);
    sendSuccess(res, "Today's sales summary retrieved", summary);
  } catch (error) {
    next(error);
  }
};

export const getBillById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const storeId = req.user!.storeId;
    const bill = await billService.getBillById(storeId, req.params.id);
    sendSuccess(res, 'Bill retrieved successfully', bill);
  } catch (error) {
    next(error);
  }
};

export const cancelBill = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const storeId = req.user!.storeId;
    const userId = req.user!.id;
    const bill = await billService.cancelBill(storeId, req.params.id, userId);
    sendSuccess(res, 'Bill cancelled and inventory restored successfully', bill);
  } catch (error) {
    next(error);
  }
};
