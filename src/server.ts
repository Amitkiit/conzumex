import app from './app';
import { env } from './config/env';
import { connectDatabase, initializeDatabase } from './config/db';
import { connectRedis } from './config/redis';
import logger from './utils/logger';

const startServer = async () => {
  await connectDatabase();
  await initializeDatabase();
  await connectRedis();

  app.listen(Number(env.port), () => {
    logger.info(`Server is running on http://localhost:${env.port}`);
  });
};

startServer().catch((error) => {
  logger.error('Server failed to start: %o', error);
  process.exit(1);
});
