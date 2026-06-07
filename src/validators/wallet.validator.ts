import { body } from 'express-validator';
import { validateRequest } from '../middleware/validation.middleware';

export const validateWallet = [
  body('name').isString().withMessage('Wallet name is required'),
  body('currency').isString().withMessage('Currency is required'),
  validateRequest,
];
