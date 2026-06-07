import { Request, Response, NextFunction } from 'express';
import { WalletService } from '../services/wallet.service';

const walletService = new WalletService();

export const getWallet = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const wallet = await walletService.getWalletByUserId(req.user?.id);
    res.json(wallet);
  } catch (error) {
    next(error);
  }
};

export const createWallet = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const wallet = await walletService.createWallet(req.user?.id, req.body);
    res.status(201).json(wallet);
  } catch (error) {
    next(error);
  }
};

export const listWalletTokens = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tokens = await walletService.listWalletTokens(req.user?.id);
    res.json(tokens);
  } catch (error) {
    next(error);
  }
};

export const createWalletToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = await walletService.createWalletToken(req.user?.id);
    res.status(201).json({ token });
  } catch (error) {
    next(error);
  }
};

export const getWalletByToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const wallet = await walletService.getWalletByToken(req.user?.id, req.params.token);
    res.json(wallet);
  } catch (error) {
    next(error);
  }
};
