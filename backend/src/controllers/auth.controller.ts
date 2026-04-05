/**
 * Authentication Controller
 *
 * Uses httpOnly cookies for refresh tokens (XSS protection).
 * Access tokens: 15 min, Refresh tokens: 30 days.
 */

import { Request, Response } from 'express';
import crypto from 'crypto';
import prisma from '../config/database';
import { hashPassword, comparePassword } from '../utils/hashPassword';
import { generateToken } from '../utils/generateToken';
import { validateEmailDomain } from '../utils/emailValidator';
import logger from '../services/logger.service';
import {
  createRefreshToken,
  validateRefreshToken,
  revokeRefreshToken,
  revokeAllUserRefreshTokens,
  blacklistToken,
} from '../utils/tokenUtils';

const PASSWORD_RESET_CODE_TTL_MINUTES = 15;
const EMAIL_VERIFICATION_CODE_TTL_MINUTES = 10;
const CODE_RESEND_COOLDOWN_SECONDS = 60;
const CODE_GENERATION_MAX_ATTEMPTS = 5;

const getExpiryDate = (minutes: number): Date =>
  new Date(Date.now() + minutes * 60 * 1000);

const getRecentCodeThreshold = (): Date =>
  new Date(Date.now() - CODE_RESEND_COOLDOWN_SECONDS * 1000);

const generateSixDigitCode = (): string =>
  crypto.randomInt(100000, 999999).toString();

const doesCodeConflictWithHashes = async (
  code: string,
  hashes: string[]
): Promise<boolean> => {
  for (const hash of hashes) {
    const isMatch = await comparePassword(code, hash);
    if (isMatch) return true;
  }

  return false;
};

const generateNonConflictingCodeForUser = async (
  userId: string
): Promise<string> => {
  const now = new Date();

  const [activePasswordResetCodes, activeEmailVerificationCodes] =
    await Promise.all([
      prisma.passwordReset.findMany({
        where: {
          userId,
          expiresAt: { gte: now },
        },
        select: { token: true },
      }),
      prisma.emailVerificationCode.findMany({
        where: {
          userId,
          type: 'EMAIL_VERIFICATION',
          usedAt: null,
          expiresAt: { gte: now },
        },
        select: { token: true },
      }),
    ]);

  const activeHashes = [
    ...activePasswordResetCodes.map((item) => item.token),
    ...activeEmailVerificationCodes.map((item) => item.token),
  ];

  for (let attempt = 0; attempt < CODE_GENERATION_MAX_ATTEMPTS; attempt += 1) {
    const code = generateSixDigitCode();
    const hasConflict = await doesCodeConflictWithHashes(code, activeHashes);

    if (!hasConflict) {
      return code;
    }
  }

  throw new Error('Неуспешно генериране на уникален код за потвърждение');
};

