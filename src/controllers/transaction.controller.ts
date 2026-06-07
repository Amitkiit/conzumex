import { Request, Response, NextFunction } from 'express';
import { TransactionService } from '../services/transaction.service';

const transactionService = new TransactionService();

export const listTransactions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const transactions = await transactionService.listByUserId(req.user?.id);
    res.json(transactions);
  } catch (error) {
    next(error);
  }
};

export const listTransactionsByToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const transactions = await transactionService.listByWalletToken(req.user?.id, req.params.token);
    res.json(transactions);
  } catch (error) {
    next(error);
  }
};

export const createTransaction = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const transaction = await transactionService.create(req.user?.id, req.body);
    res.status(201).json(transaction);
  } catch (error) {
    next(error);
  }
};

export const createTransactionByToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const transaction = await transactionService.createByWalletToken(req.user?.id, req.params.token, req.body);
    res.status(201).json(transaction);
  } catch (error) {
    next(error);
  }
};
