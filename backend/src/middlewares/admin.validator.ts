import { body } from 'express-validator';

export const adminValidators = {
  createPlan: [
    body('name')
    .trim().notEmpty()
    .withMessage('Plan name is required'),
      
    body('price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
      
    body('durationDays')
    .isInt({ min: 1 })
    .withMessage('Duration must be at least 1 day'),
      
    body('messageDelay')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Message delay must be a positive integer (seconds)'),
      
    body('maxImagesPerDay')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Max images must be at least 1'),
      
    body('canSendVideo')
    .optional()
    .isBoolean()
    .withMessage('canSendVideo must be a boolean'),
      
    body('canAudioCall')
    .optional()
    .isBoolean()
    .withMessage('canAudioCall must be a boolean'),
      
    body('canVideoCall')
    .optional()
    .isBoolean()
    .withMessage('canVideoCall must be a boolean'),
  ],

  
  updatePlan: [
    body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Plan name cannot be empty'),
      
    body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
      
    body('durationDays')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Duration must be at least 1 day'),

    body('messageDelay')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Message delay must be a positive integer (seconds)'),
      
    body('maxImagesPerDay')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Max images must be at least 1'),
      
    body('canSendVideo')
    .optional()
    .isBoolean()
    .withMessage('canSendVideo must be a boolean'),
      
    body('canAudioCall')
    .optional()
    .isBoolean()
    .withMessage('canAudioCall must be a boolean'),
      
    body('canVideoCall')
    .optional()
    .isBoolean()
    .withMessage('canVideoCall must be a boolean'),
  ],

  updateConfig: [
    body('callCostPerMinute')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Call cost must be a positive integer'),
      
    body('defaultFreeDelay')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Default delay must be a positive integer'),
  ]
};