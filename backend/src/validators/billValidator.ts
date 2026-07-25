import { body, param, query } from 'express-validator';
import { validateRequest } from './authValidator';
import { PaymentMethod } from '../models/Bill';

export const createBillRules = [
  body('items').isArray({ min: 1 }).withMessage('At least one item is required in the cart'),
  body('items.*.itemId').isMongoId().withMessage('Valid Item ID is required'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Item quantity must be at least 1'),
  body('items.*.discountPercentage')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Item discount percentage must be between 0 and 100'),
  body('paymentMethod')
    .isIn(Object.values(PaymentMethod))
    .withMessage(`Payment method must be one of: ${Object.values(PaymentMethod).join(', ')}`),
  body('splitDetails')
    .optional()
    .isObject()
    .withMessage('Split details must be an object'),
  body('billDiscountType')
    .optional()
    .isIn(['FLAT', 'PERCENTAGE'])
    .withMessage('Bill discount type must be FLAT or PERCENTAGE'),
  body('billDiscountValue')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Bill discount value must be non-negative'),
  body('customerId').optional().isMongoId().withMessage('Invalid Customer ID format'),
  body('notes').optional().trim(),
  validateRequest,
];

export const billIdRule = [
  param('id').isMongoId().withMessage('Invalid Bill ID format'),
  validateRequest,
];

export const listBillRules = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('startDate').optional().isISO8601().withMessage('startDate must be a valid ISO date'),
  query('endDate').optional().isISO8601().withMessage('endDate must be a valid ISO date'),
  query('paymentMethod')
    .optional()
    .isIn(Object.values(PaymentMethod))
    .withMessage('Invalid payment method filter'),
  query('cashierId').optional().isMongoId().withMessage('Invalid Cashier ID format'),
  query('customerId').optional().isMongoId().withMessage('Invalid Customer ID format'),
  query('search').optional().trim(),
  validateRequest,
];