const sendPasswordResetCodeEmail = async (
  email: string,
  code: string,
  isResend = false
): Promise<void> => {
  const subject = isResend
    ? 'ÐÐ¾Ð² ÐºÐ¾Ð´ Ð·Ð° Ð²ÑŠÐ·ÑÑ‚Ð°Ð½Ð¾Ð²ÑÐ²Ð°Ð½Ðµ Ð½Ð° Ð¿Ð°Ñ€Ð¾Ð»Ð°'
    : 'ÐšÐ¾Ð´ Ð·Ð° Ð²ÑŠÐ·ÑÑ‚Ð°Ð½Ð¾Ð²ÑÐ²Ð°Ð½Ðµ Ð½Ð° Ð¿Ð°Ñ€Ð¾Ð»Ð°';
  const intro = isResend
    ? 'Ð’Ð°ÑˆÐ¸ÑÑ‚ Ð½Ð¾Ð² ÐºÐ¾Ð´ Ð·Ð° Ð²ÑŠÐ·ÑÑ‚Ð°Ð½Ð¾Ð²ÑÐ²Ð°Ð½Ðµ Ð½Ð° Ð¿Ð°Ñ€Ð¾Ð»Ð° Ðµ:'
    : 'Ð’Ð°ÑˆÐ¸ÑÑ‚ ÐºÐ¾Ð´ Ð·Ð° Ð²ÑŠÐ·ÑÑ‚Ð°Ð½Ð¾Ð²ÑÐ²Ð°Ð½Ðµ Ð½Ð° Ð¿Ð°Ñ€Ð¾Ð»Ð° Ðµ:';
  const extraText = isResend
    ? 'ÐÐºÐ¾ Ð½Ðµ ÑÑ‚Ðµ Ð¿Ð¾Ð¸ÑÐºÐ°Ð»Ð¸ Ð½Ð¾Ð² ÐºÐ¾Ð´, Ð¸Ð³Ð½Ð¾Ñ€Ð¸Ñ€Ð°Ð¹Ñ‚Ðµ Ñ‚Ð¾Ð·Ð¸ Ð¸Ð¼ÐµÐ¹Ð».'
    : 'ÐÐºÐ¾ Ð½Ðµ ÑÑ‚Ðµ Ð¿Ð¾Ð¸ÑÐºÐ°Ð»Ð¸ ÑÐ¼ÑÐ½Ð° Ð½Ð° Ð¿Ð°Ñ€Ð¾Ð»Ð°, Ð¸Ð³Ð½Ð¾Ñ€Ð¸Ñ€Ð°Ð¹Ñ‚Ðµ Ñ‚Ð¾Ð·Ð¸ Ð¸Ð¼ÐµÐ¹Ð».';

  const { sendEmail } = await import('../services/email.service');

  await sendEmail(
    email,
    subject,
    `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f97316;">Ð’ÑŠÐ·ÑÑ‚Ð°Ð½Ð¾Ð²ÑÐ²Ð°Ð½Ðµ Ð½Ð° Ð¿Ð°Ñ€Ð¾Ð»Ð°</h2>
        <p>Ð—Ð´Ñ€Ð°Ð²ÐµÐ¹Ñ‚Ðµ,</p>
        <p>${intro}</p>
        <h1 style="color: #f97316; text-align: center; font-size: 48px; letter-spacing: 5px;">${code}</h1>
        <p>ÐšÐ¾Ð´ÑŠÑ‚ Ðµ Ð²Ð°Ð»Ð¸Ð´ÐµÐ½ Ð·Ð° ${PASSWORD_RESET_CODE_TTL_MINUTES} Ð¼Ð¸Ð½ÑƒÑ‚Ð¸.</p>
        <p>${extraText}</p>
        <br>
        <p>Ð¡ ÑƒÐ²Ð°Ð¶ÐµÐ½Ð¸Ðµ,<br>Ð•ÐºÐ¸Ð¿ÑŠÑ‚ Ð½Ð° AutoManager</p>
      </div>
    `
  );
};

const sendEmailVerificationCodeEmail = async (
  email: string,
  code: string
): Promise<void> => {
  const { sendEmail } = await import('../services/email.service');

  await sendEmail(
    email,
    'ÐšÐ¾Ð´ Ð·Ð° Ð¿Ð¾Ñ‚Ð²ÑŠÑ€Ð¶Ð´ÐµÐ½Ð¸Ðµ Ð½Ð° Ð¸Ð¼ÐµÐ¹Ð»',
    `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f97316;">ÐŸÐ¾Ñ‚Ð²ÑŠÑ€Ð¶Ð´ÐµÐ½Ð¸Ðµ Ð½Ð° Ð¸Ð¼ÐµÐ¹Ð»</h2>
        <p>Ð—Ð´Ñ€Ð°Ð²ÐµÐ¹Ñ‚Ðµ,</p>
        <p>Ð’Ð°ÑˆÐ¸ÑÑ‚ ÐºÐ¾Ð´ Ð·Ð° Ð¿Ð¾Ñ‚Ð²ÑŠÑ€Ð¶Ð´ÐµÐ½Ð¸Ðµ Ðµ:</p>
        <h1 style="color: #f97316; text-align: center; font-size: 48px; letter-spacing: 5px;">${code}</h1>
        <p>ÐšÐ¾Ð´ÑŠÑ‚ Ðµ Ð²Ð°Ð»Ð¸Ð´ÐµÐ½ Ð·Ð° ${EMAIL_VERIFICATION_CODE_TTL_MINUTES} Ð¼Ð¸Ð½ÑƒÑ‚Ð¸.</p>
        <p>ÐÐºÐ¾ Ð½Ðµ ÑÑ‚Ðµ Ð¿Ð¾Ð¸ÑÐºÐ°Ð»Ð¸ Ñ€ÐµÐ³Ð¸ÑÑ‚Ñ€Ð°Ñ†Ð¸Ñ, Ð¸Ð³Ð½Ð¾Ñ€Ð¸Ñ€Ð°Ð¹Ñ‚Ðµ Ñ‚Ð¾Ð·Ð¸ Ð¸Ð¼ÐµÐ¹Ð».</p>
        <br>
        <p>Ð¡ ÑƒÐ²Ð°Ð¶ÐµÐ½Ð¸Ðµ,<br>Ð•ÐºÐ¸Ð¿ÑŠÑ‚ Ð½Ð° AutoManager</p>
      </div>
    `
  );
};

