/**
 * Authentication Controller
 *
 * Uses httpOnly cookies for refresh tokens (XSS protection).
 * Access tokens: 15 min, Refresh tokens: 30 days.
 */

import { Request, Response } from 'express';
import { AdminRegistrationStatus } from '@prisma/client';
import crypto from 'crypto';
import prisma from '../config/database';
import { hashPassword, comparePassword } from '../utils/hashPassword';
import { generateToken } from '../utils/generateToken';
import { validateEmailDomain } from '../utils/emailValidator';
import logger from '../services/logger.service';
import {
  getStripe,
  getStripeCancelUrl,
  getStripePriceId,
  getStripeSuccessUrl,
} from '../services/stripe.service';
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
const PENDING_ADMIN_REGISTRATION_TTL_HOURS = 24;

const getExpiryDate = (minutes: number): Date =>
  new Date(Date.now() + minutes * 60 * 1000);

const getRecentCodeThreshold = (): Date =>
  new Date(Date.now() - CODE_RESEND_COOLDOWN_SECONDS * 1000);

const getPendingAdminRegistrationExpiryDate = (): Date =>
  new Date(Date.now() + PENDING_ADMIN_REGISTRATION_TTL_HOURS * 60 * 60 * 1000);

const generateSixDigitCode = (): string =>
  crypto.randomInt(100000, 999999).toString();

