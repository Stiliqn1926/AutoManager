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
        message: 'Ð¡ÐµÑ€Ð²Ð¸Ð·ÑŠÑ‚ Ð½Ðµ Ðµ Ð½Ð°Ð¼ÐµÑ€ÐµÐ½.',
        code: 'SERVICE_COMPANY_NOT_FOUND',
      });
      return;
    }

    if (!serviceCompany.subscriptionStatus) {
      res.status(403).json({
        message: 'ÐÑƒÐ¶ÐµÐ½ Ðµ Ð°ÐºÑ‚Ð¸Ð²ÐµÐ½ Ð°Ð±Ð¾Ð½Ð°Ð¼ÐµÐ½Ñ‚, Ð·Ð° Ð´Ð° Ð¸Ð·Ð¿Ð¾Ð»Ð·Ð²Ð°Ñ‚Ðµ ÑÐ¸ÑÑ‚ÐµÐ¼Ð°Ñ‚Ð°.',
        code: 'NO_ACTIVE_SUBSCRIPTION',
      });
      return;
    }

    if (!ALLOWED_SUBSCRIPTION_STATUSES.has(serviceCompany.subscriptionStatus)) {
      res.status(403).json({
        message: 'ÐÐ±Ð¾Ð½Ð°Ð¼ÐµÐ½Ñ‚ÑŠÑ‚ Ð½Ðµ Ðµ Ð°ÐºÑ‚Ð¸Ð²ÐµÐ½. Ð—Ð°Ð²ÑŠÑ€ÑˆÐµÑ‚Ðµ Ð¿Ð»Ð°Ñ‰Ð°Ð½ÐµÑ‚Ð¾, Ð·Ð° Ð´Ð° Ð¿Ñ€Ð¾Ð´ÑŠÐ»Ð¶Ð¸Ñ‚Ðµ.',
        code: 'NO_ACTIVE_SUBSCRIPTION',
      });
      return;
    }

    next();
  } catch (error) {
    logger.error('Subscription middleware error:', error);
    res.status(500).json({ message: 'Ð¡ÑŠÑ€Ð²ÑŠÑ€Ð½Ð° Ð³Ñ€ÐµÑˆÐºÐ°' });
  }
};


