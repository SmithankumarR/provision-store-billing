import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { ApiError } from '../middlewares/errorHandler';

export const validateRequest = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((err) => err.msg);
    return next(new ApiError(errorMessages.join('. '), 400, errors.array()));
  }
  next();
};

export const registerStoreRules = [
  body('storeName').notEmpty().withMessage('Store name is required').trim(),
  body('storeAddress').notEmpty().withMessage('Store address is required').trim(),
  body('storePhone').notEmpty().withMessage('Store phone number is required').trim(),
  body('ownerName').notEmpty().withMessage('Owner name is required').trim(),
  body('ownerEmail').isEmail().withMessage('Please provide a valid email address').normalizeEmail(),
  body('ownerPhone').notEmpty().withMessage('Owner phone number is required').trim(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  validateRequest,
];

export const registerBillerRules = [
  body('name').notEmpty().withMessage('Biller name is required').trim(),
  body('email').isEmail().withMessage('Please provide a valid email address').normalizeEmail(),
  body('phone').notEmpty().withMessage('Biller phone number is required').trim(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  validateRequest,
];

export const loginRules = [
  body('identifier').notEmpty().withMessage('Email or phone number is required').trim(),
  body('password').notEmpty().withMessage('Password is required'),
  validateRequest,
];

export const refreshTokenRules = [
  body('refreshToken').notEmpty().withMessage('Refresh token is required'),
  validateRequest,
];

export const changePasswordRules = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long'),
  validateRequest,
];
