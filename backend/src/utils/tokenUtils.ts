// Token utilities for refresh tokens, blacklist, and cleanup

import crypto from 'crypto';
import prisma from '../config/database';
import { verifyToken } from './generateToken';

export const generateRefreshToken = (): string => {
  return crypto.randomBytes(40).toString('hex');
};

export const createRefreshToken = async (
  userId: string,
  days: number = 30,
  expiresAtOverride?: Date
) => {
  const token = generateRefreshToken();

  const expiresAt = expiresAtOverride ? new Date(expiresAtOverride) : new Date();
  if (!expiresAtOverride) {
    expiresAt.setDate(expiresAt.getDate() + days);
  }

  return prisma.refreshToken.create({
    data: { token, userId, expiresAt },
  });
};

// Returns token with user if valid, null otherwise
export const validateRefreshToken = async (token: string) => {
  const refreshToken = await prisma.refreshToken.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!refreshToken) {
    return null;
  }

  if (refreshToken.revokedAt || refreshToken.expiresAt < new Date()) {
    return null;
  }

  if (!refreshToken.user.isActive) {
    return null;
  }

  return refreshToken;
};

// Revoke single refresh token (logout)
export const revokeRefreshToken = async (token: string) => {
  try {
    await prisma.refreshToken.updateMany({
      where: { token, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  } catch {
    // Token may not exist, ignore
  }
};

// Revoke all user's refresh tokens (password change, force logout)
export const revokeAllUserRefreshTokens = async (userId: string) => {
  await prisma.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
};

// Check if access token is blacklisted (called on every request)
export const isTokenBlacklisted = async (token: string): Promise<boolean> => {
  const blacklisted = await prisma.blacklistedToken.findUnique({
    where: { token },
  });
  return blacklisted !== null;
};

// Add access token to blacklist (logout, password change)
export const blacklistToken = async (
  token: string,
  _reason: string = 'logout'
) => {
  try {
    const decoded = verifyToken(token);
    const expiresAt = new Date(decoded.exp! * 1000);

    await prisma.blacklistedToken.create({
      data: {
        token,
        expiresAt,
        userId: decoded.userId,
      },
    });
  } catch (error) {
    // Token already expired or invalid, no need to blacklist
    console.warn('Could not blacklist token:', error);
  }
};

// Delete expired tokens from DB (run via cron job)
export const cleanupExpiredTokens = async () => {
  const now = new Date();

  try {
    const deletedRefreshTokens = await prisma.refreshToken.deleteMany({
      where: { expiresAt: { lt: now } },
    });

    const deletedBlacklisted = await prisma.blacklistedToken.deleteMany({
      where: { expiresAt: { lt: now } },
    });

    const deletedPasswordResets = await prisma.passwordReset.deleteMany({
      where: { expiresAt: { lt: now } },
    });

    console.log(
      `Cleanup: ${deletedRefreshTokens.count} refresh, ${deletedBlacklisted.count} blacklisted, ${deletedPasswordResets.count} password resets`
    );

    return {
      refreshTokens: deletedRefreshTokens.count,
      blacklistedTokens: deletedBlacklisted.count,
      passwordResets: deletedPasswordResets.count,
    };
  } catch (error) {
    console.error('Cleanup failed:', error);
    throw error;
  }
};
