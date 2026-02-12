import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';
import { AppError } from '../utils/AppError';

export const getMySubscription = async (req: any, res: Response, next: NextFunction) => {
  try {
    const userId = req.user.id;

    const subscription = await prisma.subscription.findUnique({
      where: { userId },
      include: { plan: true }
    });

    if (!subscription) {
      return res.status(200).json({ success: true, message: 'No active subscription' });
    }

    res.status(200).json({ success: true, message: 'Subscription details fetched', subscription });

  } catch (error) {
    next(error);
  }
};

export const getWallet = async (req: any, res: Response, next: NextFunction) => {
  try {
    const userId = req.user.id;

    let wallet = await prisma.wallet.findUnique({
      where: { userId }
    });

    if (!wallet) {
      wallet = await prisma.wallet.create({ data: { userId, balance: 0 } });
    }

    res.status(200).json({ success: true, balance: wallet.balance });

  } catch (error) {
    next(error);
  }
};

// payment gateway to be included later
export const subscribe = async (req: any, res: Response, next: NextFunction) => {
  try {
    const userId = req.user.id;
    const { planId } = req.body;

    const plan = await prisma.plan.findUnique({ where: { id: planId } });
    if (!plan){ 
        return next(new AppError('Invalid Plan ID', 400));
    }

    const endDate = new Date();
    endDate.setDate(endDate.getDate() + plan.durationDays);

    await prisma.$transaction(async (tx) => {
      
      await tx.subscription.upsert({
        where: { userId },
        update: {
          planId,
          startDate: new Date(),
          endDate,
          isActive: true
        },
        create: {
          userId,
          planId,
          startDate: new Date(),
          endDate,
          isActive: true
        }
      });

      await tx.user.update({
        where: { id: userId },
        data: { 
          isPaidMember: true,
        }
      });

      if (plan.tokensIncluded > 0) {
        await tx.wallet.upsert({
          where: { userId },
          update: { balance: { increment: plan.tokensIncluded } },
          create: { userId, balance: plan.tokensIncluded }
        });
      }
    });

    res.status(200).json({ success: true, message: `Successfully subscribed to ${plan.name}` });

  } catch (error) {
    next(error);
  }
};