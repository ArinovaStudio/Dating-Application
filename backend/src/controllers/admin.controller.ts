import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';
import { AppError } from '../utils/AppError';
import { deleteFile } from '../utils/file.util';

type IdParams = { id: string };

// plans apis
export const createPlan = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, price, durationDays, tokensIncluded, messageDelay, 
    maxImagesPerDay, canSendVideo, canAudioCall, canVideoCall } = req.body;

    const existingPlan = await prisma.plan.findUnique({ where: { name } });
    if (existingPlan){
        return next(new AppError('Plan with this name already exists', 400));
    }

    const newPlan = await prisma.plan.create({
      data: {
        name,
        price,
        durationDays,
        tokensIncluded,
        messageDelay,
        maxImagesPerDay,
        canSendVideo,
        canAudioCall,
        canVideoCall
      }
    });

    res.status(201).json({ success: true, message: 'Plan created successfully', plan: newPlan });
  } catch (error) {
    next(error);
  }
};


export const getAllPlans = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const plans = await prisma.plan.findMany({ orderBy: { price: 'asc' }});

    res.status(200).json({ success: true, plans });
  } catch (error) {
    next(error);
  }
};


export const updatePlan = async (req: Request<IdParams>, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const plan = await prisma.plan.findUnique({ where: { id } });

    if (!plan) {
      return next(new AppError('Plan not found', 404));
    }
    
    const updatedPlan = await prisma.plan.update({
      where: { id },
      data: req.body
    });

    res.status(200).json({ success: true, message: 'Plan updated successfully', plan: updatedPlan });
  } catch (error) {
    next(error);
  }
};

export const deletePlan = async (req: Request<IdParams>, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const plan = await prisma.plan.findUnique({ where: { id } });

    if (!plan) {
      return next(new AppError('Plan not found', 404));
    }

    await prisma.plan.delete({
      where: { id }
    });

    res.status(200).json({ success: true, message: 'Plan deleted successfully'});
  } catch (error) {
    next(error);
  }
};

// users apis
export const getAllUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { search } = req.query;

    let whereClause: any = { role: 'USER' };

    if (search) {
      whereClause.OR = [
        { username: { contains: String(search), mode: 'insensitive' } },
        { email: { contains: String(search), mode: 'insensitive' } }
      ];
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        username: true,
        email: true,
        status: true,
        isPaidMember: true,
        createdAt: true,
        wallet: { select: { balance: true } },
        subscription: { include: { plan: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json({ success: true, users });
  } catch (error) {
    next(error);
  }
};

export const toggleUserStatus = async (req: Request<IdParams>, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user){
      return next(new AppError('User not found', 404));
    }

    const newStatus = user.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';

    await prisma.user.update({
      where: { id },
      data: { status: newStatus }
    });

    res.status(200).json({ success: true, message: `User marked as ${newStatus}` });
  } catch (error) {
    next(error);
  }
};

export const editUser = async (req: Request<IdParams>, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { tokens, planId } = req.body;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user){
      return next(new AppError('User not found', 404));
    }

    if (tokens !== undefined) {
      await prisma.wallet.upsert({
        where: { userId: id },
        update: { balance: Number(tokens) },
        create: { userId: id, balance: Number(tokens) }
      });
    }

    if (planId) {
      const plan = await prisma.plan.findUnique({ where: { id: planId } });
      if (!plan) return next(new AppError('Plan not found', 404));

      const endDate = new Date();
      endDate.setDate(endDate.getDate() + plan.durationDays);

      await prisma.$transaction([
        prisma.subscription.upsert({
          where: { userId: id },
          update: { planId, isActive: true },
          create: { userId: id, planId, isActive: true, endDate }
        }),
        prisma.user.update({
          where: { id },
          data: { isPaidMember: true }
        })
      ]);
    }

    res.status(200).json({ success: true, message: 'User updated successfully' });
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req: Request<IdParams>, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({ 
      where: { id },
      include: {
        profile: true,
        messages: {
          where: {
            type: { in: ['IMAGE', 'VIDEO', 'AUDIO'] }
          }
        }
      }
    });

    if (!user){
      return next(new AppError('User not found', 404));
    }

    if (user.profile?.avatar) {
      deleteFile(user.profile.avatar);
    }

    if (user.messages && user.messages.length > 0) {
      user.messages.forEach((msg) => {
        if (msg.content) {
          deleteFile(msg.content);
        }
      });
    }

    await prisma.$transaction([
      
      prisma.call.deleteMany({ where: { OR: [{ callerId: id }, { receiverId: id }] }}),

      prisma.message.deleteMany({ where: { senderId: id } }),

      prisma.participant.deleteMany({ where: { userId: id } }),

      prisma.subscription.deleteMany({ where: { userId: id } }),

      prisma.wallet.deleteMany({ where: { userId: id } }),

      prisma.block.deleteMany({
        where: { OR: [{ blockerId: id }, { blockedId: id }] }
      }),
      
      prisma.contact.deleteMany({
        where: { OR: [{ userId: id }, { contactId: id }] }
      }),

      prisma.otp.deleteMany({ where: { email: user.email } }),

      prisma.profile.deleteMany({ where: { userId: id } }),

      prisma.user.delete({ where: { id } })
    ]);

    res.status(200).json({ success: true, message: 'User deleted successfully' });

  } catch (error) {
    next(error);
  }
};

// system config apis
export const getSystemConfig = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let config = await prisma.systemConfig.findUnique({ where: { id: 'config' }});

    if (!config) {
      config = await prisma.systemConfig.create({
        data: {
          id: 'config',
          callCostPerMinute: 1, // 1 token
          defaultFreeDelay: 8 
        }
      });
    }

    res.status(200).json({ success: true, config });
  } catch (error) {
    next(error);
  }
};

export const updateSystemConfig = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { callCostPerMinute, defaultFreeDelay } = req.body;

    const config = await prisma.systemConfig.upsert({
      where: { id: 'config' },
      update: { callCostPerMinute, defaultFreeDelay },
      create: { id: 'config', callCostPerMinute, defaultFreeDelay }
    });

    res.status(200).json({ success: true, message: 'System configuration updated', config });
  } catch (error) {
    next(error);
  }
};