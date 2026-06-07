import { randomUUID } from 'crypto';
import { pool } from '../config/db';
import { hashPassword } from '../utils/password';
import { User } from '../types/models';

export class UserRepository {
  async create(data: { email: string; password: string }) {
    const id = randomUUID();
    const hashedPassword = hashPassword(data.password);

    await pool.execute(
      'INSERT INTO users (id, email, password) VALUES (?, ?, ?)',
      [id, data.email, hashedPassword]
    );

    return {
      id,
      email: data.email,
    };
  }

  async findByEmail(email: string): Promise<User | null> {
    const [rows] = await pool.execute<any[]>(
      'SELECT id, email, password, created_at AS createdAt FROM users WHERE email = ?',
      [email]
    );

    if (!rows.length) {
      return null;
    }

    return rows[0] as User;
  }
}
