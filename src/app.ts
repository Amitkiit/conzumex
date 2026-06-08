import express from 'express';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';

import authRoutes from './routes/auth.routes';
import walletRoutes from './routes/wallet.routes';
import transactionRoutes from './routes/transaction.routes';

import { errorHandler } from './middleware/error.middleware';
import { rateLimiter } from './middleware/rateLimiter.middleware';
import { swaggerSpec } from './config/swagger';

const app = express();

app.use(helmet());
app.use(rateLimiter);
app.use(express.json());

app.get('/swagger-json', (_req, res) => {
  res.json(swaggerSpec);
});

app.use(
  '/api/docs',
  swaggerUi.serve,
  swaggerUi.setup(undefined, {
    swaggerOptions: {
      url: '/swagger-json',
    },
  })
);

app.use('/api/auth', authRoutes);
app.use('/api/wallets', walletRoutes);
app.use('/api/transactions', transactionRoutes);

app.use(errorHandler);

export default app;