import { Request, Response, NextFunction } from 'express';
import logger from '../services/logger.service';


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

  logger.error({
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userId: (req as any).user?.userId,
  });


  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
    });
    return;
  }


  if (err.name === 'PrismaClientKnownRequestError') {
    const prismaError = err as any;
    
    // Unique constraint violation
    if (prismaError.code === 'P2002') {
      res.status(400).json({
        status: 'error',
        message: 'Ð”ÑƒÐ±Ð»Ð¸Ñ€Ð°Ñ‰ ÑÐµ Ð·Ð°Ð¿Ð¸Ñ. Ð¢Ð¾Ð·Ð¸ Ð·Ð°Ð¿Ð¸Ñ Ð²ÐµÑ‡Ðµ ÑÑŠÑ‰ÐµÑÑ‚Ð²ÑƒÐ²Ð°.',
      });
      return;
    }

    // Foreign key constraint failed
    if (prismaError.code === 'P2003') {
      res.status(400).json({
        status: 'error',
        message: 'ÐÐµÐ²Ð°Ð»Ð¸Ð´Ð½Ð° Ñ€ÐµÑ„ÐµÑ€ÐµÐ½Ñ†Ð¸Ñ. Ð¡Ð²ÑŠÑ€Ð·Ð°Ð½Ð¸ÑÑ‚ Ð·Ð°Ð¿Ð¸Ñ Ð½Ðµ ÑÑŠÑ‰ÐµÑÑ‚Ð²ÑƒÐ²Ð°.',
      });
      return;
    }

    // Record not found
    if (prismaError.code === 'P2025') {
      res.status(404).json({
        status: 'error',
        message: 'Ð—Ð°Ð¿Ð¸ÑÑŠÑ‚ Ð½Ðµ Ðµ Ð½Ð°Ð¼ÐµÑ€ÐµÐ½.',
      });
      return;
    }
  }


  if (err.name === 'JsonWebTokenError') {
    res.status(401).json({
      status: 'error',
      message: 'ÐÐµÐ²Ð°Ð»Ð¸Ð´ÐµÐ½ Ñ‚Ð¾ÐºÐµÐ½. ÐœÐ¾Ð»Ñ, Ð²Ð»ÐµÐ·Ñ‚Ðµ Ð¾Ñ‚Ð½Ð¾Ð²Ð¾.',
    });
    return;
  }

  if (err.name === 'TokenExpiredError') {
    res.status(401).json({
      status: 'error',
      message: 'Ð¢Ð¾ÐºÐµÐ½ÑŠÑ‚ Ðµ Ð¸Ð·Ñ‚ÐµÐºÑŠÐ». ÐœÐ¾Ð»Ñ, Ð²Ð»ÐµÐ·Ñ‚Ðµ Ð¾Ñ‚Ð½Ð¾Ð²Ð¾.',
    });
    return;
  }


  res.status(500).json({
    status: 'error',
    message: process.env.NODE_ENV === 'production' 
      ? 'Ð’ÑŠÐ·Ð½Ð¸ÐºÐ½Ð° Ð½ÐµÐ¾Ñ‡Ð°ÐºÐ²Ð°Ð½Ð° Ð³Ñ€ÐµÑˆÐºÐ°. ÐœÐ¾Ð»Ñ, Ð¾Ð¿Ð¸Ñ‚Ð°Ð¹Ñ‚Ðµ Ð¾Ñ‚Ð½Ð¾Ð²Ð¾.' 
      : err.message,
  });
};


export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

