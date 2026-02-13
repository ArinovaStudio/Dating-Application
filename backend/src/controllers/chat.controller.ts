import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';
import { AppError } from '../utils/AppError';
import { getIO } from '../socket';
import { deleteFile } from '../utils/file.util';

// 1 on 1 chat creation
export const createPrivateChat = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { targetUserId } = req.body;
    const myId = req.user.id;

    const checkUser = await prisma.user.findUnique({ where: { id: targetUserId } });

    if (!checkUser) {
      return next(new AppError('User not found', 404));
    }

    if (myId === targetUserId) {
      return next(new AppError('You cannot chat with yourself', 400));
    }

    const existing = await prisma.conversation.findFirst({
      where: {
        type: 'PRIVATE',
        AND: [
          { participants: { some: { userId: myId } } },
          { participants: { some: { userId: targetUserId } } }
        ]
      }
    });

    if (existing) {
      return res.status(200).json({ success: true, message: 'Private chat started', conversationId: existing.id });
    }

    const newChat = await prisma.conversation.create({
      data: {
        type: 'PRIVATE',
        participants: {
          create: [{ userId: myId }, { userId: targetUserId }]
        }
      }
    });

    res.status(201).json({ success: true, message: 'Private chat started', conversationId: newChat.id });

  } catch (error) {
    next(error);
  }
};

// group chat creation
export const createGroupChat = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { name, description, participantIds } = req.body; 
    const myId = req.user.id;

    if (!name || !participantIds || participantIds.length === 0) {
      return next(new AppError('Group name and at least 1 participant required', 400));
    }

    // 100 members limit
    if (participantIds.length + 1 > 100) {
      return next(new AppError('A group cannot have more than 100 members.', 400));
    }

    const participantsData = [
      { userId: myId, role: 'ADMIN' as const },
      ...participantIds.map((id: string) => ({ userId: id, role: 'MEMBER' as const }))
    ];

    let groupAvatar = null;
    if (req.file) {
      groupAvatar = `/uploads/${req.file.destination.split('/').pop()}/${req.file.filename}`;
    }

    const newGroup = await prisma.conversation.create({
      data: {
        type: 'GROUP',
        name,
        description,
        groupAvatar,
        participants: { create: participantsData }
      }
    });

    res.status(201).json({ success: true, message: 'Group chat created', conversationId: newGroup.id });

  } catch (error) {
    next(error);
  }
};

// get current user conversation
export const getMyConversations = async (req: any, res: Response, next: NextFunction) => {
  try {
    const myId = req.user.id;
    const { search } = req.query;

    let whereClause: any = {
      participants: { some: { userId: myId } },
    };

    if (search) {
      whereClause = {
        ...whereClause,
        OR: [
          { 
            type: 'GROUP', 
            name: { contains: String(search), mode: 'insensitive' } 
          },
          {
            type: 'PRIVATE',
            participants: {
              some: {
                userId: { not: myId }, // The other person
                user: { username: { contains: String(search), mode: 'insensitive' } }
              }
            }
          }
        ]
      };
    }

    const conversations = await prisma.conversation.findMany({
      where: whereClause,
      include: {
        messages: {
          take: 1, 
          orderBy: { createdAt: 'desc' }
        },
        participants: {
          where: { userId: { not: myId } },
          include: {
            user: {
              select: { 
                id: true, 
                username: true, 
                isOnline: true, 
                lastSeen: true, 
                profile: { select: { avatar: true } } 
              }
            }
          }
        }
      },
      orderBy: { updatedAt: 'desc' } 
    });

    const formattedConversations = conversations.map((conv) => {
      let displayName = conv.name;
      let displayAvatar = conv.groupAvatar;
      let isOnline = false;
      let targetUserId = null;

      if (conv.type === 'PRIVATE' && conv.participants.length > 0) {
        const otherUser = conv.participants[0].user;
        displayName = otherUser.username;
        displayAvatar = otherUser.profile?.avatar || null;
        isOnline = otherUser.isOnline;
        targetUserId = otherUser.id;
      }

      return {
        id: conv.id,
        type: conv.type,
        name: displayName,
        avatar: displayAvatar,
        isOnline,
        targetUserId, 
        latestMessage: conv.messages[0],
        updatedAt: conv.updatedAt
      };
    });

    res.status(200).json({ success: true, conversations: formattedConversations });

  } catch (error) {
    next(error);
  }
};

// messages of particular conversation
export const getMessages = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { conversationId } = req.params;
    const myId = req.user.id;

    const isParticipant = await prisma.participant.findUnique({
      where: { userId_conversationId: { userId: myId, conversationId } }
    });

    if (!isParticipant){
        return next(new AppError('Access denied', 403));
    }

    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      include: { sender: { select: { id: true, username: true } } }
    });

    res.status(200).json({ success: true, message: 'Messages fetched', messages });
  } catch (error) {
    next(error);
  }
};

