import { Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';
import { AppError } from '../utils/AppError';
import { Gender } from '@prisma/client';
import { matchQueue } from '../services/queue.service';
import { getIO } from '../socket';

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

    let targetGenders: Gender;
    if (gender === 'MALE') targetGenders = Gender.FEMALE;
    else if (gender === 'FEMALE') targetGenders = Gender.MALE;
    else targetGenders = Gender.OTHER;

    const matches = await prisma.user.findMany({
      where: {
        id: { not: userId },
        isOnline: true,
        role: 'USER',
        blockedBy: { none: { blockerId: userId } },
        blocking: { none: { blockedId: userId } },
        profile: {
          gender: targetGenders,
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

export const searchRandomMatch = async (req: any, res: Response, next: NextFunction) => {
  try {
    const userId = req.user.id;
    const { socketId } = req.body;

    if (!socketId) {
        return next(new AppError('Socket ID is required', 400));
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true }
    });

    if (!user?.profile) {
      return next(new AppError('Please complete your profile first', 400));
    }

    const myGender = user.profile.gender;

    const partner = matchQueue.findMatch(myGender);

    if (partner) {
      let conversationId = '';

      const existingConversation = await prisma.conversation.findFirst({
        where: {
          type: 'PRIVATE',
          AND: [
            { participants: { some: { userId: userId } } },
            { participants: { some: { userId: partner.userId } } }
          ]
        }
      });

      if (existingConversation) {
        conversationId = existingConversation.id;
      } else {
        const newConversation = await prisma.conversation.create({
          data: {
            type: 'PRIVATE',
            participants: {
              create: [
                { userId: userId },
                { userId: partner.userId }
              ]
            }
          }
        });
        conversationId = newConversation.id;
      }

      const io = getIO();
      io.to(partner.socketId).emit('random_match_found', {
        conversationId: conversationId,
        partnerId: userId
      });

      return res.status(200).json({ success: true, matchFound: true, conversationId: conversationId, partnerId: partner.userId });
    }

    matchQueue.enqueue(userId, socketId, myGender);
    matchQueue.print();

    res.status(200).json({ success: true, matchFound: false, message: 'You are now in the queue for a match' });

  } catch (error) {
    next(error);
  }
};


export const cancelSearch = async (req: any, res: Response, next: NextFunction) => {
  try {
    const userId = req.user.id;
    
    matchQueue.remove(userId);

    res.status(200).json({ success: true, message: 'Removed from queue' });
  } catch (error) {
    next(error);
  }
};