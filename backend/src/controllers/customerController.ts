import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import { sendSuccess } from '../utils/response';
import * as customerService from '../services/customerService';

export const createCustomer = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const storeId = req.user!.storeId;
    const customer = await customerService.createCustomer(storeId, req.body);
    sendSuccess(res, 'Customer created successfully', customer, 201);
  } catch (error) {
    next(error);
  }
};

export const getCustomers = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const storeId = req.user!.storeId;
    const { page, limit, search } = req.query;
    const result = await customerService.getCustomers(storeId, {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      search: search ? String(search) : undefined,
    });
    sendSuccess(res, 'Customers retrieved successfully', result);
  } catch (error) {
    next(error);
  }
};

export const getCustomerByPhone = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const storeId = req.user!.storeId;
    const customer = await customerService.getCustomerByPhone(storeId, req.params.phone);
    sendSuccess(res, 'Customer retrieved successfully', customer);
  } catch (error) {
    next(error);
  }
};

export const getCustomerById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const storeId = req.user!.storeId;
    const customer = await customerService.getCustomerById(storeId, req.params.id);
    sendSuccess(res, 'Customer retrieved successfully', customer);
  } catch (error) {
    next(error);
  }
};

export const updateCustomer = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const storeId = req.user!.storeId;
    const customer = await customerService.updateCustomer(storeId, req.params.id, req.body);
    sendSuccess(res, 'Customer updated successfully', customer);
  } catch (error) {
    next(error);
  }
};
