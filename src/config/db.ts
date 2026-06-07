import mysql from 'mysql2/promise';
import { env } from './env';
import logger from '../utils/logger';

export const isTestDatabase = env.nodeEnv === 'test' || process.env.JEST_WORKER_ID !== undefined;

export const dbConfig = {
  host: env.dbHost,
  port: Number(env.dbPort),
  user: env.dbUser,
  password: env.dbPassword,
  database: env.dbName,
};

const inMemoryData = {
  users: [] as Array<{ id: string; email: string; password: string; createdAt: string }>,
  wallets: [] as Array<{ id: string; userId: string; name: string; currency: string; balance: number; createdAt: string }>,
  walletTokens: [] as Array<{ id: string; walletId: string; token: string; createdAt: string }>,
  transactions: [] as Array<{ id: string; walletId: string; userId: string; amount: number; description: string; createdAt: string }>,
};

const executeInMemory = async (query: string, params: any[] = []) => {
  const normalized = query.trim().replace(/\s+/g, ' ').toLowerCase();

  if (normalized.startsWith('insert into users')) {
    const [id, email, password] = params;
    inMemoryData.users.push({ id, email, password, createdAt: new Date().toISOString() });
    return [[], []];
  }

  if (normalized.startsWith('select id, email, password, created_at as createdat from users where email = ?')) {
    const [email] = params;
    const user = inMemoryData.users.find((row) => row.email === email);
    return [[user ? { ...user } : undefined].filter(Boolean), []];
  }

  if (normalized.startsWith('select id, user_id as userid, name, currency, balance, created_at as createdat from wallets where user_id = ?')) {
    const [userId] = params;
    const wallet = inMemoryData.wallets.find((row) => row.userId === userId);
    if (!wallet) return [[].slice(), []];
    return [[{ ...wallet }], []];
  }

  if (normalized.startsWith('select w.id, w.user_id as userid, w.name, w.currency, w.balance, w.created_at as createdat from wallets w join wallet_tokens wt on wt.wallet_id = w.id where wt.token = ? and w.user_id = ? limit 1')) {
    const [token, userId] = params;
    const tokenRow = inMemoryData.walletTokens.find((row) => row.token === token);
    if (!tokenRow) return [[].slice(), []];
    const wallet = inMemoryData.wallets.find((row) => row.id === tokenRow.walletId && row.userId === userId);
    if (!wallet) return [[].slice(), []];
    return [[{ ...wallet }], []];
  }

  if (normalized.startsWith('select token from wallet_tokens where wallet_id = ? order by created_at asc')) {
    const [walletId] = params;
    const rows = inMemoryData.walletTokens
      .filter((row) => row.walletId === walletId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      .map((row) => ({ token: row.token }));
    return [rows, []];
  }

  if (normalized.startsWith('select count(*) as count from wallet_tokens where wallet_id = ?')) {
    const [walletId] = params;
    const count = inMemoryData.walletTokens.filter((row) => row.walletId === walletId).length;
    return [[{ count }], []];
  }

  if (normalized.startsWith('insert into wallets')) {
    const [id, userId, name, currency] = params;
    inMemoryData.wallets.push({ id, userId, name, currency, balance: 0, createdAt: new Date().toISOString() });
    return [[], []];
  }

  if (normalized.startsWith('insert into wallet_tokens')) {
    const [id, walletId, token] = params;
    inMemoryData.walletTokens.push({ id, walletId, token, createdAt: new Date().toISOString() });
    return [[], []];
  }

  if (normalized.startsWith('select id, balance from wallets where user_id = ? for update')) {
    const [userId] = params;
    const wallet = inMemoryData.wallets.find((row) => row.userId === userId);
    return [[wallet ? { id: wallet.id, balance: wallet.balance } : undefined].filter(Boolean), []];
  }

  if (normalized.startsWith('select w.id, w.balance from wallets w join wallet_tokens wt on wt.wallet_id = w.id where wt.token = ? and w.user_id = ? for update')) {
    const [token, userId] = params;
    const tokenRow = inMemoryData.walletTokens.find((row) => row.token === token);
    if (!tokenRow) return [[].slice(), []];
    const wallet = inMemoryData.wallets.find((row) => row.id === tokenRow.walletId && row.userId === userId);
    return [[wallet ? { id: wallet.id, balance: wallet.balance } : undefined].filter(Boolean), []];
  }

  if (normalized.startsWith('insert into transactions')) {
    const [id, walletId, userId, amount, description] = params;
    inMemoryData.transactions.push({ id, walletId, userId, amount: Number(amount), description: description ?? '', createdAt: new Date().toISOString() });
    return [[], []];
  }

  if (normalized.startsWith('update wallets set balance = ? where id = ?')) {
    const [balance, id] = params;
    const wallet = inMemoryData.wallets.find((row) => row.id === id);
    if (wallet) wallet.balance = Number(balance);
    return [[], []];
  }

  if (normalized.startsWith('select id, wallet_id as walletid, user_id as userid, amount, description, created_at as createdat from transactions where user_id = ? order by created_at desc')) {
    const [userId] = params;
    const rows = inMemoryData.transactions
      .filter((row) => row.userId === userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((row) => ({ ...row }));
    return [rows, []];
  }

  if (normalized.startsWith('select id, wallet_id as walletid, user_id as userid, amount, description, created_at as createdat from transactions where wallet_id = ? order by created_at desc')) {
    const [walletId] = params;
    const rows = inMemoryData.transactions
      .filter((row) => row.walletId === walletId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((row) => ({ ...row }));
    return [rows, []];
  }

  if (normalized.startsWith('select tr.id, tr.wallet_id as walletid, tr.user_id as userid, tr.amount, tr.description, tr.created_at as createdat from transactions tr join wallet_tokens wt on wt.wallet_id = tr.wallet_id join wallets w on w.id = tr.wallet_id where wt.token = ? and w.user_id = ? order by tr.created_at desc')) {
    const [token, userId] = params;
    const tokenRow = inMemoryData.walletTokens.find((row) => row.token === token);
    if (!tokenRow) return [[], []];
    const rows = inMemoryData.transactions
      .filter((row) => row.walletId === tokenRow.walletId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((row) => ({ ...row }));
    return [rows, []];
  }

  return [[], []];
};

const createTestConnection = async () => ({
  execute: executeInMemory,
  beginTransaction: async () => {},
  commit: async () => {},
  rollback: async () => {},
  ping: async () => {},
  release: async () => {},
});

const createTestPool = () => ({
  execute: executeInMemory,
  getConnection: async () => createTestConnection(),
  end: async () => {},
});

const rootPool = isTestDatabase
  ? null
  : mysql.createPool({
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      password: dbConfig.password,
      waitForConnections: true,
      connectionLimit: 1,
      queueLimit: 0,
    });

export const pool = isTestDatabase
  ? createTestPool()
  : mysql.createPool({
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      password: dbConfig.password,
      database: dbConfig.database,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });

const ensureDatabaseExists = async () => {
  if (isTestDatabase) return;
  const connection = await rootPool!.getConnection();
  try {
    await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\``);
  } finally {
    connection.release();
    await rootPool!.end();
  }
};

export const connectDatabase = async () => {
  if (isTestDatabase) {
    logger.info('Using in-memory test database');
    return;
  }

  try {
    await ensureDatabaseExists();
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    logger.info(`Connected to MySQL at ${dbConfig.host}:${dbConfig.port}`);
  } catch (error) {
    logger.warn('MySQL connection failed, continuing without database connection');
    logger.warn('%o', error);
  }
};

export const initializeDatabase = async () => {
  if (isTestDatabase) {
    return;
  }

  const connection = await pool.getConnection();
  try {
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(36) PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS wallets (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        name VARCHAR(100) NOT NULL,
        currency VARCHAR(10) NOT NULL,
        balance DECIMAL(15,2) NOT NULL DEFAULT 0,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS wallet_tokens (
        id VARCHAR(36) PRIMARY KEY,
        wallet_id VARCHAR(36) NOT NULL,
        token VARCHAR(255) NOT NULL UNIQUE,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (wallet_id) REFERENCES wallets(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS transactions (
        id VARCHAR(36) PRIMARY KEY,
        wallet_id VARCHAR(36) NOT NULL,
        user_id VARCHAR(36) NOT NULL,
        amount DECIMAL(15,2) NOT NULL,
        description TEXT,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (wallet_id) REFERENCES wallets(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    logger.info('MySQL schema initialized');
  } finally {
    connection.release();
  }
};
