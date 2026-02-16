import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { deleteFile } from '../utils/file.util';

export const validateRequest = ( req: Request, res: Response, next: NextFunction ) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formattedErrors: Record<string, string> = {};

    errors.array().forEach((err: any) => {
      const field = err.param || err.path;
      formattedErrors[field] = err.msg;
    });

    if (req.file) {
      const folderName = req.file.destination.split(/[\\/]/).pop();
      deleteFile(`/uploads/${folderName}/${req.file.filename}`);
    }

    return res.status(400).json({ success: false, errors: formattedErrors });
  }

  next();
};
