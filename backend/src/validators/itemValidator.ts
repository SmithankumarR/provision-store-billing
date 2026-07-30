import { body, param, query } from 'express-validator';
import { validateRequest } from './authValidator';
import { InventoryLogType } from '../models/InventoryLog';

export const createItemRules = [
  body('name').notEmpty().withMessage('Item name is required').trim(),
  body('sellingPrice').isFloat({ min: 0 }).withMessage('Selling price must be a non-negative number'),
  body('categoryId').optional().isMongoId().withMessage('Valid Category ID is required'),
  body('sku').optional().trim().toUpperCase(),
  body('barcode').optional().trim(),
  body('costPrice').optional().isFloat({ min: 0 }).withMessage('Cost price must be a non-negative number'),
  body('mrp').optional().isFloat({ min: 0 }).withMessage('MRP must be a non-negative number'),
  body('discountPercentage')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Discount percentage must be between 0 and 100'),
  body('gstPercentage')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('GST percentage must be between 0 and 100'),
  body('currentStock').optional().isInt({ min: 0 }).withMessage('Current stock must be a non-negative integer'),
  body('minimumStock')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Minimum stock must be a non-negative integer'),
  body('imageUrl').optional().trim(),
  validateRequest,
];

export const updateItemRules = [
  param('id').isMongoId().withMessage('Invalid Item ID format'),
  body('name').optional().trim(),
  body('categoryId').optional().isMongoId().withMessage('Valid Category ID is required'),
  body('sku').optional().trim().toUpperCase(),
  body('barcode').optional().trim(),
  body('sellingPrice').optional().isFloat({ min: 0 }).withMessage('Selling price must be a non-negative number'),
  body('costPrice').optional().isFloat({ min: 0 }).withMessage('Cost price must be a non-negative number'),
  body('mrp').optional().isFloat({ min: 0 }).withMessage('MRP must be a non-negative number'),
  body('discountPercentage')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Discount percentage must be between 0 and 100'),
  body('gstPercentage')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('GST percentage must be between 0 and 100'),
  body('currentStock').optional().isInt({ min: 0 }).withMessage('Current stock must be a non-negative integer'),
  body('minimumStock')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Minimum stock must be a non-negative integer'),
  body('imageUrl').optional().trim(),
  validateRequest,
];

export const itemIdRule = [
  param('id').isMongoId().withMessage('Invalid Item ID format'),
  validateRequest,
];

export const listItemRules = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('search').optional().trim(),
  query('category').optional().isMongoId().withMessage('Valid Category ID required'),
  query('status').optional().isIn(['all', 'active', 'inactive']).withMessage('Status must be all, active, or inactive'),
  query('lowStock').optional().isBoolean().withMessage('lowStock must be a boolean'),
  query('sortBy')
    .optional()
    .isIn(['name', 'sellingPrice', 'currentStock', 'createdAt'])
    .withMessage('Invalid sortBy field'),
  query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('sortOrder must be asc or desc'),
  validateRequest,
];

export const inventoryAdjustRules = [
  body('itemId').isMongoId().withMessage('Valid Item ID is required'),
  body('type')
    .isIn(Object.values(InventoryLogType))
    .withMessage(`Type must be one of: ${Object.values(InventoryLogType).join(', ')}`),
  body('quantity').isInt().withMessage('Quantity must be an integer'),
  body('reason').optional().trim(),
  validateRequest,
];