const issuePasswordResetCode = async (
  userId: string,
  email: string,
  isResend = false
) => {
  const recentCode = await prisma.passwordReset.findFirst({
    where: {
      userId,
      createdAt: { gte: getRecentCodeThreshold() },
      expiresAt: { gte: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (recentCode) {
    return { cooldown: true as const };
  }

  const resetCode = await generateNonConflictingCodeForUser(userId);
  const hashedCode = await hashPassword(resetCode);

  await prisma.passwordReset.deleteMany({ where: { userId } });

  await prisma.passwordReset.create({
    data: {
      userId,
      token: hashedCode,
      expiresAt: getExpiryDate(PASSWORD_RESET_CODE_TTL_MINUTES),
    },
  });

  await sendPasswordResetCodeEmail(email, resetCode, isResend);

  return { cooldown: false as const };
};

const issueEmailVerificationCode = async (userId: string, email: string) => {
  const recentCode = await prisma.emailVerificationCode.findFirst({
    where: {
      userId,
      type: 'EMAIL_VERIFICATION',
      usedAt: null,
      createdAt: { gte: getRecentCodeThreshold() },
      expiresAt: { gte: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (recentCode) {
    return { cooldown: true as const };
  }

  const verificationCode = await generateNonConflictingCodeForUser(userId);
  const hashedCode = await hashPassword(verificationCode);

  await prisma.emailVerificationCode.updateMany({
    where: {
      userId,
      type: 'EMAIL_VERIFICATION',
      usedAt: null,
    },
    data: { usedAt: new Date() },
  });

  await prisma.emailVerificationCode.create({
    data: {
      userId,
      token: hashedCode,
      type: 'EMAIL_VERIFICATION',
      expiresAt: getExpiryDate(EMAIL_VERIFICATION_CODE_TTL_MINUTES),
    },
  });

  await sendEmailVerificationCodeEmail(email, verificationCode);

  return { cooldown: false as const };
};

// Register (ADMIN and CLIENT)
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, role, firstName, lastName, phone } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      res.status(400).json({ message: 'Потребител с този имейл вече съществува' });
      return;
    }

    // Check if email domain exists
    const isDomainValid = await validateEmailDomain(email);
    if (!isDomainValid) {
      res.status(400).json({
        message: 'Имейл домейнът не съществува или не може да получава имейли',
      });
      return;
    }

    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role,
        emailVerified: false,
      },
    });

    // Create Client record if role is CLIENT
    if (role === 'CLIENT') {
      await prisma.client.create({
        data: {
          firstName: firstName || '',
          lastName: lastName || '',
          phone: phone || '',
          email: email,
          userId: user.id,
        },
      });
    }

    try {
      await issueEmailVerificationCode(user.id, user.email);
    } catch (emailError) {
      logger.error('Failed to send verification code email:', emailError);
    }

    res.status(201).json({
      message: 'Регистрацията е успешна. Код за потвърждение е изпратен на имейла.',
      requiresEmailVerification: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    logger.error('Auth error:', error);
    res.status(500).json({ message: 'Сървърна грешка' });
  }
};

// Login
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, rememberMe, role: expectedRole } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(401).json({ message: 'Грешен имейл или парола' });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({ message: '\u0410\u043a\u0430\u0443\u043d\u0442\u044a\u0442 \u0435 \u0434\u0435\u0430\u043a\u0442\u0438\u0432\u0438\u0440\u0430\u043d.' });
      return;
    }

    if (!user.emailVerified) {
      res.status(403).json({
        message: 'Имейлът не е потвърден. Моля, въведете кода за потвърждение.',
        code: 'EMAIL_NOT_VERIFIED',
      });
      return;
    }

    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      res.status(401).json({ message: 'Грешен имейл или парола' });
      return;
    }

    if (expectedRole && expectedRole !== user.role) {
      res.status(403).json({ message: 'Избраната роля не съвпада с профила.' });
      return;
    }

    let serviceCompanyId: string | undefined;

    if (user.role === 'ADMIN') {
      const serviceCompany = await prisma.serviceCompany.findUnique({
        where: { userId: user.id },
      });
      serviceCompanyId = serviceCompany?.id;
    } else if (user.role === 'MECHANIC') {
      const worker = await prisma.worker.findUnique({
        where: { userId: user.id },
      });
      if (worker) {
        serviceCompanyId = worker.serviceCompanyId ?? undefined;
      }
    }

    const accessToken = generateToken(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        tokenVersion: user.tokenVersion,
        serviceCompanyId,
      },
      '15m'
    );

    const refreshDays = rememberMe ? 30 : 1;
    const refreshToken = await createRefreshToken(user.id, refreshDays);

    res.cookie('refreshToken', refreshToken.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
      maxAge: refreshDays * 24 * 60 * 60 * 1000,
    });
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
      maxAge: 15 * 60 * 1000,
    });

    res.status(200).json({
      message: 'Успешен вход',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        serviceCompanyId,
      },
    });
  } catch (error) {
    logger.error('Auth error:', error);
    res.status(500).json({ message: 'Сървърна грешка' });
  }
};

