import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/prisma';
import { AppError } from '../utils/AppError';

declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export const protect = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let token;

    if ( req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    else if (req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return next( new AppError('You are not logged in', 401));
    }

    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);

    const currentUser = await prisma.user.findUnique({
      where: { id: decoded.id },
    });

    if (!currentUser) {
      return next(new AppError('User Not Found', 404));
    }

    req.user = currentUser;
    next();
    
  } catch {
    return next(new AppError('Invalid or Expired Token', 401));
  }
};