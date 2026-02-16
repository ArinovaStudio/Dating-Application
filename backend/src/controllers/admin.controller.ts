import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';
import { AppError } from '../utils/AppError';

type IdParams = { id: string };

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