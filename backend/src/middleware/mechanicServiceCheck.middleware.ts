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
 * Ensures mechanics operate under an active service membership.
 * Admin users bypass this middleware by design.
 */
export const requireActiveService = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const userRole = req.user!.role;


    if (userRole === 'ADMIN') {
      next();
      return;
    }


    if (userRole === 'MECHANIC') {

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


    next();
  } catch (error) {
    console.error('Mechanic service check error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

