import { Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';
import { AppError } from '../utils/AppError';
import { deleteFile } from '../utils/file.util';

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