// Logout
interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

export const logout = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    let userId = req.user?.userId;
    const refreshToken = req.cookies.refreshToken;

    if (!userId && refreshToken) {
      const refreshData = await validateRefreshToken(refreshToken);
      userId = refreshData?.user.id;
    }

    if (!userId && !refreshToken) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const authHeader = req.headers.authorization;
    const accessToken = authHeader?.split(' ')[1];

    if (refreshToken) {
      await revokeRefreshToken(refreshToken);
    }

    if (accessToken) {
      await blacklistToken(accessToken, 'logout');
    }

    if (userId) {
      await prisma.user.update({
        where: { id: userId },
        data: { tokenVersion: { increment: 1 } },
      });
    }

    res.clearCookie('accessToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
    });

    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
    });

    res.status(200).json({
      message: 'Logged out successfully',
    });
  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({ message: 'Сървърна грешка' });
  }
};

// Delete Account
export const deleteAccount = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const userRole = req.user!.role;

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Handle MECHANIC role
    if (userRole === 'MECHANIC') {
      const worker = await prisma.worker.findUnique({
        where: { userId },
        include: {
          mechanicServiceCompanies: true,
        },
      });

      if (worker) {
        const activeCount = worker.mechanicServiceCompanies.filter(
          (m) => m.status === 'ACTIVE'
        ).length;

        if (activeCount > 0) {
          res.status(400).json({
            message: 'ÐÐµ Ð¼Ð¾Ð¶ÐµÑ‚Ðµ Ð´Ð° Ð¸Ð·Ñ‚Ñ€Ð¸ÐµÑ‚Ðµ Ð°ÐºÐ°ÑƒÐ½Ñ‚Ð° ÑÐ¸ Ð´Ð¾ÐºÐ°Ñ‚Ð¾ Ð¸Ð¼Ð°Ñ‚Ðµ Ð°ÐºÑ‚Ð¸Ð²Ð½Ð¸ Ñ‡Ð»ÐµÐ½ÑÑ‚Ð²Ð° Ð² ÑÐµÑ€Ð²Ð¸Ð·Ð¸. ÐœÐ¾Ð»Ñ, Ð½Ð°Ð¿ÑƒÑÐ½ÐµÑ‚Ðµ Ð²ÑÐ¸Ñ‡ÐºÐ¸ ÑÐµÑ€Ð²Ð¸Ð·Ð¸ Ð¿ÑŠÑ€Ð²Ð¾.',
            activeServicesCount: activeCount,
          });
          return;
        }

        // Worker will be cascade deleted with user (onDelete: Cascade in schema)
        // Mark as deleted for history purposes before cascade
        await prisma.worker.update({
          where: { id: worker.id },
          data: { deletedAt: new Date() },
        });
      }
    }

    // Handle CLIENT role
    if (userRole === 'CLIENT') {
      // Find all client records for this user
      const clients = await prisma.client.findMany({
        where: { userId },
      });

      // Check for active orders
      for (const client of clients) {
        const activeOrdersCount = await prisma.order.count({
          where: {
            clientId: client.id,
            status: { in: ['WAITING', 'IN_PROGRESS', 'READY'] },
          },
        });

        if (activeOrdersCount > 0) {
          res.status(400).json({
            message: 'ÐÐµ Ð¼Ð¾Ð¶ÐµÑ‚Ðµ Ð´Ð° Ð¸Ð·Ñ‚Ñ€Ð¸ÐµÑ‚Ðµ Ð°ÐºÐ°ÑƒÐ½Ñ‚Ð° ÑÐ¸ Ð´Ð¾ÐºÐ°Ñ‚Ð¾ Ð¸Ð¼Ð°Ñ‚Ðµ Ð°ÐºÑ‚Ð¸Ð²Ð½Ð¸ Ð¿Ð¾Ñ€ÑŠÑ‡ÐºÐ¸. ÐœÐ¾Ð»Ñ, Ð¸Ð·Ñ‡Ð°ÐºÐ°Ð¹Ñ‚Ðµ Ð·Ð°Ð²ÑŠÑ€ÑˆÐ²Ð°Ð½ÐµÑ‚Ð¾ Ð¸Ð¼.',
            activeOrdersCount,
          });
          return;
        }
      }

      // Soft delete all client records (preserve history for service companies)
      // Disconnect userId so the user can be deleted
      for (const client of clients) {
        await prisma.client.update({
          where: { id: client.id },
          data: {
            isActive: false,
            deletedAt: new Date(),
            userId: null, // Disconnect from user - allows email reuse
          },
        });
      }

      // Delete notifications for this user's clients
      await prisma.notification.deleteMany({
        where: {
          clientId: { in: clients.map(c => c.id) },
        },
      });
    }

    // Handle ADMIN role - don't allow deletion if they have a service company
    if (userRole === 'ADMIN') {
      const serviceCompany = await prisma.serviceCompany.findUnique({
        where: { userId },
      });

      if (serviceCompany) {
        res.status(400).json({
          message: 'ÐÐµ Ð¼Ð¾Ð¶ÐµÑ‚Ðµ Ð´Ð° Ð¸Ð·Ñ‚Ñ€Ð¸ÐµÑ‚Ðµ Ð°ÐºÐ°ÑƒÐ½Ñ‚Ð° ÑÐ¸ Ð´Ð¾ÐºÐ°Ñ‚Ð¾ Ð¸Ð¼Ð°Ñ‚Ðµ Ð°ÐºÑ‚Ð¸Ð²ÐµÐ½ ÑÐµÑ€Ð²Ð¸Ð·. ÐœÐ¾Ð»Ñ, ÑÐ²ÑŠÑ€Ð¶ÐµÑ‚Ðµ ÑÐµ Ñ Ð¿Ð¾Ð´Ð´Ñ€ÑŠÐ¶ÐºÐ°Ñ‚Ð°.',
        });
        return;
      }
    }

    // Delete pending requests for this email
    await prisma.pendingRequest.deleteMany({
      where: { email: user.email },
    });

    // Delete all refresh tokens for this user
    await prisma.refreshToken.deleteMany({
      where: { userId },
    });

    // Actually DELETE the user record (not just deactivate)
    await prisma.user.delete({
      where: { id: userId },
    });

    // Clear cookies
    res.clearCookie('accessToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
    });

    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
    });

    res.status(200).json({
      message: 'ÐÐºÐ°ÑƒÐ½Ñ‚ÑŠÑ‚ Ðµ Ð¸Ð·Ñ‚Ñ€Ð¸Ñ‚ ÑƒÑÐ¿ÐµÑˆÐ½Ð¾',
    });
  } catch (error) {
    logger.error('Delete account error:', error);
    res.status(500).json({ message: 'Сървърна грешка' });
  }
};

