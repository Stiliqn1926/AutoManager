import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';

interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

/**
 * ============================================
 * MECHANIC SERVICE CHECK MIDDLEWARE
 * ============================================
 *
 * Проверява дали механикът има активен сервиз
 * Използва се за защита на operational endpoints
 * ВАЖНО: Пропуска ADMIN потребители (те не са механици)
 */
export const requireActiveService = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const userRole = req.user!.role;

    // Ако е ADMIN, пропусни проверката
    if (userRole === 'ADMIN') {
      next();
      return;
    }

    // Само за MECHANIC - провери активен сервиз
    if (userRole === 'MECHANIC') {
      // Вземи worker профила
      const worker = await prisma.worker.findUnique({
        where: { userId },
        select: {
          id: true,
          serviceCompanyId: true,
        },
      });

      if (!worker) {
        res.status(404).json({
          message: 'Worker profile not found',
          code: 'WORKER_NOT_FOUND'
        });
        return;
      }

      if (!worker.serviceCompanyId) {
        res.status(403).json({
          message: 'No active service company selected',
          code: 'NO_ACTIVE_SERVICE',
        });
        return;
      }

      // Провери дали има ACTIVE membership
      const activeMembership = await prisma.mechanicServiceCompany.findFirst({
        where: {
          workerId: worker.id,
          serviceCompanyId: worker.serviceCompanyId,
          status: 'ACTIVE',
        },
      });

      if (!activeMembership) {
        res.status(403).json({
          message: 'No active service company membership',
          code: 'NO_ACTIVE_MEMBERSHIP',
        });
        return;
      }
    }

    // Всичко е OK, продължи
    next();
  } catch (error) {
    console.error('Mechanic service check error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};