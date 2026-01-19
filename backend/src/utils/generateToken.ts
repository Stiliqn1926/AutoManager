import jwt from 'jsonwebtoken';

/**
 * TokenPayload interface
 *
 * 🆕 Добавени exp, iat, nbf - стандартни JWT claims
 * Те се добавят автоматично от jwt.sign() но са нужни за TypeScript
 */
export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  serviceCompanyId?: string;
  tokenVersion?: number;
  // JWT стандартни claims (добавени автоматично)
  exp?: number; // Expiration time (Unix timestamp)
  iat?: number; // Issued at (Unix timestamp)
  nbf?: number; // Not before (Unix timestamp)
}

/**
 * Генерира JWT токен
 * @param payload - данни за потребителя
 * @param expiresIn - срок на валидност
 *
 * 🆕 ПРОМЯНА:
 * Добавено '15m' за access tokens (кратък живот)
 * '30d' и '90d' остават за backward compatibility
 */
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

/**
 * Верифицира JWT токен
 * @param token - JWT токен
 */
export const verifyToken = (token: string): TokenPayload => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error('JWT_SECRET is not defined');
  }

  return jwt.verify(token, secret, { algorithms: ['HS256'] }) as TokenPayload;
};