// Refresh Token
export const refreshToken = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const token = req.cookies.refreshToken;

    if (!token) {
      res.status(400).json({ message: 'Липсва рефреш токен' });
      return;
    }

    const refreshRecord = await prisma.refreshToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!refreshRecord || refreshRecord.expiresAt < new Date()) {
      res.status(401).json({ message: 'Невалиден или изтекъл рефреш токен' });
      return;
    }

    if (refreshRecord.revokedAt) {
      await revokeAllUserRefreshTokens(refreshRecord.userId);
      await prisma.user.update({
        where: { id: refreshRecord.userId },
        data: { tokenVersion: { increment: 1 } },
      });
      res
        .status(401)
        .json({ message: 'Засечено е повторно използване на рефреш токен. Влезте отново.' });
      return;
    }

    if (!refreshRecord.user.isActive) {
      await revokeAllUserRefreshTokens(refreshRecord.userId);
      await prisma.user.update({
        where: { id: refreshRecord.userId },
        data: { tokenVersion: { increment: 1 } },
      });
      res.status(403).json({ message: 'ÐÐºÐ°ÑƒÐ½Ñ‚ÑŠÑ‚ Ðµ Ð´ÐµÐ°ÐºÑ‚Ð¸Ð²Ð¸Ñ€Ð°Ð½.' });
      return;
    }

    const user = refreshRecord.user;
    let serviceCompanyId: string | undefined;

    if (user.role === 'ADMIN') {
      const serviceCompany = await prisma.serviceCompany.findUnique({
        where: { userId: user.id },
      });
      serviceCompanyId = serviceCompany?.id;
    } else if (user.role === 'MECHANIC') {
      const worker = await prisma.worker.findUnique({
        where: { userId: user.id },
      });
      if (worker) {
        serviceCompanyId = worker.serviceCompanyId ?? undefined;
      }
    }

    const newAccessToken = generateToken(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        tokenVersion: user.tokenVersion,
        serviceCompanyId,
      },
      '15m'
    );

    const refreshMaxAgeMs = refreshRecord.expiresAt.getTime() - Date.now();
    if (refreshMaxAgeMs <= 0) {
      res.status(401).json({ message: 'Невалиден или изтекъл рефреш токен' });
      return;
    }

    const newRefreshToken = await createRefreshToken(
      user.id,
      0,
      refreshRecord.expiresAt
    );

    await prisma.refreshToken.update({
      where: { id: refreshRecord.id },
      data: { revokedAt: new Date(), replacedByToken: newRefreshToken.token },
    });

    res.cookie('refreshToken', newRefreshToken.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
      maxAge: refreshMaxAgeMs,
    });

    res.cookie('accessToken', newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
      maxAge: 15 * 60 * 1000,
    });

    res.status(200).json({
      message: 'Токенът е обновен успешно',
    });
  } catch (error) {
    logger.error('Refresh token error:', error);
    res.status(500).json({ message: 'Сървърна грешка' });
  }
};

