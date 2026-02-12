import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';

const globalErrorHandler = ( err: AppError, req: Request, res: Response, next: NextFunction ) => {
  err.statusCode = err.statusCode || 500;

  res.status(err.statusCode).json({ success: false, message: err.message });
};

export default globalErrorHandler;