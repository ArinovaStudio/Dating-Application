import { Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';
import { AppError } from '../utils/AppError';
import { deleteFile } from '../utils/file.util';

export const getCallHistory = async (req: any, res: Response, next: NextFunction) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    const calls = await prisma.call.findMany({
      where: {
        OR: [
          { callerId: userId },
          { receiverId: userId }
        ]
      },
      include: {
        caller: {
          select: { id: true, username: true, profile: { select: { name: true, avatar: true } } }
        },
        receiver: {
          select: { id: true, username: true, profile: { select: { name: true, avatar: true } } }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: Number(limit),
      skip: skip
    });

    const totalCalls = await prisma.call.count({
      where: {
        OR: [
          { callerId: userId },
          { receiverId: userId }
        ]
      }
    });

    const formattedCalls = calls.map(call => {
      const isCaller = call.callerId === userId;
      const otherPerson = isCaller ? call.receiver : call.caller;

      let durationString = "0s";
      if (call.startTime && call.endTime) {
        const diffMs = new Date(call.endTime).getTime() - new Date(call.startTime).getTime();
        const minutes = Math.floor(diffMs / 60000);
        const seconds = Math.floor((diffMs % 60000) / 1000);
        durationString = `${minutes}m ${seconds}s`;
      }

      return {
        id: call.id,
        type: call.type,
        status: call.status,
        direction: isCaller ? 'OUTGOING' : 'INCOMING',
        cost: isCaller ? call.tokensConsumed : 0,
        duration: durationString,
        startTime: call.startTime,
        partner: {
          id: otherPerson.id,
          name: otherPerson.profile?.name || otherPerson.username,
          avatar: otherPerson.profile?.avatar
        }
      };
    });

    res.status(200).json({
      success: true,
      pagination: {
        total: totalCalls,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(totalCalls / Number(limit))
      },
      history: formattedCalls
    });

  } catch (error) {
    next(error);
  }
};


export const getMyProfile = async (req: any, res: Response, next: NextFunction) => {
  try {
    const userId = req.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        wallet: true,
        subscription: {
          where: { isActive: true },
          include: { plan: true }
        }
      }
    });

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    res.status(200).json({ success: true, user });
  } catch (error) {
    next(error);
  }
};


export const updateProfile = async (req: any, res: Response, next: NextFunction) => {
  try {
    const userId = req.user.id;
    const { name, age, gender, bio, phone } = req.body;
    
    let { interests, language } = req.body;
    if (typeof interests === 'string') interests = JSON.parse(interests);
    if (typeof language === 'string') language = JSON.parse(language);

    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true }
    });

    if (!existingUser){
        return next(new AppError('User not found', 404));
    }

    let avatarPath = existingUser.profile?.avatar;
    if (req.file) {
      if (avatarPath) {
        deleteFile(avatarPath); 
      }
      const folderName = req.file.destination.split(/[\\/]/).pop();
      avatarPath = `/uploads/${folderName}/${req.file.filename}`;
    }

    const updatedProfile = await prisma.profile.update({
      where: { userId },
      data: {
        name,
        age: Number(age),
        gender,
        interests,
        language,
        bio,
        phone,
        avatar: avatarPath,
        updatedAt: new Date()
      }
    });

    res.status(200).json({ success: true, message: 'Profile updated successfully', profile: updatedProfile });

  } catch (error) {
    if (req.file) {
      const folderName = req.file.destination.split(/[\\/]/).pop();
      deleteFile(`/uploads/${folderName}/${req.file.filename}`);
    }
    next(error);
  }
};