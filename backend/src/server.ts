import dotenv from 'dotenv';

dotenv.config();

import app from './app';
import http from 'http';
import { prisma } from './config/prisma';
import { initSocket } from './socket';

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    const server = http.createServer(app);

    initSocket(server);

    await prisma.$connect();
    console.log('Database connected successfully');

    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
    
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);
  }
};

startServer();