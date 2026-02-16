import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';
import bcrypt from 'bcryptjs';

const MALE_NAMES = ["Aarav", "Vihaan", "Aditya", "Sai", "Reyansh", "Arjun", "Vivaan", "Rohan", "Kabir", "Ishaan"];
const FEMALE_NAMES = ["Aadya", "Diya", "Saanvi", "Ananya", "Kiara", "Pari", "Riya", "Myra", "Zara", "Amara"];
const BIO_SAMPLES = ["Loves traveling", "Coffee addict", "Tech enthusiast", "Music lover", "Gamer", "Foodie", "Fitness freak"];
const LANGUAGES = ["English", "Hindi", "Spanish", "French", "German"];

export const seedUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {

    const passwordHash = await bcrypt.hash('password', 12);
    const createdUsers = [];

    for (let i = 0; i < 10; i++) {
      const name = MALE_NAMES[i];
      const user = await prisma.user.create({
        data: {
          username: `${name.toLowerCase()}_${Math.floor(Math.random() * 1000)}`,
          email: `${name.toLowerCase()}${i}@example.com`,
          password: passwordHash,
          isVerified: true,
          isOnline: true, 
          role: 'USER',
          profile: {
            create: {
              name: name,
              age: Math.floor(Math.random() * (30 - 18 + 1)) + 18, 
              gender: 'MALE',
              interests: ['FEMALE'], 
              language: [LANGUAGES[Math.floor(Math.random() * LANGUAGES.length)]],
              bio: BIO_SAMPLES[Math.floor(Math.random() * BIO_SAMPLES.length)],
              avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`
            }
          },
          wallet: { create: { balance: 100 } },
          subscription: {
             create: {
               plan: {
                 connectOrCreate: {
                   where: { name: 'Free' },
                   create: { name: 'Free', price: 0, durationDays: 365, tokensIncluded: 0 }
                 }
               },
               endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1))
             }
          }
        }
      });
      createdUsers.push(user.username);
    }

    for (let i = 0; i < 10; i++) {
      const name = FEMALE_NAMES[i];
      const user = await prisma.user.create({
        data: {
          username: `${name.toLowerCase()}_${Math.floor(Math.random() * 1000)}`,
          email: `${name.toLowerCase()}${i}@example.com`,
          password: passwordHash,
          isVerified: true,
          isOnline: true, 
          role: 'USER',
          profile: {
            create: {
              name: name,
              age: Math.floor(Math.random() * (28 - 18 + 1)) + 18,
              gender: 'FEMALE',
              interests: ['MALE'], 
              language: [LANGUAGES[Math.floor(Math.random() * LANGUAGES.length)]],
              bio: BIO_SAMPLES[Math.floor(Math.random() * BIO_SAMPLES.length)],
              avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`
            }
          },
          wallet: { create: { balance: 100 } },
          subscription: {
             create: {
               plan: { connect: { name: 'Free' } },
               endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1))
             }
          }
        }
      });
      createdUsers.push(user.username);
    }

    res.status(201).json({ success: true, message: 'Seeding successful! Created 20 users' });

  } catch (error) {
    next(error);
  }
};