const normalizeEmail = (email: string): string => email.trim().toLowerCase();

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
    ? 'Нов код за възстановяване на парола'
    : 'Код за възстановяване на парола';
  const intro = isResend
    ? 'Вашият нов код за възстановяване на парола е:'
    : 'Вашият код за възстановяване на парола е:';
  const extraText = isResend
    ? 'Ако не сте поискали нов код, игнорирайте този имейл.'
    : 'Ако не сте поискали смяна на парола, игнорирайте този имейл.';

  const { sendEmail } = await import('../services/email.service');

  await sendEmail(
    email,
    subject,
    `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f97316;">Възстановяване на парола</h2>
        <p>Здравейте,</p>
        <p>${intro}</p>
        <h1 style="color: #f97316; text-align: center; font-size: 48px; letter-spacing: 5px;">${code}</h1>
        <p>Кодът е валиден за ${PASSWORD_RESET_CODE_TTL_MINUTES} минути.</p>
        <p>${extraText}</p>
        <br>
        <p>С уважение,<br>Екипът на AutoManager</p>
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
    'Код за потвърждение на имейл',
    `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f97316;">Потвърждение на имейл</h2>
        <p>Здравейте,</p>
        <p>Вашият код за потвърждение е:</p>
        <h1 style="color: #f97316; text-align: center; font-size: 48px; letter-spacing: 5px;">${code}</h1>
        <p>Кодът е валиден за ${EMAIL_VERIFICATION_CODE_TTL_MINUTES} минути.</p>
        <p>Ако не сте поискали регистрация, игнорирайте този имейл.</p>
        <br>
        <p>С уважение,<br>Екипът на AutoManager</p>
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

const issuePendingAdminVerificationCode = async (
  registrationId: string,
  email: string
) => {
  const registration = await prisma.pendingAdminRegistration.findUnique({
    where: { id: registrationId },
    select: {
      id: true,
      lastCodeSentAt: true,
      status: true,
    },
  });

  if (!registration) {
    throw new Error('Липсва заявка за регистрация на администратор');
  }

  if (
    registration.lastCodeSentAt &&
    registration.lastCodeSentAt >= getRecentCodeThreshold()
  ) {
    return { cooldown: true as const };
  }

  const verificationCode = generateSixDigitCode();
  const hashedCode = await hashPassword(verificationCode);

  await prisma.pendingAdminRegistration.update({
    where: { id: registrationId },
    data: {
      verificationCodeHash: hashedCode,
      verificationCodeExpiresAt: getExpiryDate(EMAIL_VERIFICATION_CODE_TTL_MINUTES),
      lastCodeSentAt: new Date(),
      status:
        registration.status === AdminRegistrationStatus.EMAIL_VERIFIED
          ? AdminRegistrationStatus.EMAIL_VERIFIED
          : AdminRegistrationStatus.PENDING_EMAIL_VERIFICATION,
    },
  });

  await sendEmailVerificationCodeEmail(email, verificationCode);
  return { cooldown: false as const };
};

// Register (ADMIN and CLIENT)
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, role, firstName, lastName, phone } = req.body;
    const normalizedEmail = normalizeEmail(email);

    if (role === 'ADMIN') {
      res.status(400).json({
        message:
          'Регистрацията на администратор е достъпна само през формата за регистрация на сервиз.',
      });
      return;
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (existingUser) {
      res.status(400).json({ message: 'Потребител с този имейл вече съществува' });
      return;
    }

    // Check if email domain exists
    const isDomainValid = await validateEmailDomain(normalizedEmail);
    if (!isDomainValid) {
      res.status(400).json({
        message: 'Имейл домейнът не съществува или не може да получава имейли',
      });
      return;
    }

    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
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
          email: normalizedEmail,
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
            message: 'Не можете да изтриете акаунта си, докато имате активни членства в сервизи. Моля, напуснете всички сервизи първо.',
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
            message: 'Не можете да изтриете акаунта си, докато имате активни поръчки. Моля, изчакайте завършването им.',
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
          message: 'Не можете да изтриете акаунта си, докато имате активен сервиз. Моля, свържете се с поддръжката.',
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
      message: 'Акаунтът е изтрит успешно',
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
      res.status(403).json({ message: 'Акаунтът е деактивиран.' });
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

    const normalizedEmail = normalizeEmail(email);
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    if (user) {
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
      return;
    }

    const pendingRegistration = await prisma.pendingAdminRegistration.findUnique({
      where: { email: normalizedEmail },
    });

    if (!pendingRegistration) {
      res.status(400).json({ message: 'Невалиден имейл или код' });
      return;
    }

    if (pendingRegistration.status === AdminRegistrationStatus.COMPLETED) {
      res.status(200).json({ message: 'Имейлът вече е потвърден' });
      return;
    }

    if (pendingRegistration.expiresAt < new Date()) {
      await prisma.pendingAdminRegistration.update({
        where: { id: pendingRegistration.id },
        data: { status: AdminRegistrationStatus.EXPIRED },
      });
      res.status(400).json({
        message:
          'Регистрационната сесия е изтекла. Моля, започнете регистрацията отново.',
      });
      return;
    }

    if (
      !pendingRegistration.verificationCodeHash ||
      !pendingRegistration.verificationCodeExpiresAt ||
      pendingRegistration.verificationCodeExpiresAt < new Date()
    ) {
      res.status(400).json({ message: 'Невалиден или изтекъл код' });
      return;
    }

    const isValidCode = await comparePassword(
      code,
      pendingRegistration.verificationCodeHash
    );

    if (!isValidCode) {
      res.status(400).json({ message: 'Невалиден или изтекъл код' });
      return;
    }

    await prisma.pendingAdminRegistration.update({
      where: { id: pendingRegistration.id },
      data: {
        emailVerifiedAt: new Date(),
        status: AdminRegistrationStatus.EMAIL_VERIFIED,
        verificationCodeHash: null,
        verificationCodeExpiresAt: null,
      },
    });

    res.status(200).json({
      message: 'Имейлът е потвърден успешно',
      nextAction: 'CHECKOUT',
    });
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
    const normalizedEmail = normalizeEmail(email);

    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (user) {
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
      return;
    }

    const pendingRegistration = await prisma.pendingAdminRegistration.findUnique({
      where: { email: normalizedEmail },
    });

    if (!pendingRegistration) {
      res.status(200).json({
        message: 'Ако имейлът съществува, е изпратен код за потвърждение',
      });
      return;
    }

    if (pendingRegistration.status === AdminRegistrationStatus.COMPLETED) {
      res.status(200).json({ message: 'Имейлът вече е потвърден' });
      return;
    }

    if (pendingRegistration.expiresAt < new Date()) {
      await prisma.pendingAdminRegistration.update({
        where: { id: pendingRegistration.id },
        data: { status: AdminRegistrationStatus.EXPIRED },
      });
      res.status(400).json({
        message:
          'Регистрационната сесия е изтекла. Моля, започнете регистрацията отново.',
      });
      return;
    }

    if (pendingRegistration.emailVerifiedAt) {
      res.status(200).json({ message: 'Имейлът вече е потвърден' });
      return;
    }

    const result = await issuePendingAdminVerificationCode(
      pendingRegistration.id,
      pendingRegistration.email
    );
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

    const normalizedEmail = normalizeEmail(email);
    const normalizedCompanyEmail = normalizeEmail(companyEmail);

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (existingUser) {
      res.status(400).json({ message: 'Потребител с този имейл вече съществува' });
      return;
    }

    const isDomainValid = await validateEmailDomain(normalizedEmail);
    if (!isDomainValid) {
      res.status(400).json({
        message: 'Имейл домейнът не съществува или не може да получава имейли',
      });
      return;
    }

    const isCompanyEmailValid = await validateEmailDomain(normalizedCompanyEmail);
    if (!isCompanyEmailValid) {
      res.status(400).json({
        message: 'Имейл домейнът на фирмата не съществува или не може да получава имейли',
      });
      return;
    }

    const hashedPassword = await hashPassword(password);
    const pendingRegistration = await prisma.pendingAdminRegistration.upsert({
      where: { email: normalizedEmail },
      update: {
        passwordHash: hashedPassword,
        companyName,
        companyAddress,
        companyPhone,
        companyEmail: normalizedCompanyEmail,
        bulstat: bulstat || null,
        vatNumber: vatNumber || null,
        description: description || null,
        verificationCodeHash: null,
        verificationCodeExpiresAt: null,
        lastCodeSentAt: null,
        emailVerifiedAt: null,
        stripeCheckoutSessionId: null,
        stripeCustomerId: null,
        status: AdminRegistrationStatus.PENDING_EMAIL_VERIFICATION,
        expiresAt: getPendingAdminRegistrationExpiryDate(),
        createdUserId: null,
        createdServiceCompanyId: null,
        completedAt: null,
      },
      create: {
        email: normalizedEmail,
        passwordHash: hashedPassword,
        companyName,
        companyAddress,
        companyPhone,
        companyEmail: normalizedCompanyEmail,
        bulstat: bulstat || null,
        vatNumber: vatNumber || null,
        description: description || null,
        status: AdminRegistrationStatus.PENDING_EMAIL_VERIFICATION,
        expiresAt: getPendingAdminRegistrationExpiryDate(),
      },
    });

    try {
      await issuePendingAdminVerificationCode(
        pendingRegistration.id,
        pendingRegistration.email
      );
    } catch (emailError) {
      logger.error('Failed to send verification code email:', emailError);
    }

    res.status(201).json({
      message:
        'Данните са приети. Потвърдете имейла, за да продължите към плащане.',
      requiresEmailVerification: true,
      email: pendingRegistration.email,
    });
  } catch (error) {
    logger.error('Auth error:', error);
    res.status(500).json({ message: 'Сървърна грешка' });
  }
};

