import { body } from 'express-validator';

export const userValidators = {
  updateProfile: [
    body('name')
    .optional()
    .trim().notEmpty().withMessage('Name cannot be empty'),
    
    body('age')
    .optional().isInt({ min: 18 }).withMessage('You must be at least 18 years old'),
    
    body('gender')
    .optional().isIn(['MALE', 'FEMALE', 'OTHER']).withMessage('Invalid Gender'),
    
    body('bio')
    .optional().trim().isLength({ max: 500 }).withMessage('Bio cannot exceed 500 characters'),

    body('interests')
    .optional().isArray().withMessage('Interests must be an array of Genders'),
    
    body('language')
    .optional().isArray().withMessage('Language must be an array of strings'),

    body('phone')
    .optional().isMobilePhone('any').withMessage('Valid phone number is required'),
  ],
};