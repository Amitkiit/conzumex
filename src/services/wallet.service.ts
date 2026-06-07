import { WalletRepository } from '../repositories/wallet.repository';
import { cache } from '../utils/cache';

const walletRepository = new WalletRepository();

export class WalletService {
  async getWalletByUserId(userId: string | undefined) {
    if (!userId) throw new Error('User not authenticated');

    const cacheKey = `wallet:${userId}`;
    const cached = await cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const wallet = await walletRepository.findByUserId(userId);
    await cache.set(cacheKey, wallet, 120);
    return wallet;
  }

  async getWalletByToken(userId: string | undefined, token: string) {
    if (!userId) throw new Error('User not authenticated');

    const wallet = await walletRepository.findByToken(token, userId);
    if (!wallet) {
      throw new Error('Wallet token not found');
    }

    return wallet;
  }

  async createWallet(userId: string | undefined, data: any) {
    if (!userId) throw new Error('User not authenticated');
    const wallet = await walletRepository.create(userId, data);
    await cache.del(`wallet:${userId}`);
    return wallet;
  }

  async listWalletTokens(userId: string | undefined) {
    if (!userId) throw new Error('User not authenticated');

    const wallet = await walletRepository.findByUserId(userId);
    if (!wallet) {
      throw new Error('Wallet not found');
    }

    return wallet.tokens || [];
  }

  async createWalletToken(userId: string | undefined) {
    if (!userId) throw new Error('User not authenticated');

    const wallet = await walletRepository.findByUserId(userId);
    if (!wallet) {
      throw new Error('Wallet not found');
    }

    const token = await walletRepository.createToken(wallet.id);
    await cache.del(`wallet:${userId}`);
    return token;
  }
}
