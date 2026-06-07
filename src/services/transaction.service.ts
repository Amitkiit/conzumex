import { TransactionRepository } from '../repositories/transaction.repository';
import { WalletRepository } from '../repositories/wallet.repository';
import { cache } from '../utils/cache';

const transactionRepository = new TransactionRepository();
const walletRepository = new WalletRepository();

export class TransactionService {
  async listByUserId(userId: string | undefined) {
    if (!userId) throw new Error('User not authenticated');

    const cacheKey = `transactions:${userId}`;
    const cached = await cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const transactions = await transactionRepository.findByUserId(userId);
    await cache.set(cacheKey, transactions, 120);
    return transactions;
  }

  async listByWalletToken(userId: string | undefined, token: string) {
    if (!userId) throw new Error('User not authenticated');

    const wallet = await walletRepository.findByToken(token, userId);
    if (!wallet) {
      throw new Error('Wallet token not found');
    }

    return transactionRepository.findByWalletToken(token, userId);
  }

  async create(userId: string | undefined, data: any) {
    if (!userId) throw new Error('User not authenticated');
    const transaction = await transactionRepository.create(userId, data);
    await cache.del(`transactions:${userId}`);
    await cache.del(`wallet:${userId}`);
    return transaction;
  }

  async createByWalletToken(userId: string | undefined, token: string, data: any) {
    if (!userId) throw new Error('User not authenticated');

    const wallet = await walletRepository.findByToken(token, userId);
    if (!wallet) {
      throw new Error('Wallet token not found');
    }

    const transaction = await transactionRepository.createByWalletToken(userId, token, data);
    await cache.del(`transactions:${userId}`);
    await cache.del(`wallet:${userId}`);
    return transaction;
  }
}
