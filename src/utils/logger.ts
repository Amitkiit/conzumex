import { createLogger, format, transports } from 'winston';
import { env } from '../config/env';

const logger = createLogger({
  level: env.nodeEnv === 'production' ? 'info' : 'debug',
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.errors({ stack: true }),
    format.splat(),
    format.json()
  ),
  defaultMeta: { service: 'conzumex-service' },
  transports: [
    new transports.Console({
      format: format.combine(
        format.colorize({ all: true }),
        format.simple()
      ),
    }),
  ],
});

export default logger;
