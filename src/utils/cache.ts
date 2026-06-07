import { redisClient } from '../config/redis';

const isRedisReady = () => redisClient.status === 'ready';

export const cache = {
  async get<T>(key: string): Promise<T | null> {
    if (!isRedisReady()) {
      return null;
    }

    try {
      const cached = await redisClient.get(key);
      return cached ? (JSON.parse(cached) as T) : null;
    } catch {
      return null;
    }
  },

  async set<T>(key: string, value: T, ttlSeconds = 60): Promise<void> {
    if (!isRedisReady()) {
      return;
    }

    try {
      await redisClient.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    } catch {
      // ignore cache failures
    }
  },

  async del(key: string): Promise<void> {
    if (!isRedisReady()) {
      return;
    }

    try {
      await redisClient.del(key);
    } catch {
      // ignore cache failures
    }
  },
};
