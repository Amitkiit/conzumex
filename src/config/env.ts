import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: process.env.PORT || '3000',
  dbHost: process.env.DB_HOST || '127.0.0.1',
  dbPort: process.env.DB_PORT || '3306',
  dbUser: process.env.DB_USER || 'root',
  dbPassword: process.env.DB_PASSWORD || '',
  dbName: process.env.DB_NAME || 'conzumex',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  jwtSecret: process.env.JWT_SECRET || 'change-me',
  rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || '60000'),
  rateLimitMax: Number(process.env.RATE_LIMIT_MAX || '100'),
};
