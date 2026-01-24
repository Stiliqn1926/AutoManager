import jwt from 'jsonwebtoken';

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  serviceCompanyId?: string;
  tokenVersion?: number;
  exp?: number;
  iat?: number;
  nbf?: number;
}

export const generateToken = (
  payload: TokenPayload,
  expiresIn: '15m' | '30d' | '90d' = '30d'
): string => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error('JWT_SECRET is not defined');
  }

  return jwt.sign(payload, secret, { expiresIn });
};

export const verifyToken = (token: string): TokenPayload => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error('JWT_SECRET is not defined');
  }

  return jwt.verify(token, secret, { algorithms: ['HS256'] }) as TokenPayload;
};