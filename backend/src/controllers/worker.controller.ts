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

    // За списъка показваме ACTIVE, PENDING и INACTIVE (напуснали) механици
    // За dashboard (без pagination) показваме само ACTIVE
    const showOnlyActive = !req.query.page && !req.query.limit;

    const totalItems = await prisma.mechanicServiceCompany.count({
      where: {
        serviceCompanyId: serviceCompany.id,
        status: showOnlyActive ? 'ACTIVE' : { in: ['ACTIVE', 'PENDING', 'INACTIVE'] },
      },
    });

    const memberships = await prisma.mechanicServiceCompany.findMany({
      where: {
        serviceCompanyId: serviceCompany.id,
        status: showOnlyActive ? 'ACTIVE' : { in: ['ACTIVE', 'PENDING', 'INACTIVE'] },
        worker: {
          deletedAt: null,
        },
      },
      skip,
      take,
      include: {
        worker: {
          include: {
            user: {
              select: {
                email: true,
                isActive: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Transform data за по-лесна frontend обработка
    const workersWithMembership = memberships.map((membership) => ({
      id: membership.worker.id,
      firstName: membership.worker.firstName,
      lastName: membership.worker.lastName,
      phone: membership.worker.phone,
      specialization: membership.worker.specialization,
      skills: membership.worker.skills,
      isActive: membership.worker.isActive,
      createdAt: membership.worker.createdAt,
      updatedAt: membership.worker.updatedAt,
      user: membership.worker.user,
      // ✅ Membership информация
      membershipStatus: membership.status,
      isCurrentlyActive: membership.worker.serviceCompanyId === serviceCompany.id,
      leftAt: membership.leftAt,
      joinedAt: membership.joinedAt,
    }));

    const pagination = getPaginationMeta(totalItems, page, limit);

    res.status(200).json({ workers: workersWithMembership, pagination });
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

    // Провери дали има membership за този сервиз (ACTIVE, INACTIVE, или PENDING)
    const membership = await prisma.mechanicServiceCompany.findFirst({
      where: {
        workerId: worker.id,
        serviceCompanyId: serviceCompany.id,
        status: { in: ['ACTIVE', 'INACTIVE', 'PENDING'] },
      },
    });

    if (!membership) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }

    res.status(200).json({
      worker: {
        ...worker,
        membershipStatus: membership.status,
        joinedAt: membership.joinedAt,
        leftAt: membership.leftAt,
      },
    });
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

    // Провери дали има membership за този сервиз (ACTIVE, INACTIVE, или PENDING)
    const membership = await prisma.mechanicServiceCompany.findFirst({
      where: {
        workerId: worker.id,
        serviceCompanyId: serviceCompany.id,
        status: { in: ['ACTIVE', 'INACTIVE', 'PENDING'] },
      },
    });

    if (!membership) {
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
// 1. TOGGLE ACTIVE/INACTIVE (временна деактивация - отпуска)
// ==============================
export const toggleWorkerActive = async (
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

    // Провери дали механикът принадлежи към този сервиз
    const membership = await prisma.mechanicServiceCompany.findFirst({
      where: {
        worker: { id },
        serviceCompanyId: serviceCompany.id,
        status: { in: ['ACTIVE', 'INACTIVE'] },
      },
      include: {
        worker: true,
      },
    });

    if (!membership) {
      res.status(404).json({ message: 'Worker not found in this service company' });
      return;
    }

    // Toggle worker.isActive (НЕ user.isActive!)
    const updatedWorker = await prisma.worker.update({
      where: { id: membership.worker.id },
      data: { isActive: !membership.worker.isActive },
    });

    res.status(200).json({
      message: `Worker ${updatedWorker.isActive ? 'activated' : 'deactivated'} successfully`,
      worker: updatedWorker,
    });
  } catch (error) {
    console.error('Toggle worker active error:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

// ==============================
// 2. REMOVE FROM SERVICE (премахване от ТОЗИ сервиз)
// ==============================
export const removeWorkerFromService = async (
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

    // Намери membership записа
    const membership = await prisma.mechanicServiceCompany.findFirst({
      where: {
        worker: { id },
        serviceCompanyId: serviceCompany.id,
      },
      include: {
        worker: true,
      },
    });

    if (!membership) {
      res.status(404).json({ message: 'Worker not found in this service company' });
      return;
    }

    // Маркирай като INACTIVE
    await prisma.mechanicServiceCompany.update({
      where: { id: membership.id },
      data: {
        status: 'INACTIVE',
        leftAt: new Date(),
      },
    });

    // Ако това е активният му сервиз, switch към друг ACTIVE (ако има)
    if (membership.worker.serviceCompanyId === serviceCompany.id) {
      const otherActiveMembership = await prisma.mechanicServiceCompany.findFirst({
        where: {
          workerId: membership.worker.id,
          status: 'ACTIVE',
          serviceCompanyId: { not: serviceCompany.id },
        },
      });

      if (otherActiveMembership) {
        await prisma.worker.update({
          where: { id: membership.worker.id },
          data: { serviceCompanyId: otherActiveMembership.serviceCompanyId },
        });
      } else {
        // Няма други активни сервизи - задай null и isActive = false
        await prisma.worker.update({
          where: { id: membership.worker.id },
          data: {
            serviceCompanyId: null,
            isActive: false,
          },
        });
      }
    }

    res.status(200).json({
      message: 'Worker removed from service successfully',
    });
  } catch (error) {
    console.error('Remove worker from service error:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

// ==============================
// 3. PERMANENT DELETE (изтриване от системата)
// ==============================
export const deleteWorkerPermanently = async (
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
      include: {
        mechanicServiceCompanies: true,
      },
    });

    if (!worker) {
      res.status(404).json({ message: 'Worker not found' });
      return;
    }

    // Намери membership записа за този сервиз
    const membership = worker.mechanicServiceCompanies.find(
      (m) => m.serviceCompanyId === serviceCompany.id
    );

    if (!membership) {
      res.status(403).json({ message: 'Worker does not belong to this service company' });
      return;
    }

    // Провери дали membership-ът е INACTIVE (напуснал)
    // Позволяваме изтриване САМО на напуснали механици
    if (membership.status !== 'INACTIVE') {
      res.status(400).json({
        message: 'Cannot permanently delete worker. Worker must leave the service first.',
      });
      return;
    }

    // ИЗТРИЙ напълно MechanicServiceCompany записа
    await prisma.mechanicServiceCompany.delete({
      where: { id: membership.id },
    });

    // Ако механикът няма други сервизи, обнови Worker записа
    const remainingMemberships = await prisma.mechanicServiceCompany.count({
      where: { workerId: worker.id },
    });

    if (remainingMemberships === 0) {
      // Няма други сервизи - задай null на serviceCompanyId
      await prisma.worker.update({
        where: { id: worker.id },
        data: {
          serviceCompanyId: null,
          isActive: false,
        },
      });
    }

    res.status(200).json({
      message: 'Worker removed permanently from service company',
    });
  } catch (error) {
    console.error('Delete worker permanently error:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

// ==============================
// DELETE WORKER FROM SERVICE LIST
// Изтрива механика от списъка на сервиза, но НЕ изтрива профила му
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

    // Намери membership записа
    const membership = await prisma.mechanicServiceCompany.findFirst({
      where: {
        worker: { id },
        serviceCompanyId: serviceCompany.id,
      },
      include: {
        worker: true,
      },
    });

    if (!membership) {
      res.status(404).json({ message: 'Worker not found in this service company' });
      return;
    }

    // ✅ ПРОВЕРКА: Има ли активни поръчки или задачи?
    const [activeOrders, activeSchedules] = await Promise.all([
      prisma.order.findMany({
        where: {
          workerId: membership.worker.id,
          serviceCompanyId: serviceCompany.id,
          status: { in: ['WAITING', 'IN_PROGRESS', 'READY'] },
        },
        select: {
          id: true,
          orderNumber: true,
          displayOrderNumber: true,
          status: true,
          description: true,
        },
      }),
      prisma.schedule.findMany({
        where: {
          workerId: membership.worker.id,
          serviceCompanyId: serviceCompany.id,
          status: { in: ['SCHEDULED', 'IN_PROGRESS'] },
        },
        select: {
          id: true,
          startTime: true,
          endTime: true,
          description: true,
        },
      }),
    ]);

    // Ако има активни поръчки или задачи, НЕ позволяваме изтриване
    if (activeOrders.length > 0 || activeSchedules.length > 0) {
      res.status(400).json({
        message: 'Cannot delete worker with active tasks',
        hasActiveTasks: true,
        activeOrdersCount: activeOrders.length,
        activeSchedulesCount: activeSchedules.length,
        activeOrders,
        activeSchedules,
      });
      return;
    }

    // Изтрий свързани pending requests (ако има)
    await prisma.pendingRequest.deleteMany({
      where: {
        email: membership.worker.email,
        serviceCompanyId: serviceCompany.id,
        status: 'PENDING',
      },
    });

    // МАРКИРАЙ membership като INACTIVE (вместо да го изтриваш)
    await prisma.mechanicServiceCompany.update({
      where: { id: membership.id },
      data: {
        status: 'INACTIVE',
        leftAt: new Date(),
      },
    });

    // Ако това е активният му сервиз, switch към друг ACTIVE (ако има)
    if (membership.worker.serviceCompanyId === serviceCompany.id) {
      const otherActiveMembership = await prisma.mechanicServiceCompany.findFirst({
        where: {
          workerId: membership.worker.id,
          status: 'ACTIVE',
          serviceCompanyId: { not: serviceCompany.id },
        },
      });

      if (otherActiveMembership) {
        await prisma.worker.update({
          where: { id: membership.worker.id },
          data: { serviceCompanyId: otherActiveMembership.serviceCompanyId },
        });
      } else {
        // Няма други активни сервизи - задай null и isActive = false
        await prisma.worker.update({
          where: { id: membership.worker.id },
          data: {
            serviceCompanyId: null,
            isActive: false,
          },
        });
      }
    }

    res.status(200).json({
      message: 'Worker deleted from service successfully',
    });
  } catch (error) {
    console.error('Delete worker error:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

// ==============================
// REASSIGN WORKER TASKS AND DELETE
// Прехвърля активни поръчки/задачи към друг механик и изтрива стария
// ==============================
export const reassignWorkerAndDelete = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { newWorkerId } = req.body;
    const userId = req.user!.userId;

    if (!newWorkerId) {
      res.status(400).json({ message: 'New worker ID is required' });
      return;
    }

    const serviceCompany = await prisma.serviceCompany.findUnique({
      where: { userId },
    });

    if (!serviceCompany) {
      res.status(404).json({ message: 'Service company not found' });
      return;
    }

    // Намери старият механик
    const oldMembership = await prisma.mechanicServiceCompany.findFirst({
      where: {
        worker: { id },
        serviceCompanyId: serviceCompany.id,
      },
      include: {
        worker: true,
      },
    });

    if (!oldMembership) {
      res.status(404).json({ message: 'Worker not found in this service company' });
      return;
    }

    // Провери дали новият механик съществува и е ACTIVE в този сервиз
    const newMembership = await prisma.mechanicServiceCompany.findFirst({
      where: {
        worker: { id: newWorkerId },
        serviceCompanyId: serviceCompany.id,
        status: 'ACTIVE',
      },
      include: {
        worker: true,
      },
    });

    if (!newMembership) {
      res.status(404).json({ message: 'New worker not found or not active in this service company' });
      return;
    }

    // Прехвърли всички активни поръчки към новия механик
    await prisma.order.updateMany({
      where: {
        workerId: oldMembership.worker.id,
        serviceCompanyId: serviceCompany.id,
        status: { in: ['WAITING', 'IN_PROGRESS', 'READY'] },
      },
      data: {
        workerId: newMembership.worker.id,
      },
    });

    // Прехвърли всички активни задачи към новия механик
    await prisma.schedule.updateMany({
      where: {
        workerId: oldMembership.worker.id,
        serviceCompanyId: serviceCompany.id,
        status: { in: ['SCHEDULED', 'IN_PROGRESS'] },
      },
      data: {
        workerId: newMembership.worker.id,
      },
    });

    // Изтрий pending requests
    await prisma.pendingRequest.deleteMany({
      where: {
        email: oldMembership.worker.email,
        serviceCompanyId: serviceCompany.id,
        status: 'PENDING',
      },
    });

    // МАРКИРАЙ membership като INACTIVE (вместо да го изтриваш)
    await prisma.mechanicServiceCompany.update({
      where: { id: oldMembership.id },
      data: {
        status: 'INACTIVE',
        leftAt: new Date(),
      },
    });

    // Обнови worker serviceCompanyId ако е нужно
    if (oldMembership.worker.serviceCompanyId === serviceCompany.id) {
      const otherActiveMembership = await prisma.mechanicServiceCompany.findFirst({
        where: {
          workerId: oldMembership.worker.id,
          status: 'ACTIVE',
          serviceCompanyId: { not: serviceCompany.id },
        },
      });

      if (otherActiveMembership) {
        await prisma.worker.update({
          where: { id: oldMembership.worker.id },
          data: { serviceCompanyId: otherActiveMembership.serviceCompanyId },
        });
      } else {
        await prisma.worker.update({
          where: { id: oldMembership.worker.id },
          data: {
            serviceCompanyId: null,
            isActive: false,
          },
        });
      }
    }

    res.status(200).json({
      message: 'Worker tasks reassigned and worker deleted successfully',
      reassignedTo: {
        id: newMembership.worker.id,
        name: `${newMembership.worker.firstName} ${newMembership.worker.lastName}`,
      },
    });
  } catch (error) {
    console.error('Reassign worker error:', error);
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

    // Вземи всички активни механици с ACTIVE membership
    const activeMemberships = await prisma.mechanicServiceCompany.findMany({
      where: {
        serviceCompanyId: serviceCompany.id,
        status: 'ACTIVE',
        worker: {
          deletedAt: null,
          isActive: true,
          user: {
            isActive: true,
          },
        },
      },
      select: {
        worker: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            specialization: true,
          },
        },
      },
    });

    const workers = activeMemberships.map((membership) => membership.worker);

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
    const workerIds = workers.map((worker) => worker.id);

    const conflicts = workerIds.length > 0
      ? await prisma.schedule.findMany({
          where: {
            workerId: { in: workerIds },
            status: { in: ['SCHEDULED', 'IN_PROGRESS'] }, // Only active schedule statuses
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
                displayOrderNumber: true,
                status: true,
              },
            },
          },
        })
      : [];

    const conflictsByWorkerId = new Map<string, (typeof conflicts)[number][]>();

    for (const schedule of conflicts) {
      if (!schedule.workerId) {
        continue;
      }

      const workerConflicts = conflictsByWorkerId.get(schedule.workerId) ?? [];
      workerConflicts.push(schedule);
      conflictsByWorkerId.set(schedule.workerId, workerConflicts);
    }

    const workersWithAvailability = workers.map((worker) => {
      const workerConflicts = conflictsByWorkerId.get(worker.id) ?? [];

      // Keep only conflicts that block worker availability
      const activeConflicts = workerConflicts.filter((schedule) => {
        // Task without order still blocks the requested slot
        if (!schedule.order) return true;

        // If there is an order, block only while the order is active
        return ['WAITING', 'IN_PROGRESS', 'READY'].includes(schedule.order.status);
      });

      return {
        ...worker,
        isAvailable: activeConflicts.length === 0,
        conflictingSchedules: activeConflicts.map((s) => ({
          id: s.id,
          title: s.title,
          startTime: s.startTime,
          endTime: s.endTime,
          orderNumber: s.order?.orderNumber,
          displayOrderNumber: s.order?.displayOrderNumber,
        })),
      };
    });

    res.status(200).json({ workers: workersWithAvailability });
  } catch (error) {
    console.error('Get workers availability error:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};
 
// ============================================
// GET MECHANIC PROFILE (собствен профил)
// ============================================
export const getMechanicProfile = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.userId;

    const worker = await prisma.worker.findUnique({
      where: { userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        specialization: true,
        skills: true,
        isActive: true,
        createdAt: true,
        user: {
          select: {
            email: true,
            isActive: true,
          },
        },
      },
    });

    if (!worker) {
      res.status(404).json({ message: 'Worker profile not found' });
      return;
    }

    res.status(200).json({ worker });
  } catch (error) {
    console.error('Get mechanic profile error:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

// ============================================
// UPDATE MECHANIC PROFILE (firstName, lastName, phone, specialization, skills)
// ============================================
export const updateMechanicProfile = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { firstName, lastName, phone, specialization, skills } = req.body;

    const worker = await prisma.worker.findUnique({
      where: { userId },
    });

    if (!worker) {
      res.status(404).json({ message: 'Worker profile not found' });
      return;
    }

    const updatedWorker = await prisma.worker.update({
      where: { id: worker.id },
      data: {
        ...(firstName !== undefined && { firstName }),
        ...(lastName !== undefined && { lastName }),
        ...(phone !== undefined && { phone }),
        ...(specialization !== undefined && { specialization }),
        ...(skills !== undefined && { skills }),
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        specialization: true,
        skills: true,
        isActive: true,
        createdAt: true,
        user: {
          select: {
            email: true,
            isActive: true,
          },
        },
      },
    });

    res.status(200).json({
      message: 'Profile updated successfully',
      worker: updatedWorker,
    });
  } catch (error) {
    console.error('Update mechanic profile error:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

// ============================================
// GET MECHANIC STATISTICS
// ============================================
export const getMechanicStatistics = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.userId;

    const worker = await prisma.worker.findUnique({
      where: { userId },
    });

    if (!worker) {
      res.status(404).json({ message: 'Worker profile not found' });
      return;
    }

    // Ако няма активен сервиз, върни празна статистика
    if (!worker.serviceCompanyId) {
      res.status(200).json({
        statistics: {
          totalOrders: 0,
          completedOrders: 0,
          activeOrders: 0,
          ordersToday: 0,
          ordersThisWeek: 0,
          ordersThisMonth: 0,
          lastCompletedOrder: null,
        },
      });
      return;
    }

    // Обща статистика
    const totalOrders = await prisma.order.count({
      where: {
        workerId: worker.id,
        serviceCompanyId: worker.serviceCompanyId,
      },
    });

    const completedOrders = await prisma.order.count({
      where: {
        workerId: worker.id,
        serviceCompanyId: worker.serviceCompanyId,
        status: 'COMPLETED',
      },
    });

    const activeOrders = await prisma.order.count({
      where: {
        workerId: worker.id,
        serviceCompanyId: worker.serviceCompanyId,
        status: { in: ['WAITING', 'IN_PROGRESS', 'READY'] },
      },
    });

    // Последна завършена поръчка
    const lastCompletedOrder = await prisma.order.findFirst({
      where: {
        workerId: worker.id,
        serviceCompanyId: worker.serviceCompanyId,
        status: 'COMPLETED',
      },
      orderBy: {
        completedDate: 'desc',
      },
      select: {
        id: true,
        orderNumber: true,
        displayOrderNumber: true,
        completedDate: true,
      },
    });

    // Поръчки днес
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const ordersToday = await prisma.order.count({
      where: {
        workerId: worker.id,
        serviceCompanyId: worker.serviceCompanyId,
        status: { in: ['WAITING', 'IN_PROGRESS', 'READY'] },
        createdAt: { gte: today, lt: tomorrow },
      },
    });

    // Поръчки тази седмица
    const weekStart = new Date(today);
    const dayOfWeek = weekStart.getDay();
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    weekStart.setDate(weekStart.getDate() - diff);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const ordersThisWeek = await prisma.order.count({
      where: {
        workerId: worker.id,
        serviceCompanyId: worker.serviceCompanyId,
        status: { in: ['WAITING', 'IN_PROGRESS', 'READY'] },
        createdAt: { gte: weekStart, lt: weekEnd },
      },
    });

    // Предстоящи задачи (от графика)
    const upcomingTasks = await prisma.schedule.count({
      where: {
        workerId: worker.id,
        serviceCompanyId: worker.serviceCompanyId,
        status: { in: ['SCHEDULED', 'IN_PROGRESS'] },
        startTime: { gte: new Date() },
      },
    });

    res.status(200).json({
      statistics: {
        totalOrders,
        completedOrders,
        activeOrders,
        lastCompletedOrder,
        ordersToday,
        ordersThisWeek,
        upcomingTasks,
      },
    });
  } catch (error) {
    console.error('Get mechanic statistics error:', error);
    res.status(500).json({ message: 'Server error', error });
  }
}; 

// ============================================
// GET MECHANIC SERVICE COMPANIES (всички сервизи)
// ============================================
export const getMechanicServiceCompanies = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.userId;

    const worker = await prisma.worker.findUnique({
      where: { userId },
    });

    if (!worker) {
      res.status(404).json({ message: 'Worker profile not found' });
      return;
    }

    // Вземи всички сервизи на механика
    const serviceCompanies = await prisma.mechanicServiceCompany.findMany({
      where: {
        workerId: worker.id,
      },
      include: {
        serviceCompany: {
          select: {
            id: true,
            name: true,
            address: true,
            phone: true,
            email: true,
            uniqueCode: true,
          },
        },
      },
      orderBy: {
        joinedAt: 'desc',
      },
    });

    res.status(200).json({
      serviceCompanies: serviceCompanies.map((msc) => ({
        id: msc.id,
        status: msc.status,
        joinedAt: msc.joinedAt,
        leftAt: msc.leftAt,
        serviceCompany: msc.serviceCompany,
      })),
    });
  } catch (error) {
    console.error('Get mechanic service companies error:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

// ============================================
// GET ACTIVE SERVICE COMPANY (активен сервиз)
// ============================================
export const getActiveServiceCompany = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.userId;

    const worker = await prisma.worker.findUnique({
      where: { userId },
      select: {
        id: true,
        serviceCompanyId: true,
      },
    });

    if (!worker) {
      res.status(404).json({ message: 'Worker profile not found' });
      return;
    }

    // Провери дали има активен сервиз
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
      include: {
        serviceCompany: {
          select: {
            id: true,
            name: true,
            address: true,
            phone: true,
            email: true,
            uniqueCode: true,
          },
        },
      },
    });

    if (!activeMembership) {
      res.status(403).json({
        message: 'No active service company membership',
        code: 'NO_ACTIVE_MEMBERSHIP',
      });
      return;
    }

    res.status(200).json({
      serviceCompany: activeMembership.serviceCompany,
    });
  } catch (error) {
    console.error('Get active service company error:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

// ============================================
// REQUEST NEW SERVICE COMPANY (заявка за нов сервиз)
// ============================================
export const requestServiceCompany = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { uniqueCode } = req.body;

    const worker = await prisma.worker.findUnique({
      where: { userId },
    });

    if (!worker) {
      res.status(404).json({ message: 'Worker profile not found' });
      return;
    }

    // Намери сервиза по код
    const serviceCompany = await prisma.serviceCompany.findUnique({
      where: { uniqueCode },
    });

    if (!serviceCompany) {
      res.status(404).json({ message: 'Невалиден код на сервиз' });
      return;
    }

    // Провери дали вече има членство
    const existingMembership = await prisma.mechanicServiceCompany.findUnique({
      where: {
        workerId_serviceCompanyId: {
          workerId: worker.id,
          serviceCompanyId: serviceCompany.id,
        },
      },
    });

    if (existingMembership) {
      if (existingMembership.status === 'ACTIVE') {
        res.status(400).json({ message: 'Вече сте член на този сервиз' });
        return;
      }
      if (existingMembership.status === 'PENDING') {
        res.status(400).json({ message: 'Вече имате чакаща заявка за този сервиз' });
        return;
      }

      // Ако е INACTIVE, обнови съществуващия запис вместо да създаваш нов
      if (existingMembership.status === 'INACTIVE') {
        // ✅ КРИТИЧНА ПОПРАВКА: ВИНАГИ PENDING, НИКОГА автоматично ACTIVE!
        // Механикът ТРЯБВА да чака одобрение от админа за ВСЯКА заявка
        const membershipStatus = 'PENDING';

        // Обнови съществуващия запис
        const updatedMembership = await prisma.mechanicServiceCompany.update({
          where: { id: existingMembership.id },
          data: {
            status: membershipStatus,
            leftAt: null,
            joinedAt: new Date(),
          },
          include: {
            serviceCompany: {
              select: {
                id: true,
                name: true,
                address: true,
                phone: true,
                email: true,
              },
            },
          },
        });

        // Създай PendingRequest за админа
        await prisma.pendingRequest.create({
          data: {
            email: worker.email,
            firstName: worker.firstName,
            lastName: worker.lastName,
            phone: worker.phone,
            specialization: worker.specialization,
            skills: worker.skills,
            serviceCompanyId: serviceCompany.id,
            status: 'PENDING',
          },
        });

        res.status(201).json({
          message: 'Заявката е изпратена успешно. Очаква одобрение от администратор.',
          membership: {
            id: updatedMembership.id,
            status: updatedMembership.status,
            serviceCompany: updatedMembership.serviceCompany,
          },
        });
        return;
      }
    }

    // ✅ КРИТИЧНА ПОПРАВКА: ВИНАГИ PENDING, НИКОГА автоматично ACTIVE!
    // Механикът ТРЯБВА да чака одобрение от админа за ВСЯКА заявка
    const membershipStatus = 'PENDING';

    // Създай нова заявка
    const membership = await prisma.mechanicServiceCompany.create({
      data: {
        workerId: worker.id,
        serviceCompanyId: serviceCompany.id,
        status: membershipStatus,
      },
      include: {
        serviceCompany: {
          select: {
            id: true,
            name: true,
            address: true,
            phone: true,
            email: true,
          },
        },
      },
    });

    // Създай PendingRequest за админа
    await prisma.pendingRequest.create({
      data: {
        email: worker.email,
        firstName: worker.firstName,
        lastName: worker.lastName,
        phone: worker.phone,
        specialization: worker.specialization,
        skills: worker.skills,
        serviceCompanyId: serviceCompany.id,
        status: 'PENDING',
      },
    });

    res.status(201).json({
      message: 'Заявката е изпратена успешно. Очаква одобрение от администратор.',
      membership: {
        id: membership.id,
        status: membership.status,
        serviceCompany: membership.serviceCompany,
      },
    });
  } catch (error) {
    console.error('Request service company error:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

// ============================================
// SWITCH ACTIVE SERVICE COMPANY (смяна на активен сервиз)
// ============================================
export const switchServiceCompany = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { serviceCompanyId } = req.body;

    const worker = await prisma.worker.findUnique({
      where: { userId },
    });

    if (!worker) {
      res.status(404).json({ message: 'Worker profile not found' });
      return;
    }

    // Провери дали има ACTIVE членство в този сервиз
    const membership = await prisma.mechanicServiceCompany.findFirst({
      where: {
        workerId: worker.id,
        serviceCompanyId,
        status: 'ACTIVE',
      },
    });

    if (!membership) {
      res.status(404).json({ 
        message: 'Не сте активен член на този сервиз' 
      });
      return;
    }

    // Обнови активния сервиз в Worker
    await prisma.worker.update({
      where: { id: worker.id },
      data: {
        serviceCompanyId,
      },
    });

    res.status(200).json({
      message: 'Активният сервиз е сменен успешно',
      serviceCompanyId,
    });
  } catch (error) {
    console.error('Switch service company error:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

// ============================================
// CANCEL PENDING REQUEST (отказ от чакаща заявка)
// ============================================
export const cancelPendingRequest = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { membershipId } = req.params;

    const worker = await prisma.worker.findUnique({
      where: { userId },
    });

    if (!worker) {
      res.status(404).json({ message: 'Worker profile not found' });
      return;
    }

    // Намери membership-а
    const membership = await prisma.mechanicServiceCompany.findUnique({
      where: { id: membershipId },
    });

    if (!membership || membership.workerId !== worker.id) {
      res.status(404).json({ message: 'Membership not found' });
      return;
    }

    // Проверка дали е PENDING
    if (membership.status !== 'PENDING') {
      res.status(400).json({
        message: 'Можете да откажете само чакащи заявки'
      });
      return;
    }

    // Изтрий съответния PendingRequest (ако има)
    await prisma.pendingRequest.deleteMany({
      where: {
        email: worker.email,
        serviceCompanyId: membership.serviceCompanyId,
        status: 'PENDING',
      },
    });

    // ✅ ПОПРАВКА: Маркирай като INACTIVE вместо DELETE
    // Това предотвратява създаване на ново ACTIVE membership при повторна заявка
    await prisma.mechanicServiceCompany.update({
      where: { id: membershipId },
      data: {
        status: 'INACTIVE',
        leftAt: new Date(),
      },
    });

    res.status(200).json({
      message: 'Заявката е отказана успешно',
    });
  } catch (error) {
    console.error('Cancel pending request error:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

// ============================================
// LEAVE SERVICE COMPANY (напускане на сервиз)
// ============================================
export const leaveServiceCompany = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { membershipId } = req.params;

    const worker = await prisma.worker.findUnique({
      where: { userId },
    });

    if (!worker) {
      res.status(404).json({ message: 'Worker profile not found' });
      return;
    }

    // Намери membership-а
    const membership = await prisma.mechanicServiceCompany.findUnique({
      where: { id: membershipId },
    });

    if (!membership || membership.workerId !== worker.id) {
      res.status(404).json({ message: 'Membership not found' });
      return;
    }

    // Провери дали механикът има активни поръчки за този сервиз
    const activeOrders = await prisma.order.count({
      where: {
        workerId: worker.id,
        serviceCompanyId: membership.serviceCompanyId,
        status: { in: ['WAITING', 'IN_PROGRESS', 'READY'] },
      },
    });

    // Провери дали механикът има активни schedule за този сервиз
    const activeSchedules = await prisma.schedule.count({
      where: {
        workerId: worker.id,
        serviceCompanyId: membership.serviceCompanyId,
        status: { notIn: ['COMPLETED', 'CANCELLED'] },
      },
    });

    if (activeOrders > 0 || activeSchedules > 0) {
      res.status(400).json({
        message: 'Не можете да напуснете сервиза докато имате активни задачи',
        activeOrdersCount: activeOrders,
        activeSchedulesCount: activeSchedules,
      });
      return;
    }

    // ✅ ПОПРАВКА: Механикът МОЖЕ да напусне последния си сервиз
    // Ако напуска текущия активен сервиз, смени го с друг ACTIVE (ако има)
    if (worker.serviceCompanyId === membership.serviceCompanyId) {
      const anotherMembership = await prisma.mechanicServiceCompany.findFirst({
        where: {
          workerId: worker.id,
          status: 'ACTIVE',
          serviceCompanyId: { not: membership.serviceCompanyId },
        },
      });

      if (anotherMembership) {
        // Има друг ACTIVE сервиз - смени към него
        await prisma.worker.update({
          where: { id: worker.id },
          data: {
            serviceCompanyId: anotherMembership.serviceCompanyId,
          },
        });
      } else {
        // Няма други ACTIVE сервизи - задай null и isActive = false
        await prisma.worker.update({
          where: { id: worker.id },
          data: {
            serviceCompanyId: null,
            isActive: false,
          },
        });
      }
    }

    // Маркирай членството като INACTIVE
    await prisma.mechanicServiceCompany.update({
      where: { id: membershipId },
      data: {
        status: 'INACTIVE',
        leftAt: new Date(),
      },
    });

    res.status(200).json({
      message: 'Напуснахте сервиза успешно',
    });
  } catch (error) {
    console.error('Leave service company error:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};
