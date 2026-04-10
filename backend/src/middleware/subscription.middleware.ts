import { NextFunction, Request, Response } from 'express';
import { SubscriptionStatus } from '@prisma/client';
import prisma from '../config/database';
import logger from '../services/logger.service';

interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
    serviceCompanyId?: string;
  };
}

const ALLOWED_SUBSCRIPTION_STATUSES = new Set<SubscriptionStatus>([
  SubscriptionStatus.ACTIVE,
  SubscriptionStatus.TRIALING,
]);

export const requireActiveAdminSubscription = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    if (req.user.role !== 'ADMIN') {
      next();
      return;
    }

    const serviceCompany = await prisma.serviceCompany.findUnique({
      where: { userId: req.user.userId },
      select: {
        id: true,
        subscriptionStatus: true,
      },
    });

    if (!serviceCompany) {
      res.status(404).json({
        message: 'Сервизът не е намерен.',
        code: 'SERVICE_COMPANY_NOT_FOUND',
      });
      return;
    }

    if (!serviceCompany.subscriptionStatus) {
      res.status(403).json({
        message: 'Нужен е активен абонамент, за да използвате системата.',
        code: 'NO_ACTIVE_SUBSCRIPTION',
      });
      return;
    }

    if (!ALLOWED_SUBSCRIPTION_STATUSES.has(serviceCompany.subscriptionStatus)) {
      res.status(403).json({
        message: 'Абонаментът не е активен. Завършете плащането, за да продължите.',
        code: 'NO_ACTIVE_SUBSCRIPTION',
      });
      return;
    }

    next();
  } catch (error) {
    logger.error('Subscription middleware error:', error);
    res.status(500).json({ message: 'Сървърна грешка' });
  }
};


