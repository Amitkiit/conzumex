import { randomUUID } from 'crypto';
import { pool } from '../config/db';
import { Wallet } from '../types/models';

export class WalletRepository {
  async findByUserId(userId: string): Promise<Wallet | null> {
    const [rows] = await pool.execute<any[]>(
      'SELECT id, user_id AS userId, name, currency, balance, created_at AS createdAt FROM wallets WHERE user_id = ?',
      [userId]
    );

    if (!rows.length) {
      return null;
    }

    const wallet = rows[0] as Wallet;
    const tokens = await this.findTokensByWalletId(wallet.id);

    return {
      ...wallet,
      balance: Number(wallet.balance),
      tokens,
    };
  }

  async findByToken(token: string, userId: string): Promise<Wallet | null> {
    const [rows] = await pool.execute<any[]>(
      `SELECT w.id, w.user_id AS userId, w.name, w.currency, w.balance, w.created_at AS createdAt
       FROM wallets w
       JOIN wallet_tokens wt ON wt.wallet_id = w.id
       WHERE wt.token = ? AND w.user_id = ?
       LIMIT 1`,
      [token, userId]
    );

    if (!rows.length) {
      return null;
    }

    const wallet = rows[0] as Wallet;
    const tokens = await this.findTokensByWalletId(wallet.id);

    return {
      ...wallet,
      balance: Number(wallet.balance),
      tokens,
    };
  }

  async findTokensByWalletId(walletId: string): Promise<string[]> {
    const [rows] = await pool.execute<any[]>(
      'SELECT token FROM wallet_tokens WHERE wallet_id = ? ORDER BY created_at ASC',
      [walletId]
    );
    return rows.map((row) => row.token);
  }

  async create(userId: string, data: { name: string; currency: string }): Promise<Wallet> {
    const [existingRows] = await pool.execute<any[]>(
      'SELECT id FROM wallets WHERE user_id = ? LIMIT 1',
      [userId]
    );

    if (existingRows.length) {
      throw new Error('User already has a wallet');
    }

    const id = randomUUID();
    const token = randomUUID();

    await pool.execute(
      'INSERT INTO wallets (id, user_id, name, currency, balance) VALUES (?, ?, ?, ?, 0)',
      [id, userId, data.name, data.currency]
    );

    await pool.execute(
      'INSERT INTO wallet_tokens (id, wallet_id, token) VALUES (?, ?, ?)',
      [randomUUID(), id, token]
    );

    return {
      id,
      userId,
      name: data.name,
      currency: data.currency,
      balance: 0,
      createdAt: new Date().toISOString(),
      tokens: [token],
    };
  }

  async createToken(walletId: string): Promise<string> {
    const [countRows] = await pool.execute<any[]>(
      'SELECT COUNT(*) AS count FROM wallet_tokens WHERE wallet_id = ?',
      [walletId]
    );

    const count = Number(countRows[0]?.count ?? 0);
    if (count >= 3) {
      throw new Error('Wallet token limit reached');
    }

    const token = randomUUID();
    await pool.execute(
      'INSERT INTO wallet_tokens (id, wallet_id, token) VALUES (?, ?, ?)',
      [randomUUID(), walletId, token]
    );

    return token;
  }
}
