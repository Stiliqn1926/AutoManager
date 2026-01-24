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

// Register (ADMIN and CLIENT)
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, role, firstName, lastName, phone } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      res.status(400).json({ message: 'User already exists' });
      return;
    }

    // Check if email domain exists
    const isDomainValid = await validateEmailDomain(email);
    if (!isDomainValid) {
      res.status(400).json({
        message: 'Email domain does not exist or cannot receive emails',
      });
      return;
    }

    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role,
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

    const accessToken = generateToken(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        tokenVersion: user.tokenVersion,
      },
      '15m'
    );

    const refreshToken = await createRefreshToken(user.id, 30);

    res.cookie('refreshToken', refreshToken.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000,
    });

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    logger.error('Auth error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Login
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, rememberMe, role: expectedRole } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({ message: '\u0410\u043a\u0430\u0443\u043d\u0442\u044a\u0442 \u0435 \u0434\u0435\u0430\u043a\u0442\u0438\u0432\u0438\u0440\u0430\u043d.' });
      return;
    }

    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      res.status(401).json({ message: 'Invalid credentials' });
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
      sameSite: 'strict',
      maxAge: refreshDays * 24 * 60 * 60 * 1000,
    });
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000,
    });

    res.status(200).json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        serviceCompanyId,
      },
    });
  } catch (error) {
    logger.error('Auth error:', error);
    res.status(500).json({ message: 'Server error' });
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
      sameSite: 'strict',
    });

    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    res.status(200).json({
      message: 'Logged out successfully',
    });
  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({ message: 'Server error' });
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
            message: 'Не можете да изтриете акаунта си докато имате активни членства в сервизи. Моля, напуснете всички сервизи първо.',
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
            message: 'Не можете да изтриете акаунта си докато имате активни поръчки. Моля, изчакайте завършването им.',
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
          message: 'Не можете да изтриете акаунта си докато имате активен сервиз. Моля, свържете се с поддръжката.',
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
      sameSite: 'strict',
    });

    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    res.status(200).json({
      message: 'Акаунтът е изтрит успешно',
    });
  } catch (error) {
    logger.error('Delete account error:', error);
    res.status(500).json({ message: 'Server error' });
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
      res.status(400).json({ message: 'Refresh token is required' });
      return;
    }

    const refreshRecord = await prisma.refreshToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!refreshRecord || refreshRecord.expiresAt < new Date()) {
      res.status(401).json({ message: 'Invalid or expired refresh token' });
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
        .json({ message: 'Refresh token reuse detected. Please login again.' });
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
      res.status(401).json({ message: 'Invalid or expired refresh token' });
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
      sameSite: 'strict',
      maxAge: refreshMaxAgeMs,
    });

    res.cookie('accessToken', newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000,
    });

    res.status(200).json({
      message: 'Token refreshed successfully',
    });
  } catch (error) {
    logger.error('Refresh token error:', error);
    res.status(500).json({ message: 'Server error' });
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
        message: 'Email domain does not exist or cannot receive emails',
      });
      return;
    }

    const serviceCompany = await prisma.serviceCompany.findUnique({
      where: { uniqueCode },
    });

    if (!serviceCompany) {
      res.status(404).json({ message: 'Invalid service company code' });
      return;
    }

    const hashedPassword = await hashPassword(password);

    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          role: 'MECHANIC',
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

    res.status(201).json({
      message: 'Mechanic registration submitted. Waiting for admin approval.',
      email: user.email,
    });
  } catch (error) {
    logger.error('Auth error:', error);
    res.status(500).json({ message: 'Server error' });
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
      res.status(400).json({ message: 'Phone number is required' });
      return;
    }

    const serviceCompany = await prisma.serviceCompany.findUnique({
      where: { uniqueCode },
    });

    if (!serviceCompany) {
      res.status(404).json({ message: 'Invalid service company code' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.role !== 'CLIENT') {
      res.status(403).json({ message: 'Only clients can use this endpoint' });
      return;
    }

    const existingClient = await prisma.client.findFirst({
      where: { userId, serviceCompanyId: serviceCompany.id },
    });

    if (existingClient) {
      res.status(400).json({
        message: 'You are already a client of this service company',
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
      message: 'Successfully added to service company',
      client: {
        id: client.id,
        serviceCompanyName: serviceCompany.name,
      },
    });
  } catch (error) {
    logger.error('Auth error:', error);
    res.status(500).json({ message: 'Server error' });
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
        message: 'If email exists, reset code was sent',
      });
      return;
    }

    const resetCode = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    const hashedCode = await hashPassword(resetCode);

    await prisma.passwordReset.create({
      data: {
        userId: user.id,
        token: hashedCode,
        expiresAt,
      },
    });

    const emailService = await import('../services/email.service');
    await emailService.sendEmail(
      email,
      'Код за възстановяване на парола',
      `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #f97316;">Възстановяване на парола</h2>
          <p>Здравейте,</p>
          <p>Вашият код за възстановяване на парола е:</p>
          <h1 style="color: #f97316; text-align: center; font-size: 48px; letter-spacing: 5px;">${resetCode}</h1>
          <p>Кодът е валиден за 15 минути.</p>
          <p>Ако не сте поискали смяна на парола, игнорирайте този имейл.</p>
          <br>
          <p>С уважение,<br>Екипът на AutoManager</p>
        </div>
      `
    );

    res.status(200).json({ message: 'Reset code sent to email' });
  } catch (error) {
    logger.error('Auth error:', error);
    res.status(500).json({ message: 'Server error' });
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
      res.status(400).json({ message: 'Invalid email or code' });
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
      res.status(400).json({ message: 'Invalid or expired code' });
      return;
    }

    const hashedPassword = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    await prisma.passwordReset.delete({
      where: { id: validPasswordReset.id },
    });

    await revokeAllUserRefreshTokens(user.id);

    res.status(200).json({
      message: 'Password reset successfully. Please login again.',
    });
  } catch (error) {
    logger.error('Auth error:', error);
    res.status(500).json({ message: 'Server error' });
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
        message: 'If email exists, reset code was sent',
      });
      return;
    }

    const resetCode = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    const hashedCode = await hashPassword(resetCode);

    await prisma.passwordReset.create({
      data: {
        userId: user.id,
        token: hashedCode,
        expiresAt,
      },
    });

    const emailService = await import('../services/email.service');
    await emailService.sendEmail(
      email,
      'Нов код за възстановяване на парола',
      `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #f97316;">Възстановяване на парола</h2>
          <p>Здравейте,</p>
          <p>Вашият нов код за възстановяване на парола е:</p>
          <h1 style="color: #f97316; text-align: center; font-size: 48px; letter-spacing: 5px;">${resetCode}</h1>
          <p>Кодът е валиден за 15 минути.</p>
          <p>Ако не сте поискали нов код, игнорирайте този имейл.</p>
          <br>
          <p>С уважение,<br>Екипът на AutoManager</p>
        </div>
      `
    );

    res.status(200).json({ message: 'New reset code sent to email' });
  } catch (error) {
    logger.error('Auth error:', error);
    res.status(500).json({ message: 'Server error' });
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
      res.status(400).json({ message: 'User already exists' });
      return;
    }

    const isDomainValid = await validateEmailDomain(email);
    if (!isDomainValid) {
      res.status(400).json({
        message: 'Email domain does not exist or cannot receive emails',
      });
      return;
    }

    const isCompanyEmailValid = await validateEmailDomain(companyEmail);
    if (!isCompanyEmailValid) {
      res.status(400).json({
        message: 'Company email domain does not exist or cannot receive emails',
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

    const accessToken = generateToken(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        tokenVersion: user.tokenVersion,
        serviceCompanyId: serviceCompany.id,
      },
      '15m'
    );

    const refreshToken = await createRefreshToken(user.id);

    res.cookie('refreshToken', refreshToken.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000,
    });

    res.status(201).json({
      message: 'Admin and service company created successfully',
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
    res.status(500).json({ message: 'Server error' });
  }
};