import { Server } from 'socket.io';
import http from 'http';
import { prisma } from './config/prisma';

let io: Server;

export const initSocket = (server: http.Server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "*",
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', (socket) => {
    socket.on('get_my_socketId', () => {
        socket.emit('my_socketId', socket.id);
    });

    socket.on('register_user', async (userId: string) => { // userId need to pass from frontend
      socket.data.userId = userId;

      await prisma.user.update({
        where: { id: userId },
        data: { isOnline: true }
      });

      io.emit('user_status', { userId, isOnline: true });
      console.log(`User Online: ${userId}`);
    });

    socket.on('join_room', (roomId) => { // conversationId need to pass from frontend
      socket.join(roomId);
    });

    socket.on('disconnect', async () => {
      const userId = socket.data.userId;
      
      if (userId) {

        await prisma.user.update({
          where: { id: userId },
          data: { isOnline: false, lastSeen: new Date() }
        });

        io.emit('user_status', { userId, isOnline: false, lastSeen: new Date() });
        console.log(`User Offline: ${userId}`);
      }
    });
  });

  return io;
};


export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};