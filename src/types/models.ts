export interface User {
  id: string;
  email: string;
  password: string;
  createdAt: string;
}

export interface Wallet {
  id: string;
  userId: string;
  name: string;
  currency: string;
  balance: number;
  createdAt: string;
  tokens?: string[];
}

export interface WalletToken {
  id: string;
  walletId: string;
  token: string;
  createdAt: string;
}

export interface Transaction {
  id: string;
  walletId: string;
  userId: string;
  amount: number;
  description: string;
  createdAt: string;
}

export interface WalletToken {
  id: string;
  walletId: string;
  token: string;
  createdAt: string;
}
