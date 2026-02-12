import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { AppError } from './utils/AppError';
import globalErrorHandler from './middlewares/error.middleware';

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


app.get('/', (req, res) => {
  res.status(200).json({ success: true, message: 'Backend is running successfully' });
});

app.use((req: Request, res: Response, next: NextFunction) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

export default app;