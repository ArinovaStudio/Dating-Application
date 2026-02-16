import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { AppError } from './utils/AppError';
import globalErrorHandler from './middlewares/error.middleware';

// routes
import authRoutes from './routes/auth.routes';
import adminRoutes from './routes/admin.routes';
import userRoutes from './routes/user.routes';
import subscriptionRoutes from "./routes/subscription.routes";
import chatRoutes from './routes/chat.routes';
import { seedUsers } from './controllers/seed.controller';

const app = express();

app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true 
}));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());
app.use('/uploads', express.static('public/uploads'));

app.get('/', (req, res) => {
  res.status(200).json({ success: true, message: 'Backend is running successfully' });
});

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/user', userRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/chat', chatRoutes);

// seeding 
// app.post('/api/seed', seedUsers);

app.use((req: Request, res: Response, next: NextFunction) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

export default app;