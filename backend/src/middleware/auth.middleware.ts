import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/generateToken';
import prisma from '../config/database';
import { isTokenBlacklisted } from '../utils/tokenUtils';

interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
    serviceCompanyId?: string;
  };
}

type CachedUser = {
  id: string;
  isActive: boolean;
  tokenVersion: number;
};

type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

const USER_CACHE_TTL_MS = Number(process.env.AUTH_USER_CACHE_TTL_MS || 5000);
const BLACKLIST_HIT_TTL_MS = Number(
  process.env.AUTH_BLACKLIST_HIT_TTL_MS || 60000
);
const BLACKLIST_MISS_TTL_MS = Number(
  process.env.AUTH_BLACKLIST_MISS_TTL_MS || 2000
);
const CACHE_MAX_ENTRIES = Number(process.env.AUTH_CACHE_MAX_ENTRIES || 5000);
const CACHE_CLEANUP_EVERY = 200;

const userCache = new Map<string, CacheEntry<CachedUser>>();
const blacklistCache = new Map<string, CacheEntry<boolean>>();
let authRequestCounter = 0;

const cleanupExpiredEntries = (): void => {
  const now = Date.now();

  for (const [key, entry] of userCache.entries()) {
    if (entry.expiresAt <= now) {
      userCache.delete(key);
    }
  }

  for (const [key, entry] of blacklistCache.entries()) {
    if (entry.expiresAt <= now) {
      blacklistCache.delete(key);
    }
  }
};

const trimIfNeeded = <T>(cache: Map<string, CacheEntry<T>>): void => {
  while (cache.size > CACHE_MAX_ENTRIES) {
    const firstKey = cache.keys().next().value;
    if (!firstKey) {
      return;
    }
    cache.delete(firstKey);
  }
};

const getCachedValue = <T>(
  cache: Map<string, CacheEntry<T>>,
  key: string
): T | null => {
  const entry = cache.get(key);
  if (!entry) {
    return null;
  }

  if (entry.expiresAt <= Date.now()) {
    cache.delete(key);
    return null;
  }

  return entry.value;
};

const setCachedValue = <T>(
  cache: Map<string, CacheEntry<T>>,
  key: string,
  value: T,
  ttlMs: number
): void => {
  cache.set(key, {
    value,
    expiresAt: Date.now() + ttlMs,
  });
  trimIfNeeded(cache);
};

const getTokenBlacklistStatus = async (token: string): Promise<boolean> => {
  const cached = getCachedValue(blacklistCache, token);
  if (cached !== null) {
    return cached;
  }

  const blacklisted = await isTokenBlacklisted(token);
  setCachedValue(
    blacklistCache,
    token,
    blacklisted,
    blacklisted ? BLACKLIST_HIT_TTL_MS : BLACKLIST_MISS_TTL_MS
  );
  return blacklisted;
};

const getUserWithCache = async (userId: string): Promise<CachedUser | null> => {
  const cached = getCachedValue(userCache, userId);
  if (cached) {
    return cached;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      isActive: true,
      tokenVersion: true,
    },
  });

  if (!user) {
    return null;
  }

  setCachedValue(userCache, userId, user, USER_CACHE_TTL_MS);
  return user;
};

const markAuthRequest = (): void => {
  authRequestCounter += 1;
  if (authRequestCounter % CACHE_CLEANUP_EVERY === 0) {
    cleanupExpiredEntries();
  }
};

// Authentication middleware with blacklist check
export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.headers.authorization?.split(' ')[1] || req.cookies?.accessToken;

    if (!token) {
      res.status(401).json({ message: 'No token provided' });
      return;
    }

    markAuthRequest();

    const decoded = verifyToken(token);
    const blacklisted = await getTokenBlacklistStatus(token);

    if (blacklisted) {
      res.status(401).json({
        message: 'Token has been revoked. Please login again.',
      });
      return;
    }

    const user = await getUserWithCache(decoded.userId);

    if (!user || !user.isActive) {
      userCache.delete(decoded.userId);
      res.status(401).json({ message: 'Invalid or expired token' });
      return;
    }

    if (decoded.tokenVersion === undefined || decoded.tokenVersion !== user.tokenVersion) {
      userCache.delete(decoded.userId);
      res.status(401).json({ message: 'Token has been revoked. Please login again.' });
      return;
    }

    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};
