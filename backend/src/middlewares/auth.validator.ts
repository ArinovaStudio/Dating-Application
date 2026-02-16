import { body } from 'express-validator';

export const authValidators = {
  register: [
    body('username').trim().notEmpty().withMessage('Username is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be 6+ chars'),
  ],
  
  otp: [
    body('email').notEmpty().isEmail().withMessage('Valid email is required'),
  ],
  
  verifyOtp: [
    body('email').notEmpty().isEmail().withMessage('Valid email is required'),
    body('otp').notEmpty().isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
  ],
  
  login: [
    body('email').notEmpty().isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  
  completeProfile: [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('phone').isMobilePhone('any').withMessage('Valid phone number is required'),
    body('gender').isIn(['MALE', 'FEMALE', 'OTHER']).withMessage('Invalid Gender'),
    body('age').isInt({ min: 18 }).withMessage('Age must be at least 18'),
    body('interests').isArray().withMessage('Interests must be an array'),
    body('language').isArray().withMessage('Languages must be an array'),
  ],

  forgotPassword: [
    body('email').isEmail().withMessage('Please provide a valid email')
  ],

  resetPassword: [
    body('email').notEmpty().isEmail().withMessage('Valid email is required'),
    body('otp').notEmpty().isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
    body('newPassword').isLength({ min: 6 }).withMessage('Password must be 6+ chars')
  ]
};