const PHONE_REGEX = /(\+\d{1,2}\s?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/;
const URL_REGEX = /(https?:\/\/[^\s]+)/g;

// send message in chat (group or private)
export const sendMessage = async (req: any, res: Response, next: NextFunction) => {
  try {
    const senderId = req.user.id;
    const { conversationId, content, type } = req.body;
    const isPaid = req.user.isPaidMember;

    const isParticipant = await prisma.participant.findUnique({
      where: { userId_conversationId: { userId: senderId, conversationId } }
    });

    if (!isParticipant){
        return next(new AppError('You are not in this chat', 403));
    }

    let finalContent = content;
    let finalType = type || 'TEXT';

    if (finalType === 'TEXT') {
      if (PHONE_REGEX.test(content) || URL_REGEX.test(content)) {
        return next(new AppError('Sharing phone numbers or links is prohibited.', 400));
      }
    }

    if (req.file) {
      finalContent = `/uploads/${req.file.destination.split('/').pop()}/${req.file.filename}`;
      if (req.file.mimetype.startsWith('image')) finalType = 'IMAGE';
      else if (req.file.mimetype.startsWith('video')) finalType = 'VIDEO';
      else if (req.file.mimetype.startsWith('audio')) finalType = 'AUDIO';

      if (!isPaid && (finalType === 'VIDEO' || finalType === 'AUDIO')) {
        return next(new AppError('Upgrade to Premium to send Videos/Audio!', 403));
      }
    }

    let delay = 0;
    if (!isPaid) {
      delay = Math.floor(Math.random() * (20000 - 8000 + 1) + 8000); // 8-20s
    }

    const processMessage = async () => {
      const newMessage = await prisma.message.create({
        data: { senderId, conversationId, content: finalContent, type: finalType },
        include: { sender: { select: { username: true, id: true } } }
      });

      await prisma.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() }
      });

      const io = getIO();
      io.to(conversationId).emit('receive_message', newMessage);
    };

    if (delay > 0) {
      setTimeout(async () => { await processMessage(); }, delay);
    } else {
      await processMessage();
    }

    res.status(201).json({ success: true, message: 'Message sent' });

  } catch (error) {
    next(error);
  }
};

// delete message
export const deleteMessage = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { messageId } = req.params;
    const myId = req.user.id;

    const message = await prisma.message.findUnique({ where: { id: messageId } });

    if (!message){
        return next(new AppError('Message not found', 404));
    }

    if (message.senderId !== myId){
        return next(new AppError('You can only delete your own messages', 403));
    }

    if (message.type !== 'TEXT' && message.content) {
        deleteFile(message.content);
    }

    await prisma.message.delete({
      where: { id: messageId },
    });

    const io = getIO();
    io.to(message.conversationId).emit('message_deleted', { messageId });

    res.status(200).json({ success: true, message: 'Message deleted' });
  } catch (error) {
    next(error);
  }
};

// add memebers in group
export const addGroupMembers = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { conversationId } = req.params;
    const { userIds }: { userIds: string[] } = req.body; 
    const myId = req.user.id;

    const myParticipant = await prisma.participant.findUnique({
      where: { userId_conversationId: { userId: myId, conversationId } }
    });

    if (!myParticipant || myParticipant.role !== 'ADMIN') {
      return next(new AppError('Only group admins can add members', 403));
    }

    const currentMemberCount = await prisma.participant.count({
      where: { conversationId }
    });

    if (currentMemberCount + userIds.length > 100) {
      return next(new AppError(`Cannot add members. Group limit is 100. Currently at ${currentMemberCount} members.`, 400));
    }

    const newParticipants = userIds.map((id: string) => ({ userId: id, conversationId }));
    
    await prisma.participant.createMany({
      data: newParticipants,
      skipDuplicates: true 
    });

    res.status(200).json({ success: true, message: 'Members added successfully' });
  } catch (error) {
    next(error);
  }
};

// remove members in group
export const removeGroupMember = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { conversationId } = req.params;
    const { userIdToRemove }: { userIdToRemove: string } = req.body;
    const myId = req.user.id;

    const myParticipant = await prisma.participant.findUnique({
      where: { userId_conversationId: { userId: myId, conversationId } }
    });

    if (!myParticipant || myParticipant.role !== 'ADMIN') {
      return next(new AppError('Only group admins can remove members', 403));
    }

    await prisma.participant.delete({
      where: { userId_conversationId: { userId: userIdToRemove, conversationId } }
    });

    res.status(200).json({ success: true, message: 'Member removed successfully' });
  } catch (error) {
    next(error);
  }
};

// update group role
export const updateGroupRole = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { conversationId } = req.params;
    const { role, targetUserId } = req.body; 
    const myId = req.user.id;

    const myParticipant = await prisma.participant.findUnique({
      where: { userId_conversationId: { userId: myId, conversationId } }
    });

    if (!myParticipant || myParticipant.role !== 'ADMIN') {
      return next(new AppError('Only group admins can change roles', 403));
    }

    await prisma.participant.update({
      where: { userId_conversationId: { userId: targetUserId, conversationId } },
      data: { role }
    });

    res.status(200).json({ success: true, message: `Role updated to ${role}` });
  } catch (error) {
    next(error);
  }
};

