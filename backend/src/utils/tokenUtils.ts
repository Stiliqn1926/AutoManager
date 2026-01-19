/**
 * ============================================
 * TOKEN UTILITIES
 * ============================================
 * Този файл съдържа helper функции за работа с tokens:
 * - Генериране на refresh tokens
 * - Проверка дали token е в blacklist
 * - Добавяне на token в blacklist
 * - Cleanup на изтекли токени
 */

import crypto from 'crypto';
import prisma from '../config/database';
import { verifyToken } from './generateToken';

/**
 * Генерира криптографски сигурен random refresh token
 *
 * Как работи:
 * 1. crypto.randomBytes(40) - генерира 40 random bytes
 * 2. .toString('hex') - преобразува bytes в hexadecimal string (80 символа)
 *
 * Защо 40 bytes?
 * - 40 bytes = 320 bits entropy
 * - Това е много по-силно от стандартните 128-bit (16 bytes)
 * - Практически невъзможно за brute force
 *
 * @returns Уникален 80-символен hexadecimal string
 */
export const generateRefreshToken = (): string => {
  return crypto.randomBytes(40).toString('hex');
};

/**
 * Запазва refresh token в базата данни
 *
 * Flow:
 * 1. Генерира random token string
 * 2. Изчислява expiration date (30 дни от сега)
 * 3. Записва в DB с връзка към user
 *
 * @param userId - ID на user-а
 * @returns Обект с token string и expiration date
 */
export const createRefreshToken = async (
  userId: string,
  days: number = 30,
  expiresAtOverride?: Date
) => {
  // ?????????? ???????? token
  const token = generateRefreshToken();

  // ?????????? ???? ?? ???????? (?? ???????????? days ??????)
  const expiresAt = expiresAtOverride ? new Date(expiresAtOverride) : new Date();
  if (!expiresAtOverride) {
    expiresAt.setDate(expiresAt.getDate() + days);
  }

  // ????????? refresh token ? ??????
  const refreshToken = await prisma.refreshToken.create({
    data: {
      token,
      userId,
      expiresAt,
    },
  });

  return refreshToken;
};

/**
 * Валидира refresh token
 *
 * Проверки:
 * 1. Токенът съществува в DB?
 * 2. Не е изтекъл?
 * 3. Принадлежи към активен user?
 *
 * @param token - Refresh token string
 * @returns RefreshToken обект или null ако е невалиден
 */
export const validateRefreshToken = async (token: string) => {
  // ?????? refresh token ? ??????
  const refreshToken = await prisma.refreshToken.findUnique({
    where: { token },
    include: {
      user: true,
    },
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

/**
 * Изтрива refresh token (при logout)
 *
 * Защо изтриваме?
 * - След logout, user не трябва да може да refresh-ва access token
 * - Това е механизмът за "забравяне" на сесията
 *
 * @param token - Refresh token string
 */
export const revokeRefreshToken = async (token: string) => {
  try {
    await prisma.refreshToken.updateMany({
      where: { token, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  } catch (error) {
    // Ако токенът не съществува, не е проблем
    // Може вече да е изтрит или никога да не е съществувал
  }
};

/**
 * Изтрива ВСИЧКИ refresh tokens на user (при смяна на парола)
 *
 * Use case:
 * - User сменя парола
 * - Искаме да invalidate-нем ВСИЧКИ сесии
 * - Принудителен re-login на всички devices
 *
 * @param userId - ID на user-а
 */
export const revokeAllUserRefreshTokens = async (userId: string) => {
  await prisma.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
};

/**
 * Проверява дали JWT access token е в blacklist
 *
 * Важно:
 * - Тази функция се вика при ВСЯКА API заявка
 * - Трябва да е максимално бърза!
 * - Затова имаме index на token колоната
 *
 * @param token - JWT access token
 * @returns true ако е blacklisted, false otherwise
 */
export const isTokenBlacklisted = async (token: string): Promise<boolean> => {
  // Търсим токена в blacklist
  const blacklisted = await prisma.blacklistedToken.findUnique({
    where: { token },
  });

  // Ако е намерен - токенът е blacklisted
  return blacklisted !== null;
};

/**
 * Добавя JWT access token в blacklist
 *
 * Кога се използва?
 * 1. При logout - добавяме текущия token
 * 2. При смяна на парола - добавяме token-а
 * 3. При admin revoke - admin анулира token на user
 *
 * Как работи:
 * 1. Decode-ваме токена за да вземем exp (expiration) и userId
 * 2. Записваме в blacklist с expiration date
 * 3. След exp date можем да изтрием записа (cleanup)
 *
 * @param token - JWT access token
 * @param reason - Причина за blacklist (за logging)
 */
export const blacklistToken = async (
  token: string,
  reason: string = 'logout'
) => {
  try {
    // Decode-ваме токена за да вземем информация
    const decoded = verifyToken(token);

    // decoded.exp е в seconds, трябва да го преобразуваме в Date
    // exp е Unix timestamp (секунди от 1970)
    const expiresAt = new Date(decoded.exp! * 1000); // * 1000 за milliseconds

    // Записваме в blacklist
    await prisma.blacklistedToken.create({
      data: {
        token,
        expiresAt,
        userId: decoded.userId,
      },
    });
  } catch (error) {
    // Ако token-ът е вече expired или invalid, не можем да го blacklist-нем
    // Това не е проблем - expired токени така или иначе не работят
    console.warn('Could not blacklist token:', error);
  }
};

/**
 * Cleanup функция - изтрива изтекли токени от DB
 *
 * Защо е нужна?
 * - Refresh tokens и blacklisted tokens се натрупват във времето
 * - След експирацията им вече не са нужни
 * - Това освобождава място в DB и ускорява queries
 *
 * Кога да я викаш?
 * - От cron job (всеки ден)
 * - Или на всеки X requests
 *
 * Какво изтрива?
 * 1. Изтекли refresh tokens
 * 2. Изтекли blacklisted tokens
 * 3. Използвани password reset codes (старше от 24 часа)
 */
export const cleanupExpiredTokens = async () => {
  const now = new Date();

  try {
    // Изтриваме изтекли refresh tokens
    const deletedRefreshTokens = await prisma.refreshToken.deleteMany({
      where: {
        expiresAt: { lt: now }, // lt = less than (по-малко от)
      },
    });

    // Изтриваме изтекли blacklisted tokens
    const deletedBlacklisted = await prisma.blacklistedToken.deleteMany({
      where: {
        expiresAt: { lt: now },
      },
    });

    // Изтриваме стари password reset codes (изтекли)
    const deletedPasswordResets = await prisma.passwordReset.deleteMany({
      where: {
        expiresAt: { lt: now },           // Изтекли
      },
    });

    // Log какво сме изтрили (за мониторинг)
    console.log(`Cleanup completed:
      - Refresh tokens: ${deletedRefreshTokens.count}
      - Blacklisted tokens: ${deletedBlacklisted.count}
      - Password resets: ${deletedPasswordResets.count}
    `);

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
