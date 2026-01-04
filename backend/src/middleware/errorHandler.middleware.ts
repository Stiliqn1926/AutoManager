import { Request, Response, NextFunction } from 'express';
import logger from '../services/logger.service';

// Custom Error класове
export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Global Error Handler
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Логвай грешката
  logger.error({
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userId: (req as any).user?.userId,
  });

  // Ако е наша грешка (AppError)
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
    });
    return;
  }

  // Prisma грешки
  if (err.name === 'PrismaClientKnownRequestError') {
    const prismaError = err as any;
    
    // Unique constraint violation
    if (prismaError.code === 'P2002') {
      res.status(400).json({
        status: 'error',
        message: 'Дублиращ се запис. Този запис вече съществува.',
      });
      return;
    }

    // Foreign key constraint failed
    if (prismaError.code === 'P2003') {
      res.status(400).json({
        status: 'error',
        message: 'Невалидна референция. Свързаният запис не съществува.',
      });
      return;
    }

    // Record not found
    if (prismaError.code === 'P2025') {
      res.status(404).json({
        status: 'error',
        message: 'Записът не е намерен.',
      });
      return;
    }
  }

  // JWT грешки
  if (err.name === 'JsonWebTokenError') {
    res.status(401).json({
      status: 'error',
      message: 'Невалиден токен. Моля, влезте отново.',
    });
    return;
  }

  if (err.name === 'TokenExpiredError') {
    res.status(401).json({
      status: 'error',
      message: 'Токенът е изтекъл. Моля, влезте отново.',
    });
    return;
  }

  // Неочаквани грешки (500)
  res.status(500).json({
    status: 'error',
    message: process.env.NODE_ENV === 'production' 
      ? 'Възникна неочаквана грешка. Моля, опитайте отново.' 
      : err.message,
  });
};

// Async error wrapper - за да не трябва да пишем try-catch навсякъде
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};