import crypto from 'crypto';

/**
 * Generates a cryptographically secure verification token.
 */
export const generateVerificationToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