// Register Mechanic
export const registerMechanic = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      email,
      password,
      firstName,
      lastName,
      phone,
      specialization,
      skills,
      uniqueCode,
    } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      res.status(400).json({ message: 'User with this email already exists' });
      return;
    }

    const isDomainValid = await validateEmailDomain(email);
    if (!isDomainValid) {
      res.status(400).json({
        message: 'Имейл домейнът не съществува или не може да получава имейли',
      });
      return;
    }

    const serviceCompany = await prisma.serviceCompany.findUnique({
      where: { uniqueCode },
    });

    if (!serviceCompany) {
      res.status(404).json({ message: 'Невалиден код на сервиза' });
      return;
    }

    const hashedPassword = await hashPassword(password);

    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          role: 'MECHANIC',
          emailVerified: false,
        },
      });

      const worker = await tx.worker.create({
        data: {
          firstName,
          lastName,
          email,
          phone,
          specialization: specialization ?? '',
          skills: skills ?? null,
          userId: newUser.id,
          serviceCompanyId: serviceCompany.id,
          isActive: false,
        },
      });

      await tx.pendingRequest.create({
        data: {
          email,
          firstName,
          lastName,
          phone,
          specialization: specialization ?? '',
          skills: skills ?? null,
          status: 'PENDING',
          serviceCompanyId: serviceCompany.id,
        },
      });

      await tx.mechanicServiceCompany.create({
        data: {
          workerId: worker.id,
          serviceCompanyId: serviceCompany.id,
          status: 'PENDING',
        },
      });

      return newUser;
    });

    try {
      await issueEmailVerificationCode(user.id, user.email);
    } catch (emailError) {
      logger.error('Failed to send verification code email:', emailError);
    }

    res.status(201).json({
      message:
        'Регистрацията на механик е изпратена. Код за потвърждение е изпратен на имейла. Изчаквайте одобрение от администратор.',
      requiresEmailVerification: true,
      email: user.email,
    });
  } catch (error) {
    logger.error('Auth error:', error);
    res.status(500).json({ message: 'Сървърна грешка' });
  }
};

