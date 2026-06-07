import { randomUUID } from 'crypto';
import { pool } from '../config/db';
import { Transaction } from '../types/models';

export class TransactionRepository {
  async findByUserId(userId: string): Promise<Transaction[]> {
    const [rows] = await pool.execute<any[]>(
      'SELECT id, wallet_id AS walletId, user_id AS userId, amount, description, created_at AS createdAt FROM transactions WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );

    return rows.map((row) => ({
      ...row,
      amount: Number(row.amount),
    })) as Transaction[];
  }

  async findByWalletId(walletId: string): Promise<Transaction[]> {
    const [rows] = await pool.execute<any[]>(
      'SELECT id, wallet_id AS walletId, user_id AS userId, amount, description, created_at AS createdAt FROM transactions WHERE wallet_id = ? ORDER BY created_at DESC',
      [walletId]
    );

    return rows.map((row) => ({
      ...row,
      amount: Number(row.amount),
    })) as Transaction[];
  }

  async findByWalletToken(token: string, userId: string): Promise<Transaction[]> {
    const [rows] = await pool.execute<any[]>(
      `SELECT tr.id, tr.wallet_id AS walletId, tr.user_id AS userId, tr.amount, tr.description, tr.created_at AS createdAt
       FROM transactions tr
       JOIN wallet_tokens wt ON wt.wallet_id = tr.wallet_id
       JOIN wallets w ON w.id = tr.wallet_id
       WHERE wt.token = ? AND w.user_id = ?
       ORDER BY tr.created_at DESC`,
      [token, userId]
    );

    return rows.map((row) => ({
      ...row,
      amount: Number(row.amount),
    })) as Transaction[];
  }

  async create(userId: string, data: { amount: number; description?: string }): Promise<Transaction> {
    const amount = Number(data.amount);
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const [walletRows] = await connection.execute<any[]>(
        'SELECT id, balance FROM wallets WHERE user_id = ? FOR UPDATE',
        [userId]
      );

      if (!walletRows.length) {
        throw new Error('Wallet not found for user');
      }

      const walletId = walletRows[0].id;
      const currentBalance = Number(walletRows[0].balance);
      const newBalance = currentBalance + amount;

      if (newBalance < 0) {
        throw new Error('Insufficient balance');
      }

      const id = randomUUID();

      await connection.execute(
        'INSERT INTO transactions (id, wallet_id, user_id, amount, description) VALUES (?, ?, ?, ?, ?)',
        [id, walletId, userId, amount, data.description || '']
      );

      await connection.execute(
        'UPDATE wallets SET balance = ? WHERE id = ?',
        [newBalance, walletId]
      );

      await connection.commit();

      return {
        id,
        walletId,
        userId,
        amount,
        description: data.description ?? '',
        createdAt: new Date().toISOString(),
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async createByWalletToken(userId: string, token: string, data: { amount: number; description?: string }): Promise<Transaction> {
    const amount = Number(data.amount);
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const [walletRows] = await connection.execute<any[]>(
        `SELECT w.id, w.balance
         FROM wallets w
         JOIN wallet_tokens wt ON wt.wallet_id = w.id
         WHERE wt.token = ? AND w.user_id = ?
         FOR UPDATE`,
        [token, userId]
      );

      if (!walletRows.length) {
        throw new Error('Wallet not found for token');
      }

      const walletId = walletRows[0].id;
      const currentBalance = Number(walletRows[0].balance);
      const newBalance = currentBalance + amount;

      if (newBalance < 0) {
        throw new Error('Insufficient balance');
      }

      const id = randomUUID();

      await connection.execute(
        'INSERT INTO transactions (id, wallet_id, user_id, amount, description) VALUES (?, ?, ?, ?, ?)',
        [id, walletId, userId, amount, data.description || '']
      );

      await connection.execute(
        'UPDATE wallets SET balance = ? WHERE id = ?',
        [newBalance, walletId]
      );

      await connection.commit();

      return {
        id,
        walletId,
        userId,
        amount,
        description: data.description ?? '',
        createdAt: new Date().toISOString(),
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}
