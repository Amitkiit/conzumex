import Redis from 'ioredis';
import { env } from './env';
import logger from '../utils/logger';

export const redisClient = new Redis(env.redisUrl, {
  lazyConnect: true,
  enableOfflineQueue: false,
  maxRetriesPerRequest: 0,
  retryStrategy() {
    return null;
  },
  reconnectOnError() {
    return false;
  },
});

redisClient.on('error', (error) => {
  logger.warn('Redis error event: %o', error);
  if (redisClient.status !== 'ready') {
    try {
      redisClient.disconnect();
    } catch {
      // ignore disconnect errors
    }
  }
});

redisClient.on('connect', () => {
  logger.info('Redis client connected');
});

export const connectRedis = async () => {
  if (!env.redisUrl) {
    logger.warn('No Redis URL configured; skipping Redis connection');
    return;
  }

  try {
    await redisClient.connect();
    await redisClient.ping();
    logger.info(`Connected to Redis at ${env.redisUrl}`);
  } catch (error) {
    logger.warn('Redis connection failed, continuing without cache');
    try {
      await redisClient.disconnect();
    } catch {
      // ignore disconnect errors
    }
  }
};
