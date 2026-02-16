import { Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';
import { AppError } from '../utils/AppError';
import { Gender } from '@prisma/client';

export const getOnlineMatches = async (req: any, res: Response, next: NextFunction) => {
  try {
    const userId = req.user.id;

    const myUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true }
    });

    if (!myUser?.profile) {
      return next(new AppError('Please complete your profile to find matches', 400));
    }

    const { age: myAge, gender, language: myLanguages } = myUser.profile;

    let targetGenders: Gender[];
    if (gender === 'MALE') targetGenders = [Gender.FEMALE];
    else if (gender === 'FEMALE') targetGenders = [Gender.MALE];
    else targetGenders = [Gender.MALE, Gender.FEMALE, Gender.OTHER];

    const matches = await prisma.user.findMany({
      where: {
        id: { not: userId },
        isOnline: true,
        role: 'USER',
        blockedBy: { none: { blockerId: userId } },
        blocking: { none: { blockedId: userId } },
        profile: {
          gender: { in: targetGenders },
        }
      },
      select: {
        id: true,
        username: true,
        isOnline: true,
        profile: {
          select: {
            name: true,
            avatar: true,
            age: true,
            gender: true,
            language: true,
            bio: true
          }
        }
      },
      take: 100
    });

    // sorting based on language and age gap
    const sortedMatches = matches.sort((a, b) => {
      const profileA = a.profile;
      const profileB = b.profile;

      if (!profileA || !profileB) return 0;

      const aSharesLanguage = profileA.language.some(lang => myLanguages.includes(lang));
      const bSharesLanguage = profileB.language.some(lang => myLanguages.includes(lang));

      if (aSharesLanguage && !bSharesLanguage) return -1;
      if (!aSharesLanguage && bSharesLanguage) return 1;

      const gapA = Math.abs(profileA.age - myAge);
      const gapB = Math.abs(profileB.age - myAge);

      return gapA - gapB;
    });

    res.status(200).json({ success: true, matches: sortedMatches });

  } catch (error) {
    next(error);
  }
};