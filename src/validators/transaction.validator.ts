import { body } from 'express-validator';
import { validateRequest } from '../middleware/validation.middleware';

export const validateTransaction = [
  body('amount')
    .exists({ checkNull: true })
    .withMessage('Amount is required')
    .isNumeric()
    .withMessage('Amount must be a number')
    .custom((value) => Number(value) !== 0)
    .withMessage('Amount cannot be zero'),
  body('description')
    .optional()
    .isString()
    .withMessage('Description must be a string'),
  validateRequest,
];
