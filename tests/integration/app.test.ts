import request from 'supertest';
import app from '../../src/app';
import { pool } from '../../src/config/db';
import { redisClient } from '../../src/config/redis';

describe('Conzumex integration tests', () => {
  it('serves Swagger documentation', async () => {
    const response = await request(app).get('/api/docs/');
    expect(response.status).toBe(200);
    expect(response.text).toContain('Swagger');
  });

  it('protects wallet routes without authentication', async () => {
    const response = await request(app).get('/api/wallets');
    expect(response.status).toBe(401);
  });

  it('returns a JWT token for login', async () => {
    const credentials = {
      email: `test-${Date.now()}@example.com`,
      password: 'password',
      name: 'Test User',
    };

    await request(app)
      .post('/api/auth/register')
      .send(credentials);

    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: credentials.email, password: credentials.password });

    expect(response.status).toBe(200);
    expect(response.body.token).toBeDefined();
  });

  it('creates one wallet per user and supports add/deduct transactions', async () => {
    const email = `wallet-${Date.now()}-${Math.random().toString(36).slice(2, 10)}@example.com`;
    const password = 'password123';

    await request(app)
      .post('/api/auth/register')
      .send({ email, password });

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email, password });

    const token = login.body.token;

    const createWalletResponse = await request(app)
      .post('/api/wallets')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Primary Wallet', currency: 'USD' });

    expect(createWalletResponse.status).toBe(201);
    expect(createWalletResponse.body.balance).toBe(0);

    const createSecondWalletResponse = await request(app)
      .post('/api/wallets')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Second Wallet', currency: 'EUR' });

    expect(createSecondWalletResponse.status).toBe(409);

    const addMoneyResponse = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: 100, description: 'Initial deposit' });

    expect(addMoneyResponse.status).toBe(201);
    expect(addMoneyResponse.body.amount).toBe(100);

    const walletAfterDeposit = await request(app)
      .get('/api/wallets')
      .set('Authorization', `Bearer ${token}`);

    expect(walletAfterDeposit.status).toBe(200);
    expect(walletAfterDeposit.body.balance).toBe(100);

    const debitResponse = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: -50, description: 'Withdrawal' });

    expect(debitResponse.status).toBe(201);
    expect(debitResponse.body.amount).toBe(-50);

    const insufficientResponse = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: -1000, description: 'Overdraft attempt' });

    expect(insufficientResponse.status).toBe(400);
    expect(insufficientResponse.body.message).toContain('Insufficient balance');

    const transactionsResponse = await request(app)
      .get('/api/transactions')
      .set('Authorization', `Bearer ${token}`);

    expect(transactionsResponse.status).toBe(200);
    expect(Array.isArray(transactionsResponse.body)).toBe(true);
    expect(transactionsResponse.body.length).toBeGreaterThanOrEqual(2);
  });

  it('supports wallet tokens and token-based wallet access for the wallet owner only', async () => {
    const email = `token-${Date.now()}-${Math.random().toString(36).slice(2, 10)}@example.com`;
    const password = 'password123';

    await request(app).post('/api/auth/register').send({ email, password });

    const login = await request(app).post('/api/auth/login').send({ email, password });
    const token = login.body.token;

    const walletResponse = await request(app)
      .post('/api/wallets')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Token Wallet', currency: 'USD' });

    expect(walletResponse.status).toBe(201);
    expect(walletResponse.body.tokens).toBeDefined();
    expect(walletResponse.body.tokens.length).toBe(1);

    const walletToken = walletResponse.body.tokens[0];

    const walletByToken = await request(app)
      .get(`/api/wallets/token/${walletToken}`)
      .set('Authorization', `Bearer ${token}`);

    expect(walletByToken.status).toBe(200);
    expect(walletByToken.body.id).toBe(walletResponse.body.id);

    const createTokenResponse = await request(app)
      .post('/api/wallets/tokens')
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(createTokenResponse.status).toBe(201);
    expect(createTokenResponse.body.token).toBeDefined();

    const tokenListResponse = await request(app)
      .get('/api/wallets/tokens')
      .set('Authorization', `Bearer ${token}`);

    expect(tokenListResponse.status).toBe(200);
    expect(tokenListResponse.body.length).toBe(2);

    await request(app)
      .post('/api/wallets/tokens')
      .set('Authorization', `Bearer ${token}`)
      .send();

    const limitTokenResponse = await request(app)
      .post('/api/wallets/tokens')
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(limitTokenResponse.status).toBe(400);
    expect(limitTokenResponse.body.message).toContain('Wallet token limit reached');

    const transactionResponse = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: 50, description: 'Token deposit' });

    expect(transactionResponse.status).toBe(201);

    const tokenTransactionResponse = await request(app)
      .post(`/api/transactions/token/${walletToken}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: 25, description: 'Token deposit by token' });

    expect(tokenTransactionResponse.status).toBe(201);
    expect(tokenTransactionResponse.body.amount).toBe(25);

    const historyByToken = await request(app)
      .get(`/api/transactions/token/${walletToken}`)
      .set('Authorization', `Bearer ${token}`);

    expect(historyByToken.status).toBe(200);
    expect(Array.isArray(historyByToken.body)).toBe(true);
    expect(historyByToken.body.some((tx: any) => tx.amount === 25)).toBe(true);

    const secondEmail = `other-${Date.now()}-${Math.random().toString(36).slice(2, 10)}@example.com`;
    await request(app).post('/api/auth/register').send({ email: secondEmail, password });
    const secondLogin = await request(app).post('/api/auth/login').send({ email: secondEmail, password });
    const secondToken = secondLogin.body.token;

    const unauthorizedWalletByToken = await request(app)
      .get(`/api/wallets/token/${walletToken}`)
      .set('Authorization', `Bearer ${secondToken}`);

    expect(unauthorizedWalletByToken.status).toBe(404);
  });

  afterAll(async () => {
    try {
      await pool.end();
    } catch {
      // ignore pool shutdown errors
    }

    try {
      await redisClient.disconnect();
    } catch {
      // ignore disconnect errors
    }
  });
});
