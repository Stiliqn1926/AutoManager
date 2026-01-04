import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

// Validation middleware factory
export const validate = (schema: Joi.ObjectSchema, source: 'body' | 'query' = 'body') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const dataToValidate = source === 'query' ? req.query : req.body;

    const { error, value } = schema.validate(dataToValidate, {
      abortEarly: false, // Показва ВСИЧКИ грешки, не само първата
      stripUnknown: true, // Премахва непознати полета
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      res.status(400).json({
        message: 'Validation failed',
        errors,
      });
      return;
    }

    // Замени req.body или добави validated data в req
    if (source === 'query') {
      // За query - добави validated data като нова property
      (req as any).validatedQuery = value;
    } else {
      req.body = value;
    }

    next();
  };
};