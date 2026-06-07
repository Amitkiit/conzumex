import { body } from 'express-validator';
import { validateRequest } from '../middleware/validation.middleware';

export const validateAuth = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isString().isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  validateRequest,
];
