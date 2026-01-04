import { Request, Response } from 'express';
import prisma from '../config/database';
import { getPagination, getPaginationMeta } from '../utils/pagination';

interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

// ==============================
// GET ALL WORKERS (ADMIN)
// ==============================
export const getAllWorkers = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.userId;

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const { skip, take } = getPagination(page, limit);

    const serviceCompany = await prisma.serviceCompany.findUnique({
      where: { userId },
    });

    if (!serviceCompany) {
      res.status(404).json({ message: 'Service company not found' });
      return;
    }

    const totalItems = await prisma.worker.count({
      where: { serviceCompanyId: serviceCompany.id },
    });

    const workers = await prisma.worker.findMany({
      where: { serviceCompanyId: serviceCompany.id },
      skip,
      take,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        specialization: true,
        skills: true, // ✅ ДОБАВЕНО
        isActive: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            email: true,
            isActive: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const pagination = getPaginationMeta(totalItems, page, limit);

    res.status(200).json({ workers, pagination });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// ==============================
// GET WORKER BY ID
// ==============================
export const getWorkerById = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    const serviceCompany = await prisma.serviceCompany.findUnique({
      where: { userId },
    });

    if (!serviceCompany) {
      res.status(404).json({ message: 'Service company not found' });
      return;
    }

    const worker = await prisma.worker.findUnique({
      where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        specialization: true,
        skills: true, // ✅ ДОБАВЕНО
        isActive: true,
        createdAt: true,
        user: {
          select: {
            email: true,
            isActive: true,
          },
        },
        serviceCompanyId: true,
      },
    });

    if (!worker) {
      res.status(404).json({ message: 'Worker not found' });
      return;
    }

    if (worker.serviceCompanyId !== serviceCompany.id) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }

    res.status(200).json({ worker });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// ==============================
// UPDATE WORKER
// ==============================
export const updateWorker = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { firstName, lastName, phone, specialization, skills } = req.body;
    const userId = req.user!.userId;

    const serviceCompany = await prisma.serviceCompany.findUnique({
      where: { userId },
    });

    if (!serviceCompany) {
      res.status(404).json({ message: 'Service company not found' });
      return;
    }

    const worker = await prisma.worker.findUnique({
      where: { id },
    });

    if (!worker) {
      res.status(404).json({ message: 'Worker not found' });
      return;
    }

    if (worker.serviceCompanyId !== serviceCompany.id) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }

    const updatedWorker = await prisma.worker.update({
      where: { id },
      data: {
        ...(firstName !== undefined && { firstName }),
        ...(lastName !== undefined && { lastName }),
        ...(phone !== undefined && { phone }),
        ...(specialization !== undefined && { specialization }),
        ...(skills !== undefined && { skills }), // ✅ КЛЮЧОВО
      },
    });

    res.status(200).json({
      message: 'Worker updated successfully',
      worker: updatedWorker,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// ==============================
// DELETE (DEACTIVATE) WORKER
// ==============================
export const deleteWorker = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    const serviceCompany = await prisma.serviceCompany.findUnique({
      where: { userId },
    });

    if (!serviceCompany) {
      res.status(404).json({ message: 'Service company not found' });
      return;
    }

    const worker = await prisma.worker.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        serviceCompanyId: true,
      },
    });

    if (!worker) {
      res.status(404).json({ message: 'Worker not found' });
      return;
    }

    if (worker.serviceCompanyId !== serviceCompany.id) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }

    await prisma.$transaction([
      prisma.worker.update({
        where: { id },
        data: { isActive: false },
      }),
      prisma.user.update({
        where: { id: worker.userId },
        data: { isActive: false },
      }),
    ]);

    res.status(200).json({
      message: 'Worker deactivated successfully',
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// ==============================
// GET WORKERS AVAILABILITY
// ==============================
export const getWorkersAvailability = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { date, startTime, endTime } = req.query;

    const serviceCompany = await prisma.serviceCompany.findUnique({
      where: { userId },
    });

    if (!serviceCompany) {
      res.status(404).json({ message: 'Service company not found' });
      return;
    }

    // Вземи всички активни механици
    const workers = await prisma.worker.findMany({
      where: {
        serviceCompanyId: serviceCompany.id,
        isActive: true
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        specialization: true,
      },
    });

    // Ако няма дата/час, върни само списъка
    if (!date || !startTime || !endTime) {
      const workersWithAvailability = workers.map(worker => ({
        ...worker,
        isAvailable: true,
        conflictingSchedules: [],
      }));

      res.status(200).json({ workers: workersWithAvailability });
      return;
    }

    // Изгради времевите граници
    const requestedStart = new Date(`${date}T${startTime}`);
    const requestedEnd = new Date(`${date}T${endTime}`);

    // Провери за конфликти - САМО активни графици
    const workersWithAvailability = await Promise.all(
      workers.map(async (worker) => {
        const conflicts = await prisma.schedule.findMany({
          where: {
            workerId: worker.id,
            status: { in: ['SCHEDULED', 'IN_PROGRESS'] }, // ✅ САМО активни статуси
            OR: [
              {
                AND: [
                  { startTime: { lte: requestedStart } },
                  { endTime: { gt: requestedStart } },
                ],
              },
              {
                AND: [
                  { startTime: { lt: requestedEnd } },
                  { endTime: { gte: requestedEnd } },
                ],
              },
              {
                AND: [
                  { startTime: { gte: requestedStart } },
                  { endTime: { lte: requestedEnd } },
                ],
              },
            ],
          },
          include: {
            order: {
              select: {
                orderNumber: true,
                status: true,
              },
            },
          },
        });

        // Филтрирай само конфликти със активни поръчки
        const activeConflicts = conflicts.filter(schedule => {
          // Ако няма свързана поръчка, значи е самостоятелна задача - брои като конфликт
          if (!schedule.order) return true;

          // Ако има поръчка, провери дали е активна
          return ['WAITING', 'IN_PROGRESS', 'READY'].includes(schedule.order.status);
        });

        return {
          ...worker,
          isAvailable: activeConflicts.length === 0,
          conflictingSchedules: activeConflicts.map(s => ({
            id: s.id,
            title: s.title,
            startTime: s.startTime,
            endTime: s.endTime,
            orderNumber: s.order?.orderNumber,
          })),
        };
      })
    );

    res.status(200).json({ workers: workersWithAvailability });
  } catch (error) {
    console.error('Get workers availability error:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};
