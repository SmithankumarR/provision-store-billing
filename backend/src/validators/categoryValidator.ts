import { body, param, query } from 'express-validator';
import { validateRequest } from './authValidator';

export const createCategoryRules = [
  body('name')
    .notEmpty()
    .withMessage('Category name is required')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Category name must be between 2 and 50 characters'),
  body('description').optional().trim(),
  body('imageUrl').optional().trim(),
  validateRequest,
];

export const updateCategoryRules = [
  param('id').isMongoId().withMessage('Invalid Category ID format'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Category name must be between 2 and 50 characters'),
  body('description').optional().trim(),
  body('imageUrl').optional().trim(),
  validateRequest,
];

export const categoryIdRule = [
  param('id').isMongoId().withMessage('Invalid Category ID format'),
  validateRequest,
];

export const listCategoryRules = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('search').optional().trim(),
  query('status').optional().isIn(['all', 'active', 'inactive']).withMessage('Status must be all, active, or inactive'),
  validateRequest,
];