// Add Service Company to Client
export const addServiceCompanyToClient = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { uniqueCode, phone, firstName, lastName } = req.body;
    const userId = (req as AuthRequest).user?.userId;

    if (!phone || phone.trim().length === 0) {
      res.status(400).json({ message: 'Телефонният номер е задължителен' });
      return;
    }

    const serviceCompany = await prisma.serviceCompany.findUnique({
      where: { uniqueCode },
    });

    if (!serviceCompany) {
      res.status(404).json({ message: 'Невалиден код на сервиза' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.role !== 'CLIENT') {
      res.status(403).json({ message: 'Само клиенти могат да използват тази крайна точка' });
      return;
    }

    const existingClient = await prisma.client.findFirst({
      where: { userId, serviceCompanyId: serviceCompany.id },
    });

    if (existingClient) {
      res.status(400).json({
        message: 'Вече сте клиент на този сервиз',
      });
      return;
    }

    const client = await prisma.client.create({
      data: {
        firstName: firstName || '',
        lastName: lastName || '',
        phone: phone.trim(),
        email: user.email,
        userId,
        serviceCompanyId: serviceCompany.id,
      },
    });

    res.status(201).json({
      message: 'Успешно се присъединихте към сервиза',
      client: {
        id: client.id,
        serviceCompanyName: serviceCompany.name,
      },
    });
  } catch (error) {
    logger.error('Auth error:', error);
    res.status(500).json({ message: 'Сървърна грешка' });
  }
};

// Forgot Password
export const forgotPassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(200).json({
        message: 'Ако имейлът съществува, е изпратен код за възстановяване',
      });
      return;
    }

    const result = await issuePasswordResetCode(user.id, email, false);
    if (result.cooldown) {
      res.status(429).json({
        message: 'Изчакайте малко преди да заявите нов код.',
      });
      return;
    }

    res.status(200).json({ message: 'Код за възстановяване е изпратен на имейла' });
  } catch (error) {
    logger.error('Auth error:', error);
    res.status(500).json({ message: 'Сървърна грешка' });
  }
};

// Reset Password
export const resetPassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email, code, newPassword } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(400).json({ message: 'Невалиден имейл или код' });
      return;
    }

    const passwordResets = await prisma.passwordReset.findMany({
      where: {
        userId: user.id,
        expiresAt: { gte: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    let validPasswordReset = null;
    for (const reset of passwordResets) {
      const isCodeValid = await comparePassword(code, reset.token);
      if (isCodeValid) {
        validPasswordReset = reset;
        break;
      }
    }

    if (!validPasswordReset) {
      res.status(400).json({ message: 'Невалиден или изтекъл код' });
      return;
    }

    const hashedPassword = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    await prisma.passwordReset.deleteMany({
      where: { userId: user.id },
    });

    await revokeAllUserRefreshTokens(user.id);

    res.status(200).json({
      message: 'Паролата е сменена успешно. Влезте отново.',
    });
  } catch (error) {
    logger.error('Auth error:', error);
    res.status(500).json({ message: 'Сървърна грешка' });
  }
};

// Resend Password Reset Code
export const resendPasswordResetCode = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(200).json({
        message: 'Ако имейлът съществува, е изпратен код за възстановяване',
      });
      return;
    }

    const result = await issuePasswordResetCode(user.id, email, true);
    if (result.cooldown) {
      res.status(429).json({
        message: 'Изчакайте малко преди да заявите нов код.',
      });
      return;
    }

    res.status(200).json({ message: 'Нов код за възстановяване е изпратен на имейла' });
  } catch (error) {
    logger.error('Auth error:', error);
    res.status(500).json({ message: 'Сървърна грешка' });
  }
};

