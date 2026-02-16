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

export const restrictTo = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!roles.includes(req.user.role)) {
      return next( new AppError('You do not have permission to perform this action', 403));
    }
    next();
  };
};

export const restrictToPaid = async (req: any, res: Response, next: NextFunction) => {
  try {
    const user = req.user;

    if (user.isPaidMember) {
      return next();
    }

    const activeSubscription = await prisma.subscription.findFirst({
      where: {
        userId: user.id,
        isActive: true,
        endDate: { gte: new Date() }
      }
    });

    if (activeSubscription) {
      return next();
    }

    return next(new AppError('This feature is for Premium members only. Please upgrade your plan.', 403));
  } catch (error) {
    next(error);
  }
};