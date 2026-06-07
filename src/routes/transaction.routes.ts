import { Router } from 'express';
import { listTransactions, createTransaction, listTransactionsByToken, createTransactionByToken } from '../controllers/transaction.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateTransaction } from '../validators';

const router = Router();

/**
 * @openapi
 * /api/transactions:
 *   get:
 *     tags:
 *       - Transactions
 *     summary: List transactions for the authenticated user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Transactions retrieved successfully
 */
router.get('/', authenticate, listTransactions);

/**
 * @openapi
 * /api/transactions/token/{token}:
 *   get:
 *     tags:
 *       - Transactions
 *     summary: List transactions for a wallet identified by token
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Transactions retrieved successfully by wallet token
 */
router.get('/token/:token', authenticate, listTransactionsByToken);

/**
 * @openapi
 * /api/transactions:
 *   post:
 *     tags:
 *       - Transactions
 *     summary: Create a transaction for the authenticated user
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *                 description: Positive values add money, negative values deduct money
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Transaction created successfully
 */
router.post('/', authenticate, validateTransaction, createTransaction);

/**
 * @openapi
 * /api/transactions/token/{token}:
 *   post:
 *     tags:
 *       - Transactions
 *     summary: Create a transaction for a wallet token
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *                 description: Positive values add money, negative values deduct money
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Transaction created successfully for wallet token
 */
router.post('/token/:token', authenticate, validateTransaction, createTransactionByToken);

export default router;