// Verify Email Code
export const verifyEmailCode = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      res.status(400).json({ message: 'Имейлът и кодът са задължителни' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(400).json({ message: 'Невалиден имейл или код' });
      return;
    }

    if (user.emailVerified) {
      res.status(200).json({ message: 'Имейлът вече е потвърден' });
      return;
    }

    const verificationCodes = await prisma.emailVerificationCode.findMany({
      where: {
        userId: user.id,
        type: 'EMAIL_VERIFICATION',
        usedAt: null,
        expiresAt: { gte: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    let validCode = null;
    for (const item of verificationCodes) {
      const isCodeValid = await comparePassword(code, item.token);
      if (isCodeValid) {
        validCode = item;
        break;
      }
    }

    if (!validCode) {
      res.status(400).json({ message: 'Невалиден или изтекъл код' });
      return;
    }

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: { emailVerified: true },
      });

      await tx.emailVerificationCode.update({
        where: { id: validCode.id },
        data: { usedAt: new Date() },
      });

      await tx.emailVerificationCode.updateMany({
        where: {
          userId: user.id,
          type: 'EMAIL_VERIFICATION',
          usedAt: null,
          id: { not: validCode.id },
        },
        data: { usedAt: new Date() },
      });
    });

    res.status(200).json({ message: 'Имейлът е потвърден успешно' });
  } catch (error) {
    logger.error('Auth error:', error);
    res.status(500).json({ message: 'Сървърна грешка' });
  }
};

// Resend Email Verification Code
export const resendEmailVerificationCode = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(200).json({
        message: 'Ако имейлът съществува, е изпратен код за потвърждение',
      });
      return;
    }

    if (user.emailVerified) {
      res.status(200).json({ message: 'Имейлът вече е потвърден' });
      return;
    }

    const result = await issueEmailVerificationCode(user.id, user.email);
    if (result.cooldown) {
      res.status(429).json({
        message: 'Изчакайте малко преди да заявите нов код.',
      });
      return;
    }

    res.status(200).json({ message: 'Код за потвърждение е изпратен на имейла' });
  } catch (error) {
    logger.error('Auth error:', error);
    res.status(500).json({ message: 'Сървърна грешка' });
  }
};

// Register Admin with Service Company
export const registerAdminWithCompany = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      email,
      password,
      companyName,
      companyAddress,
      companyPhone,
      companyEmail,
      bulstat,
      vatNumber,
      description,
    } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      res.status(400).json({ message: 'Потребител с този имейл вече съществува' });
      return;
    }

    const isDomainValid = await validateEmailDomain(email);
    if (!isDomainValid) {
      res.status(400).json({
        message: 'Имейл домейнът не съществува или не може да получава имейли',
      });
      return;
    }

    const isCompanyEmailValid = await validateEmailDomain(companyEmail);
    if (!isCompanyEmailValid) {
      res.status(400).json({
        message: 'Имейл домейнът на фирмата не съществува или не може да получава имейли',
      });
      return;
    }

    const hashedPassword = await hashPassword(password);
    const { generateUniqueCode } = await import('../utils/generateUniqueCode');
    const uniqueCode = generateUniqueCode();

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          role: 'ADMIN',
          emailVerified: false,
        },
      });

      const serviceCompany = await tx.serviceCompany.create({
        data: {
          name: companyName,
          address: companyAddress,
          phone: companyPhone,
          email: companyEmail,
          uniqueCode,
          bulstat,
          vatNumber,
          description,
          userId: user.id,
        },
      });

      return { user, serviceCompany };
    });

    const { user, serviceCompany } = result;

    try {
      await issueEmailVerificationCode(user.id, user.email);
    } catch (emailError) {
      logger.error('Failed to send verification code email:', emailError);
    }

    res.status(201).json({
      message:
        'Администраторът и сервизът са създадени успешно. Код за потвърждение е изпратен на имейла.',
      requiresEmailVerification: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        serviceCompanyId: serviceCompany.id,
      },
      serviceCompany: {
        id: serviceCompany.id,
        name: serviceCompany.name,
        uniqueCode: serviceCompany.uniqueCode,
      },
    });
  } catch (error) {
    logger.error('Auth error:', error);
    res.status(500).json({ message: 'Сървърна грешка' });
  }
};



