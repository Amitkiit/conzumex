import mysql from 'mysql2/promise';
import { env } from './env';
import logger from '../utils/logger';

export const dbConfig = {
  host: env.dbHost,
  port: Number(env.dbPort),
  user: env.dbUser,
  password: env.dbPassword,
  database: env.dbName,
};

const rootPool = mysql.createPool({
  host: dbConfig.host,
  port: dbConfig.port,
  user: dbConfig.user,
  password: dbConfig.password,
  waitForConnections: true,
  connectionLimit: 1,
  queueLimit: 0,
});

export const pool = mysql.createPool({
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
  const connection = await rootPool.getConnection();
  try {
    await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\``);
  } finally {
    connection.release();
    await rootPool.end();
  }
};

export const connectDatabase = async () => {
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

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS wallet_tokens (
        id VARCHAR(36) PRIMARY KEY,
        wallet_id VARCHAR(36) NOT NULL,
        token VARCHAR(128) NOT NULL UNIQUE,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (wallet_id) REFERENCES wallets(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    logger.info('MySQL schema initialized');
  } finally {
    connection.release();
  }
};