// leave group
export const leaveGroup = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { conversationId } = req.params;
    const myId = req.user.id;

    const myParticipant = await prisma.participant.findUnique({
      where: { userId_conversationId: { userId: myId, conversationId } },
      include: { conversation: { include: { participants: true } } }
    });

    if (!myParticipant) {
      return next(new AppError('You are not a member of this group', 403));
    }

    const allParticipants = myParticipant.conversation.participants;

    // if you are the only member, delete the group
    if (allParticipants.length === 1) {
      if (myParticipant.conversation.groupAvatar){
        deleteFile(myParticipant.conversation.groupAvatar);
      }
      
      const mediaMessages = await prisma.message.findMany({
        where: { conversationId, type: { not: 'TEXT' } }
      });
      mediaMessages.forEach(msg => deleteFile(msg.content));

      await prisma.message.deleteMany({ where: { conversationId } });
      await prisma.participant.deleteMany({ where: { conversationId } });
      await prisma.conversation.delete({ where: { id: conversationId } });

      return res.status(200).json({ success: true, message: 'You left and the empty group was deleted.' });
    }

    if (myParticipant.role === 'ADMIN') {
      const otherAdmins = allParticipants.filter(p => p.userId !== myId && p.role === 'ADMIN');
      
      if (otherAdmins.length === 0) {
        return next(new AppError('You are the only admin. Please assign another admin before leaving.', 400));
      }
    }

    await prisma.participant.delete({ where: { userId_conversationId: { userId: myId, conversationId } } });

    res.status(200).json({ success: true, message: 'You left the group' });
  } catch (error) {
    next(error);
  }
};

// get group participants
export const getGroupParticipants = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { conversationId } = req.params;
    const { search } = req.query; 
    const myId = req.user.id;

    const myParticipant = await prisma.participant.findUnique({
      where: { userId_conversationId: { userId: myId, conversationId } }
    });

    if (!myParticipant) {
      return next(new AppError('You are not a member of this group', 403));
    }

    let userFilter: any = undefined;
    if (search) {
      userFilter = {
        OR: [
          { username: { contains: String(search), mode: 'insensitive' } },
          { profile: { name: { contains: String(search), mode: 'insensitive' } } }
        ]
      };
    }

    const participants = await prisma.participant.findMany({
      where: {
        conversationId,
        user: userFilter 
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            isOnline: true,
            lastSeen: true,
            profile: {
              select: { name: true, avatar: true }
            }
          }
        }
      },
      orderBy: [
        { role: 'asc' },
        { joinedAt: 'asc' } 
      ]
    });

    const formattedParticipants = participants.map(p => ({
      userId: p.user.id,
      username: p.user.username,
      name: p.user.profile?.name || null,
      avatar: p.user.profile?.avatar || null,
      role: p.role,
      isOnline: p.user.isOnline,
      lastSeen: p.user.lastSeen,
      joinedAt: p.joinedAt
    }));

    res.status(200).json({ success: true, participants: formattedParticipants });

  } catch (error) {
    next(error);
  }
};

// update a group
export const editGroup = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { conversationId } = req.params;
    const { name, description } = req.body;
    const myId = req.user.id;

    const myParticipant = await prisma.participant.findUnique({
      where: { userId_conversationId: { userId: myId, conversationId } },
      include: { conversation: true }
    });

    if (!myParticipant || myParticipant.role !== 'ADMIN') {
      return next(new AppError('Only group admins can edit the group', 403));
    }

    let groupAvatar = myParticipant.conversation.groupAvatar;

    if (req.file) {
      if (groupAvatar) deleteFile(groupAvatar);
      groupAvatar = `/uploads/${req.file.destination.split('/').pop()}/${req.file.filename}`;
    }

    const updatedGroup = await prisma.conversation.update({
      where: { id: conversationId },
      data: { name, description, groupAvatar }
    });

    res.status(200).json({ success: true, message: 'Group updated successfully', group: updatedGroup });
  } catch (error) {
    next(error);
  }
};

// delete a group
export const deleteGroup = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { conversationId } = req.params;
    const myId = req.user.id;

    const myParticipant = await prisma.participant.findUnique({
      where: { userId_conversationId: { userId: myId, conversationId } },
      include: { conversation: { include: { messages: true } } }
    });

    if (!myParticipant || myParticipant.role !== 'ADMIN') {
      return next(new AppError('Only group admins can delete the group', 403));
    }

    const conversation = myParticipant.conversation;

    if (conversation.groupAvatar) deleteFile(conversation.groupAvatar);

    const mediaMessages = conversation.messages.filter(m => m.type !== 'TEXT' && m.content);
    mediaMessages.forEach(m => deleteFile(m.content));

    await prisma.message.deleteMany({ where: { conversationId } });
    await prisma.participant.deleteMany({ where: { conversationId } });
    await prisma.conversation.delete({ where: { id: conversationId } });

    res.status(200).json({ success: true, message: 'Group deleted successfully' });
  } catch (error) {
    next(error);
  }
};