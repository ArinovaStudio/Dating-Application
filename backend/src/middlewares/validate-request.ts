import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';

export const validateRequest = ( req: Request, res: Response, next: NextFunction ) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formattedErrors: Record<string, string> = {};

    errors.array().forEach((err: any) => {
      const field = err.param || err.path;
      formattedErrors[field] = err.msg;
    });

    return res.status(400).json({ success: false, errors: formattedErrors });
  }

  next();
};
