import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import { sendSuccess } from '../utils/response';
import * as itemService from '../services/itemService';

export const createItem = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const storeId = req.user!.storeId;
    const userId = req.user!.id;
    const item = await itemService.createItem(storeId, userId, req.body);
    sendSuccess(res, 'Item created successfully', item, 201);
  } catch (error) {
    next(error);
  }
};

export const getItems = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const storeId = req.user!.storeId;
    const { page, limit, search, category, status, lowStock, sortBy, sortOrder } = req.query;
    const result = await itemService.getItems(storeId, {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      search: search ? String(search) : undefined,
      category: category ? String(category) : undefined,
      status: status ? (String(status) as 'all' | 'active' | 'inactive') : undefined,
      lowStock: lowStock === 'true',
      sortBy: sortBy ? (String(sortBy) as any) : undefined,
      sortOrder: sortOrder ? (String(sortOrder) as any) : undefined,
    });
    sendSuccess(res, 'Items retrieved successfully', result);
  } catch (error) {
    next(error);
  }
};

export const getItemById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const storeId = req.user!.storeId;
    const item = await itemService.getItemById(storeId, req.params.id);
    sendSuccess(res, 'Item retrieved successfully', item);
  } catch (error) {
    next(error);
  }
};

export const getItemByBarcode = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const storeId = req.user!.storeId;
    const item = await itemService.getItemByBarcode(storeId, req.params.barcode);
    sendSuccess(res, 'Item retrieved by barcode successfully', item);
  } catch (error) {
    next(error);
  }
};

export const getItemBySku = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const storeId = req.user!.storeId;
    const item = await itemService.getItemBySku(storeId, req.params.sku);
    sendSuccess(res, 'Item retrieved by SKU successfully', item);
  } catch (error) {
    next(error);
  }
};

export const updateItem = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const storeId = req.user!.storeId;
    const item = await itemService.updateItem(storeId, req.params.id, req.body);
    sendSuccess(res, 'Item updated successfully', item);
  } catch (error) {
    next(error);
  }
};

export const toggleItemStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const storeId = req.user!.storeId;
    const item = await itemService.toggleItemStatus(storeId, req.params.id);
    sendSuccess(
      res,
      `Item ${item.status.toLowerCase()} successfully`,
      item
    );
  } catch (error) {
    next(error);
  }
};

export const deleteItem = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const storeId = req.user!.storeId;
    await itemService.deleteItem(storeId, req.params.id);
    sendSuccess(res, 'Item deleted successfully');
  } catch (error) {
    next(error);
  }
};

export const adjustInventory = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const storeId = req.user!.storeId;
    const userId = req.user!.id;
    const result = await itemService.adjustInventory(storeId, userId, req.body);
    sendSuccess(res, 'Inventory adjusted successfully', result);
  } catch (error) {
    next(error);
  }
};

export const getInventoryLogs = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const storeId = req.user!.storeId;
    const itemId = req.query.itemId ? String(req.query.itemId) : undefined;
    const logs = await itemService.getInventoryLogs(storeId, itemId);
    sendSuccess(res, 'Inventory logs retrieved successfully', logs);
  } catch (error) {
    next(error);
  }
};

export const getLowStockItems = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const storeId = req.user!.storeId;
    const items = await itemService.getLowStockItems(storeId);
    sendSuccess(res, 'Low stock items retrieved successfully', items);
  } catch (error) {
    next(error);
  }
};

export const importCsvItems = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const storeId = req.user!.storeId;
    const userId = req.user!.id;
    
    let csvContent = '';
    if (req.file) {
      csvContent = req.file.buffer.toString('utf8');
    } else if (req.body.csvData) {
      csvContent = req.body.csvData;
    } else {
      res.status(400).json({ success: false, message: 'Please upload a CSV file or provide csvData.' });
      return;
    }

    const result = await itemService.importCsvItems(storeId, userId, csvContent);
    sendSuccess(res, 'CSV Import completed', result);
  } catch (error) {
    next(error);
  }
};

export const exportCsvItems = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const storeId = req.user!.storeId;
    const csvData = await itemService.exportCsvItems(storeId);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="inventory_export.csv"');
    res.status(200).send(csvData);
  } catch (error) {
    next(error);
  }
};
