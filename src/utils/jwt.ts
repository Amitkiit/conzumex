import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export const generateToken = (payload: object) => {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: '1h' });
};

export const verifyToken = (token: string) => {
  return jwt.verify(token, env.jwtSecret) as any;
};
