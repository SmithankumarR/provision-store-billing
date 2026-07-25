import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import { sendSuccess } from '../utils/response';
import * as categoryService from '../services/categoryService';

export const createCategory = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const storeId = req.user!.storeId;
    const category = await categoryService.createCategory(storeId, req.body);
    sendSuccess(res, 'Category created successfully', category, 201);
  } catch (error) {
    next(error);
  }
};

export const getCategories = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const storeId = req.user!.storeId;
    const { page, limit, search, status } = req.query;
    const result = await categoryService.getCategories(storeId, {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      search: search ? String(search) : undefined,
      status: status ? (String(status) as 'all' | 'active' | 'inactive') : undefined,
    });
    sendSuccess(res, 'Categories retrieved successfully', result);
  } catch (error) {
    next(error);
  }
};

export const getCategoryById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const storeId = req.user!.storeId;
    const category = await categoryService.getCategoryById(storeId, req.params.id);
    sendSuccess(res, 'Category retrieved successfully', category);
  } catch (error) {
    next(error);
  }
};

export const updateCategory = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const storeId = req.user!.storeId;
    const category = await categoryService.updateCategory(storeId, req.params.id, req.body);
    sendSuccess(res, 'Category updated successfully', category);
  } catch (error) {
    next(error);
  }
};

export const toggleCategoryStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const storeId = req.user!.storeId;
    const category = await categoryService.toggleCategoryStatus(storeId, req.params.id);
    sendSuccess(
      res,
      `Category ${category.isActive ? 'activated' : 'deactivated'} successfully`,
      category
    );
  } catch (error) {
    next(error);
  }
};

export const deleteCategory = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const storeId = req.user!.storeId;
    await categoryService.deleteCategory(storeId, req.params.id);
    sendSuccess(res, 'Category deleted successfully');
  } catch (error) {
    next(error);
  }
};