export const createAdminRegistrationCheckoutSession = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ message: 'Имейлът е задължителен' });
      return;
    }

    const normalizedEmail = normalizeEmail(email);
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      res.status(400).json({
        message: 'Регистрацията вече е финализирана. Влезте в системата.',
      });
      return;
    }

    const registration = await prisma.pendingAdminRegistration.findUnique({
      where: { email: normalizedEmail },
    });

    if (!registration) {
      res.status(404).json({
        message: 'Липсва активна регистрация. Моля, започнете отново.',
      });
      return;
    }

    if (registration.expiresAt < new Date()) {
      await prisma.pendingAdminRegistration.update({
        where: { id: registration.id },
        data: { status: AdminRegistrationStatus.EXPIRED },
      });
      res.status(400).json({
        message:
          'Регистрационната сесия е изтекла. Моля, започнете регистрацията отново.',
      });
      return;
    }

    if (!registration.emailVerifiedAt) {
      res.status(403).json({
        code: 'EMAIL_NOT_VERIFIED',
        message: 'Потвърдете имейла си, за да продължите към плащане.',
      });
      return;
    }

    if (registration.status === AdminRegistrationStatus.COMPLETED) {
      res.status(400).json({
        message: 'Регистрацията вече е финализирана. Влезте в системата.',
      });
      return;
    }

    const stripe = getStripe();
    let stripeCustomerId = registration.stripeCustomerId;

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: registration.companyEmail,
        name: registration.companyName,
        metadata: {
          pendingAdminRegistrationId: registration.id,
        },
      });
      stripeCustomerId = customer.id;
    }

    const successUrl = new URL(getStripeSuccessUrl());
    successUrl.searchParams.set('flow', 'admin-register');
    successUrl.searchParams.set('email', registration.email);
    successUrl.searchParams.set('session_id', '{CHECKOUT_SESSION_ID}');

    const cancelUrl = new URL(getStripeCancelUrl());
    cancelUrl.searchParams.set('flow', 'admin-register');
    cancelUrl.searchParams.set('email', registration.email);

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: stripeCustomerId,
      line_items: [
        {
          price: getStripePriceId(),
          quantity: 1,
        },
      ],
      success_url: successUrl.toString(),
      cancel_url: cancelUrl.toString(),
      allow_promotion_codes: true,
      client_reference_id: registration.id,
      metadata: {
        pendingAdminRegistrationId: registration.id,
      },
      subscription_data: {
        metadata: {
          pendingAdminRegistrationId: registration.id,
        },
      },
    });

    if (!checkoutSession.url) {
      res.status(500).json({ message: 'Неуспешно създаване на Checkout сесия' });
      return;
    }

    await prisma.pendingAdminRegistration.update({
      where: { id: registration.id },
      data: {
        stripeCustomerId,
        stripeCheckoutSessionId: checkoutSession.id,
        status: AdminRegistrationStatus.CHECKOUT_STARTED,
      },
    });

    res.status(200).json({
      checkoutUrl: checkoutSession.url,
      sessionId: checkoutSession.id,
    });
  } catch (error) {
    logger.error('Create admin registration checkout session error:', error);
    res.status(500).json({ message: 'Сървърна грешка' });
  }
};

