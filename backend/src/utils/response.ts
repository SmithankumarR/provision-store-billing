import { Response } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  stack?: string;
}

export const sendSuccess = <T>(
  res: Response,
  message: string,
  data?: T,
  statusCode: number = 200
): Response => {
  const responsePayload: ApiResponse<T> = {
    success: true,
    message,
    data,
  };
  return res.status(statusCode).json(responsePayload);
};

export const sendError = (
  res: Response,
  message: string,
  statusCode: number = 500,
  error?: string,
  stack?: string
): Response => {
  const responsePayload: ApiResponse = {
    success: false,
    message,
    error: error || message,
    ...(process.env.NODE_ENV === 'development' && stack ? { stack } : {}),
  };
  return res.status(statusCode).json(responsePayload);
};
