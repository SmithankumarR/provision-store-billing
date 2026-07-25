import { body, param, query } from 'express-validator';
import { validateRequest } from './authValidator';

export const createCustomerRules = [
  body('name').notEmpty().withMessage('Customer name is required').trim(),
  body('phone')
    .notEmpty()
    .withMessage('Customer phone number is required')
    .trim()
    .matches(/^[0-9+\s-]{10,15}$/)
    .withMessage('Please enter a valid phone number'),
  body('gstNumber').optional().trim(),
  body('address').optional().trim(),
  validateRequest,
];

export const updateCustomerRules = [
  param('id').isMongoId().withMessage('Invalid Customer ID format'),
  body('name').optional().trim(),
  body('phone')
    .optional()
    .trim()
    .matches(/^[0-9+\s-]{10,15}$/)
    .withMessage('Please enter a valid phone number'),
  body('gstNumber').optional().trim(),
  body('address').optional().trim(),
  validateRequest,
];

export const customerIdRule = [
  param('id').isMongoId().withMessage('Invalid Customer ID format'),
  validateRequest,
];

export const listCustomerRules = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('search').optional().trim(),
  validateRequest,
];
