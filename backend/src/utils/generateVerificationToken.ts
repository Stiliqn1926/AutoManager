import crypto from 'crypto';

/**
 * Генерира уникален verification token
 */
export const generateVerificationToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};