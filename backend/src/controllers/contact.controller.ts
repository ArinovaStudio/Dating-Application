import { Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';
import { AppError } from '../utils/AppError';

export const addContact = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { contactId, name } = req.body;  // contactId = userId of target user
    const myId = req.user.id;

    if (myId === contactId) {
        return next(new AppError('You cannot add yourself as a contact', 400));
    }

    const userExists = await prisma.user.findUnique({ where: { id: contactId } });
    if (!userExists) {
        return next(new AppError('User not found', 404));
    }

    const existingContact = await prisma.contact.findUnique({ 
        where: { userId_contactId: { userId: myId, contactId } } 
    });

    if (existingContact) {
        return next(new AppError('Contact already exists', 400));
    }

    const contact = await prisma.contact.create({
      data: { 
          userId: myId, 
          contactId, 
          name: name || userExists.username, 
          isFavorite: false 
      },
    });

    res.status(201).json({ success: true, message: 'Contact added', contact });
  } catch (error) {
    next(error);
  }
};

export const removeContact = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { contactId } = req.params;
    const myId = req.user.id;

    const existingContact = await prisma.contact.findUnique({ 
        where: { userId_contactId: { userId: myId, contactId } } 
    });

    if (!existingContact) {
        return next(new AppError('Contact not found', 400));
    }

    await prisma.contact.delete({
      where: { userId_contactId: { userId: myId, contactId } },
    });

    res.status(200).json({ success: true, message: 'Contact removed' });
  } catch (error) {
    next(error);
  }
};

export const toggleFavorite = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { contactId } = req.params;
    const { isFavorite } = req.body;
    const myId = req.user.id;

    const existingContact = await prisma.contact.findUnique({ 
        where: { userId_contactId: { userId: myId, contactId } } 
    });

    if (!existingContact) {
        return next(new AppError('Contact not found', 400));
    }

    const updatedContact = await prisma.contact.update({
      where: { userId_contactId: { userId: myId, contactId } },
      data: { isFavorite },
    });

    res.status(200).json({ success: true, message: 'Favorite status updated', contact: updatedContact });
  } catch (error) {
    next(error);
  }
};

export const updateContactName = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { contactId } = req.params;
    const { name } = req.body; 
    const myId = req.user.id;

    const existingContact = await prisma.contact.findUnique({ 
        where: { userId_contactId: { userId: myId, contactId } } 
    });

    if (!existingContact) {
        return next(new AppError('Contact not found', 400));
    }

    const updatedContact = await prisma.contact.update({
      where: { userId_contactId: { userId: myId, contactId } },
      data: { name },
    });

    res.status(200).json({ success: true, message: 'Contact name updated', contact: updatedContact });
  } catch (error) {
    next(error);
  }
};

export const getContacts = async (req: any, res: Response, next: NextFunction) => {
  try {
    const myId = req.user.id;
    const { search, favoritesOnly } = req.query; 

    let whereClause: any = { userId: myId };

    if (favoritesOnly === 'true') {
      whereClause.isFavorite = true;
    }

    if (search) {
      whereClause.OR = [
        { name: { contains: String(search), mode: 'insensitive' } },
        { contact: { username: { contains: String(search), mode: 'insensitive' } } },
        { contact: { profile: { name: { contains: String(search), mode: 'insensitive' } } } }
      ];
    }

    const contacts = await prisma.contact.findMany({
      where: whereClause,
      include: {
        contact: {
          select: { id: true, username: true, isOnline: true, lastSeen: true, profile: { select: { name: true, avatar: true } } }
        }
      }
    });

    const myPrivateConversations = await prisma.conversation.findMany({
      where: {
        type: 'PRIVATE',
        participants: { some: { userId: myId } }
      },
      include: {
        participants: true,
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          select: { createdAt: true }
        }
      }
    });

    const latestMessageMap = new Map<string, Date>();
    
    myPrivateConversations.forEach(conv => {

      const otherParticipant = conv.participants.find(p => p.userId !== myId);

      if (otherParticipant && conv.messages.length > 0) {
        latestMessageMap.set(otherParticipant.userId, conv.messages[0].createdAt);
      }
    });

    const formatted = contacts.map(c => {

      const lastMsgDate = latestMessageMap.get(c.contactId) || new Date(0); 

      return {
        contactId: c.contactId,
        isFavorite: c.isFavorite,
        customName: c.name, 
        displayName: c.name || c.contact.profile?.name || c.contact.username, 
        username: c.contact.username,
        avatar: c.contact.profile?.avatar,
        isOnline: c.contact.isOnline,
        lastSeen: c.contact.lastSeen,
        contactCreatedAt: c.createdAt,
        latestMessageAt: lastMsgDate 
      };
    });

    formatted.sort((a, b) => {
      const timeA = a.latestMessageAt.getTime();
      const timeB = b.latestMessageAt.getTime();
      
      if (timeA !== timeB) {
        return timeB - timeA;
      }

      if (a.isFavorite !== b.isFavorite) {
        return a.isFavorite ? -1 : 1;
      }

      return b.contactCreatedAt.getTime() - a.contactCreatedAt.getTime();
    });

    res.status(200).json({ success: true, contacts: formatted });
  } catch (error) {
    next(error);
  }
};