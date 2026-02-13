import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/prisma';
import { AppError } from '../utils/AppError';
import { sendEmail } from '../utils/sendEmail';
import { emailTemplates } from '../templates/email.templates';
import { getIO } from '../socket';

const createSendToken = (user: any, statusCode: number, res: Response, message: string) => {
  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET!, {
    expiresIn: '7d',
  });

  const cookieOptions = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', 
  };

  res.cookie('token', token, cookieOptions); 

  user.password = undefined;

  res.status(statusCode).json({
    success: true,
    message,
    token,
    data: { user },
  });
};

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username, email, password } = req.body;

    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
    });

    if (existingUser) {
      return next(new AppError('Email or Username already taken', 400));
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const newUser = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        wallet: {
          create: { balance: 0 },
        },
      },
    });

    createSendToken(newUser, 201, res, 'User registered successfully');

  } catch (error) {
    next(error);
  }
};

export const sendOtp = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); 

    await prisma.otp.deleteMany({ where: { email } });
    
    await prisma.otp.create({ 
      data: { email, code: otpCode, expiresAt }
    });

    const emailSent = await sendEmail(
      email, 
      'Your Verification Code', 
      emailTemplates.verification(otpCode)
    );

    if (!emailSent) {
      return next(new AppError("Failed to send email", 500));
    }

    res.status(200).json({ success: true, message: 'OTP sent successfully' });

  } catch (error) {
    next(error);
  }
};

export const verifyOtp = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, otp } = req.body;

    const otpRecord = await prisma.otp.findFirst({
      where: { email },
    });

    if (!otpRecord || otpRecord.code !== otp) {
      return next(new AppError('Invalid OTP', 400));
    }

    if (otpRecord.expiresAt < new Date()) {
      return next(new AppError('OTP Expired', 400));
    }

    await prisma.user.update({
      where: { email },
      data: { isVerified: true },
    });

    await prisma.otp.deleteMany({ where: { email } });

    res.status(200).json({ success: true, message: "OTP verified successfully" });

  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(new AppError('Please provide email and password', 400));
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return next(new AppError('Incorrect email or password', 401));
    }

    createSendToken(user, 200, res, 'Logged in successfully');

  } catch (error) {
    next(error);
  }
};

export const completeProfile = async (req: any, res: Response, next: NextFunction) => {
  try {
    const userId = req.user.id; 

    const { name, phone, age, gender, interests, language } = req.body;

    const newProfile = await prisma.profile.create({
      data: {
        userId,
        name,
        phone,
        age,
        gender, 
        interests, 
        language,
      }
    });

    res.status(200).json({ success: true, message: 'Profile completed successfully', data: { profile: newProfile } });

  } catch (error) {
    next(error);
  }
};

export const logout = async (req: any, res: Response, next: NextFunction) => {
  try {
    const userId = req.user.id;

    await prisma.user.update({
      where: { id: userId },
      data: { 
        isOnline: false, 
        lastSeen: new Date() 
      }
    });

    const io = getIO();

    io.emit('user_status', { userId, isOnline: false, lastSeen: new Date() });

    const sockets = await io.fetchSockets();
    for (const socket of sockets) {
      if (socket.data.userId === userId) {
        socket.disconnect(true);
      }
    }

    res.clearCookie("token", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
    
    res.status(200).json({ 
      success: true, 
      message: 'Logged out successfully' 
    });

  } catch (error) {
    next(error);
  }
};