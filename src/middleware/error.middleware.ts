import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  logger.error('Unhandled exception: %o', err);

  let status = 500;
  const message = err.message || 'Internal server error';

  if (message.includes('Unauthorized') || message.includes('Invalid token') || message.includes('User not authenticated') || message.includes('Invalid credentials')) {
    status = 401;
  } else if (message.includes('already has a wallet')) {
    status = 409;
  } else if (message.includes('Wallet not found') || message.includes('Wallet token not found')) {
    status = 404;
  } else if (message.includes('Insufficient balance') || message.includes('Amount cannot be zero') || message.includes('Wallet token limit reached')) {
    status = 400;
  }

  res.status(status).json({ message });
};
