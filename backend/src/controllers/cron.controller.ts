import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';

export const checkExpiredSubscriptions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers['x-cron-secret'];
    
    if (authHeader !== process.env.CRON_SECRET) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const now = new Date();

    const expiredSubs = await prisma.subscription.findMany({
      where: {
        isActive: true,
        endDate: { lt: now }
      },
      select: { userId: true, id: true } 
    });

    if (expiredSubs.length === 0) {
      return res.status(200).json({ success: true, message: 'No expired subscriptions found' });
    }

    const userIds = expiredSubs.map(sub => sub.userId);

    await prisma.$transaction([

      prisma.subscription.updateMany({
        where: {id: { in: expiredSubs.map(s => s.id) }},
        data: { isActive: false }
      }),

      prisma.user.updateMany({
        where: { id: { in: userIds }},
        data: { isPaidMember: false }
      })
    ]);

    res.status(200).json({ success: true, message: `Processed ${expiredSubs.length} expired subscriptions` });

  } catch (error) {
    next(error);
  }
};