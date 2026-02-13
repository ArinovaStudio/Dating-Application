import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';
import { AppError } from '../utils/AppError';

export const blockUser = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { blockedId } = req.body;
    const myId = req.user.id;

    if (myId === blockedId){
        return next(new AppError('You cannot block yourself', 400));
    }

    const userExists = await prisma.user.findUnique({ where: { id: blockedId } });
    if (!userExists){
        return next(new AppError('User not found', 404));
    }

    const blockExists = await prisma.block.findUnique({ where: { blockerId_blockedId: { blockerId: myId, blockedId } } });
    if (blockExists){
        return next(new AppError('User is already blocked', 400));
    }

    await prisma.block.create({
      data: { blockerId: myId, blockedId },
    });
   
    res.status(201).json({ success: true, message: 'User blocked successfully' });
  } catch (error: any) {
    next(error);
  }
};

export const unblockUser = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { blockedId } = req.params;
    const myId = req.user.id;

    const blockExists = await prisma.block.findUnique({ where: { blockerId_blockedId: { blockerId: myId, blockedId } } });
    if (!blockExists){
        return next(new AppError('User is not blocked', 400));
    }

    await prisma.block.delete({
      where: { blockerId_blockedId: { blockerId: myId, blockedId } },
    });

    res.status(200).json({ success: true, message: 'User unblocked successfully' });
  } catch (error: any) {
    next(error);
  }
};