export const getAdminRegistrationStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const queryEmail = req.query.email;
    const emailParam =
      typeof queryEmail === 'string'
        ? queryEmail
        : Array.isArray(queryEmail) && typeof queryEmail[0] === 'string'
          ? queryEmail[0]
          : undefined;

    if (!emailParam) {
      res.status(400).json({ message: 'Имейлът е задължителен' });
      return;
    }

    const normalizedEmail = normalizeEmail(emailParam);

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, role: true },
    });

    if (user) {
      res.status(200).json({
        status: AdminRegistrationStatus.COMPLETED,
        isCompleted: true,
      });
      return;
    }

    const registration = await prisma.pendingAdminRegistration.findUnique({
      where: { email: normalizedEmail },
      select: {
        status: true,
        expiresAt: true,
      },
    });

    if (!registration) {
      res.status(404).json({
        message: 'Липсва активна регистрация',
      });
      return;
    }

    if (
      registration.status !== AdminRegistrationStatus.COMPLETED &&
      registration.expiresAt < new Date()
    ) {
      await prisma.pendingAdminRegistration.update({
        where: { email: normalizedEmail },
        data: { status: AdminRegistrationStatus.EXPIRED },
      });
      res.status(200).json({
        status: AdminRegistrationStatus.EXPIRED,
        isCompleted: false,
      });
      return;
    }

    res.status(200).json({
      status: registration.status,
      isCompleted: registration.status === AdminRegistrationStatus.COMPLETED,
    });
  } catch (error) {
    logger.error('Get admin registration status error:', error);
    res.status(500).json({ message: 'Сървърна грешка' });
  }
};



