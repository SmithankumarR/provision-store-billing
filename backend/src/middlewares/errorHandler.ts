import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response';
import logger from '../utils/logger';

export class ApiError extends Error {
  public statusCode: number;
  public errors?: any[];

  constructor(message: string, statusCode: number = 500, errors?: any[], stack = '') {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export const errorHandler = (
  err: Error | ApiError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let statusCode = 500;
  let message = err.message || 'Internal Server Error';
  let stack = err.stack;

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
  }

  // Log error with Winston
  logger.error(
    `${req.method} ${req.originalUrl} - Status: ${statusCode} - Message: ${message}`
  );
  if (stack && process.env.NODE_ENV === 'development') {
    logger.error(stack);
  }

  sendError(res, message, statusCode, err.name, stack);
};
