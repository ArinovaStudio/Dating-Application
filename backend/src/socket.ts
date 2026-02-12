import { Server } from 'socket.io';
import http from 'http';

let io: Server;

export const initSocket = (server: http.Server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "*",
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', (socket) => {

    // Join a specific chat room
    socket.on('join_room', (roomId) => {
      socket.join(roomId);
      console.log(`User ${socket.id} joined room ${roomId}`);
    });

    socket.on('disconnect', () => {
      console.log('User Disconnected', socket.id);
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