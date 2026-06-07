import { Router } from 'express';
import {
  getWallet,
  createWallet,
  listWalletTokens,
  createWalletToken,
  getWalletByToken,
} from '../controllers/wallet.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateWallet } from '../validators/wallet.validator';

const router = Router();

/**
 * @openapi
 * /api/wallets:
 *   get:
 *     tags:
 *       - Wallet
 *     summary: Retrieve a user's wallet
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Wallet retrieved successfully
 */
router.get('/', authenticate, getWallet);

/**
 * @openapi
 * /api/wallets:
 *   post:
 *     tags:
 *       - Wallet
 *     summary: Create a new wallet
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               currency:
 *                 type: string
 *     responses:
 *       201:
 *         description: Wallet created successfully
 */
router.post('/', authenticate, validateWallet, createWallet);

/**
 * @openapi
 * /api/wallets/tokens:
 *   get:
 *     tags:
 *       - Wallet
 *     summary: List wallet tokens for the authenticated user's wallet
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of wallet tokens
 */
router.get('/tokens', authenticate, listWalletTokens);

/**
 * @openapi
 * /api/wallets/tokens:
 *   post:
 *     tags:
 *       - Wallet
 *     summary: Create a new wallet token for the authenticated user's wallet
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Wallet token created successfully
 */
router.post('/tokens', authenticate, createWalletToken);

/**
 * @openapi
 * /api/wallets/token/{token}:
 *   get:
 *     tags:
 *       - Wallet
 *     summary: Retrieve a wallet by its token for the authenticated user
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
 *         description: Wallet retrieved successfully by token
 */
router.get('/token/:token', authenticate, getWalletByToken);

export default router;
