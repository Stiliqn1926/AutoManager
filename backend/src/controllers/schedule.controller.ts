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

// =======================================================
// HELPER: CHECK SCHEDULE CONFLICTS
// =======================================================
const checkScheduleConflicts = async (
  workerId: string,
  startTime: Date,
  endTime: Date,
  excludeScheduleId?: string
): Promise<boolean> => {
  const conflicts = await prisma.schedule.findMany({
    where: {
      workerId,
      status: { in: ['SCHEDULED', 'IN_PROGRESS'] },
      OR: [
        {
          AND: [
            { startTime: { lte: startTime } },
            { endTime: { gt: startTime } },
          ],
        },
        {
          AND: [
            { startTime: { lt: endTime } },
            { endTime: { gte: endTime } },
          ],
        },
        {
          AND: [
            { startTime: { gte: startTime } },
            { endTime: { lte: endTime } },
          ],
        },
      ],
      ...(excludeScheduleId && { id: { not: excludeScheduleId } }),
    },
  });

  return conflicts.length > 0;
};

// =======================================================
// CREATE SCHEDULE (ADMIN)
// =======================================================
export const createSchedule = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const {
      title,
      description,
      date,
      startTime,
      endTime,
      workerId,
      orderId,
      status,
      priority,
      estimatedDuration,
      notes
    } = req.body;
    const userId = req.user!.userId;

    if (!startTime || !endTime) {
      res.status(400).json({ message: 'startTime and endTime are required' });
      return;
    }

    
    const start = new Date(startTime);
    const end = new Date(endTime);
    const scheduleDate = date ? new Date(date) : new Date(start);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      res.status(400).json({ message: 'Invalid date format' });
      return;
    }


    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const taskDate = new Date(scheduleDate);
    taskDate.setHours(0, 0, 0, 0);

    if (taskDate < today) {
      res.status(400).json({ message: 'Cannot create tasks for past dates' });
      return;
    }

    if (end.getTime() <= start.getTime()) {
  res.status(400).json({
    message: 'ÐšÑ€Ð°Ð¹Ð½Ð¸ÑÑ‚ Ñ‡Ð°Ñ Ñ‚Ñ€ÑÐ±Ð²Ð° Ð´Ð° Ðµ ÑÐ»ÐµÐ´ Ð½Ð°Ñ‡Ð°Ð»Ð½Ð¸Ñ Ñ‡Ð°Ñ',
  });
  return;
}


    const serviceCompany = await prisma.serviceCompany.findUnique({
      where: { userId },
    });

    if (!serviceCompany) {
      res.status(404).json({ message: 'Service company not found' });
      return;
    }

    if (workerId) {
      const worker = await prisma.worker.findFirst({
        where: {
          id: workerId,
          serviceCompanyId: serviceCompany.id,
          isActive: true,
        },
      });

      if (!worker) {
        res.status(400).json({ message: 'Worker is inactive or not in this service company' });
        return;
      }

      const hasConflict = await checkScheduleConflicts(workerId, start, end);
      if (hasConflict) {
        res.status(409).json({
          message: 'ÐšÐ¾Ð½Ñ„Ð»Ð¸ÐºÑ‚ Ð² Ð³Ñ€Ð°Ñ„Ð¸ÐºÐ°: Ð¼ÐµÑ…Ð°Ð½Ð¸ÐºÑŠÑ‚ Ð²ÐµÑ‡Ðµ Ð¸Ð¼Ð° Ð·Ð°Ð´Ð°Ñ‡Ð° Ð·Ð° Ñ‚Ð¾Ð·Ð¸ Ñ‡Ð°Ñ.',
        });
        return;
      }
    }

    const schedule = await prisma.schedule.create({
      data: {
        title,
        description: description || '',
        date: scheduleDate,
        startTime: start,
        endTime: end,
        status: status || 'SCHEDULED',
        priority: priority || 'NORMAL',
        estimatedDuration: estimatedDuration ? Number(estimatedDuration) : undefined,
        notes: notes || undefined,
        workerId: workerId || undefined,
        orderId: orderId || undefined,
        serviceCompanyId: serviceCompany.id,
      },
      include: {
        worker: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        order: {
          select: {
            id: true,
            orderNumber: true,
            displayOrderNumber: true,
          },
        },
      },
    });


    if (orderId) {
      await prisma.order.update({
        where: { id: orderId },
        data: { endDate: scheduleDate },
      });
    }

    res.status(201).json({ schedule });
  } catch (error) {
    console.error('Create schedule error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// =======================================================
// GET ALL SCHEDULES (ADMIN / MECHANIC)
// =======================================================
export const getAllSchedules = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { userId, role } = req.user!;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const { skip, take } = getPagination(page, limit);

    const where: any = {};

    if (role === 'ADMIN') {
      const company = await prisma.serviceCompany.findUnique({
        where: { userId },
      });
      if (!company) {
        res.status(404).json({ message: 'Service company not found' });
        return;
      }
      where.serviceCompanyId = company.id;
    }

    if (role === 'MECHANIC') {
      const worker = await prisma.worker.findUnique({
        where: { userId },
      });
      if (!worker) {
        res.status(404).json({ message: 'Worker profile not found' });
        return;
      }
      if (!worker.serviceCompanyId) {

        res.status(200).json({ schedules: [] });
        return;
      }
      where.workerId = worker.id;
      where.serviceCompanyId = worker.serviceCompanyId;
    }

    const totalItems = await prisma.schedule.count({ where });

    const schedules = await prisma.schedule.findMany({
      where,
      skip,
      take,
      include: {
        worker: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        order: {
          select: {
            id: true,
            orderNumber: true,
            displayOrderNumber: true,
          },
        },
      },
      orderBy: { startTime: 'asc' },
    });

    res.status(200).json({
      schedules,
      pagination: getPaginationMeta(totalItems, page, limit),
    });
  } catch (error) {
    console.error('Get schedules error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// =======================================================
// WEEKLY SCHEDULE
// =======================================================
export const getWeeklySchedule = async (
  req: AuthRequest,
  res: Response
      ): Promise<void> => {
     try {
      const { weekStart } = req.query;
      const { userId, role } = req.user!;

       if (!weekStart || isNaN(Date.parse(weekStart as string))) {
        res.status(400).json({ message: 'Invalid weekStart' });
        return;
    }

  const start = new Date(weekStart as string);
   start.setHours(0, 0, 0, 0);

  const end = new Date(start);
   end.setDate(end.getDate() + 7);

    const where: any = {
      date: { gte: start, lt: end },
    };


    if (role === 'ADMIN') {
      const company = await prisma.serviceCompany.findUnique({
        where: { userId },
      });
      if (!company) {
        res.status(404).json({ message: 'Service company not found' });
        return;
      }
      where.serviceCompanyId = company.id;
    } else if (role === 'MECHANIC') {
      const worker = await prisma.worker.findUnique({
        where: { userId },
      });
      if (!worker) {
        res.status(404).json({ message: 'Worker profile not found' });
        return;
      }
      if (!worker.serviceCompanyId) {

        res.status(200).json({ schedules: [] });
        return;
      }
      where.workerId = worker.id;
      where.serviceCompanyId = worker.serviceCompanyId;
    }

    const schedules = await prisma.schedule.findMany({
      where,
      include: {
        worker: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        order: {
          select: {
            id: true,
            orderNumber: true,
            displayOrderNumber: true,
            vehicle: {
              select: {
                brand: true,
                model: true,
                licensePlate: true,
              },
            },
            client: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: { startTime: 'asc' },
    });

    res.status(200).json({ schedules });
  } catch (error) {
    console.error('Weekly schedule error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// =======================================================
// DAILY SCHEDULE
// =======================================================
export const getDailySchedule = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { date } = req.query;
    const { userId, role } = req.user!;

    if (!date || isNaN(Date.parse(date as string))) {
      res.status(400).json({ message: 'Invalid date' });
      return;
    }

    const start = new Date(date as string);
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    const where: any = {
      date: { gte: start, lt: end },
    };


    if (role === 'ADMIN') {
      const company = await prisma.serviceCompany.findUnique({
        where: { userId },
      });
      if (!company) {
        res.status(404).json({ message: 'Service company not found' });
        return;
      }
      where.serviceCompanyId = company.id;
    } else if (role === 'MECHANIC') {
      const worker = await prisma.worker.findUnique({
        where: { userId },
      });
      if (!worker) {
        res.status(404).json({ message: 'Worker profile not found' });
        return;
      }
      if (!worker.serviceCompanyId) {

        res.status(200).json({ schedules: [] });
        return;
      }
      where.workerId = worker.id;
      where.serviceCompanyId = worker.serviceCompanyId;
    }

    const schedules = await prisma.schedule.findMany({
      where,
      include: {
        worker: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        order: {
          select: {
            id: true,
            orderNumber: true,
            displayOrderNumber: true,
            vehicle: {
              select: {
                brand: true,
                model: true,
                licensePlate: true,
              },
            },
            client: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: { startTime: 'asc' },
    });

    res.status(200).json({ schedules });
  } catch (error) {
    console.error('Daily schedule error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// =======================================================
// MONTHLY SCHEDULE
// =======================================================
export const getMonthlySchedule = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { year, month } = req.query;
    const { userId, role } = req.user!;

    const y = Number(year);
    const m = Number(month) - 1;

    if (isNaN(y) || isNaN(m)) {
      res.status(400).json({ message: 'Invalid year or month' });
      return;
    }

    const start = new Date(y, m, 1);
    const end = new Date(y, m + 1, 1);

    const where: any = {
      date: { gte: start, lt: end },
    };


    if (role === 'ADMIN') {
      const company = await prisma.serviceCompany.findUnique({
        where: { userId },
      });
      if (!company) {
        res.status(404).json({ message: 'Service company not found' });
        return;
      }
      where.serviceCompanyId = company.id;
    } else if (role === 'MECHANIC') {
      const worker = await prisma.worker.findUnique({
        where: { userId },
      });
      if (!worker) {
        res.status(404).json({ message: 'Worker profile not found' });
        return;
      }
      if (!worker.serviceCompanyId) {

        res.status(200).json({ schedules: [] });
        return;
      }
      where.workerId = worker.id;
      where.serviceCompanyId = worker.serviceCompanyId;
    }

    const schedules = await prisma.schedule.findMany({
      where,
      include: {
        worker: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        order: {
          select: {
            id: true,
            orderNumber: true,
            displayOrderNumber: true,
            vehicle: {
              select: {
                brand: true,
                model: true,
                licensePlate: true,
              },
            },
            client: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: { startTime: 'asc' },
    });

    res.status(200).json({ schedules });
  } catch (error) {
    console.error('Monthly schedule error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// =======================================================
// GET SCHEDULE BY ID
// =======================================================
export const getScheduleById = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;
    const role = req.user!.role;

    const schedule = await prisma.schedule.findUnique({
      where: { id },
      include: {
        worker: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        order: {
          select: {
            id: true,
            orderNumber: true,
            displayOrderNumber: true,
            client: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
            vehicle: {
              select: {
                brand: true,
                model: true,
                licensePlate: true,
              },
            },
          },
        },
      },
    });

    if (!schedule) {
      res.status(404).json({ message: 'Schedule not found' });
      return;
    }
    if (role === 'ADMIN') {
      const serviceCompany = await prisma.serviceCompany.findUnique({
        where: { userId },
      });
      if (!serviceCompany) {
        res.status(404).json({ message: 'Service company not found' });
        return;
      }
      if (schedule.serviceCompanyId !== serviceCompany.id) {
        res.status(403).json({ message: 'Forbidden' });
        return;
      }
    } else if (role === 'MECHANIC') {
      const worker = await prisma.worker.findUnique({
        where: { userId },
      });
      if (!worker || schedule.workerId !== worker.id) {
        res.status(403).json({ message: 'Forbidden' });
        return;
      }
    }

    res.status(200).json({ schedule });
  } catch (error) {
    console.error('Get schedule error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// =======================================================
// UPDATE SCHEDULE
// =======================================================
export const updateSchedule = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;
    const role = req.user!.role;
    const existingSchedule = await prisma.schedule.findUnique({
      where: { id },
      select: {
        startTime: true,
        endTime: true,
        date: true,
        workerId: true,
        orderId: true,
        serviceCompanyId: true,
      },
    });

    if (!existingSchedule) {
      res.status(404).json({ message: 'Schedule not found' });
      return;
    }
    if (role === 'ADMIN') {
      const serviceCompany = await prisma.serviceCompany.findUnique({
        where: { userId },
      });
      if (!serviceCompany) {
        res.status(404).json({ message: 'Service company not found' });
        return;
      }
      if (existingSchedule.serviceCompanyId !== serviceCompany.id) {
        res.status(403).json({ message: 'Forbidden' });
        return;
      }
    } else if (role === 'MECHANIC') {
      const worker = await prisma.worker.findUnique({
        where: { userId },
      });
      if (!worker || existingSchedule.workerId !== worker.id) {
        res.status(403).json({ message: 'Forbidden' });
        return;
      }
    }
    const {
      title,
      description,
      date,
      startTime,
      endTime,
      workerId,
      orderId,
      status,
      priority,
      estimatedDuration,
      notes
    } = req.body;

    const newStart = startTime ? new Date(startTime) : null;
    const newEnd = endTime ? new Date(endTime) : null;
    const scheduleDate = date ? new Date(date) : null;


    if ((newStart && isNaN(newStart.getTime())) || (newEnd && isNaN(newEnd.getTime()))) {
      res.status(400).json({ message: 'Invalid date format' });
      return;
    }


    const finalScheduleDate = scheduleDate ?? existingSchedule.date;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const taskDate = new Date(finalScheduleDate);
    taskDate.setHours(0, 0, 0, 0);

    if (taskDate < today) {
      res.status(400).json({ message: 'Cannot update tasks for past dates' });
      return;
    }


    const finalStart = newStart ?? existingSchedule.startTime;
    const finalEnd = newEnd ?? existingSchedule.endTime;


   if (finalEnd <= finalStart) {
      res.status(400).json({
        message: 'ÐšÑ€Ð°Ð¹Ð½Ð¸ÑÑ‚ Ñ‡Ð°Ñ Ñ‚Ñ€ÑÐ±Ð²Ð° Ð´Ð° Ðµ ÑÐ»ÐµÐ´ Ð½Ð°Ñ‡Ð°Ð»Ð½Ð¸Ñ Ñ‡Ð°Ñ',
      });
      return;
    }

    const finalWorkerId = workerId ?? existingSchedule.workerId;
    if (finalWorkerId) {
      const worker = await prisma.worker.findFirst({
        where: {
          id: finalWorkerId,
          isActive: true,
        },
      });

      if (!worker) {
        res.status(400).json({ message: 'Worker is inactive' });
        return;
      }

      const hasConflict = await checkScheduleConflicts(
        finalWorkerId,
        finalStart,
        finalEnd,
        id
      );
      if (hasConflict) {
        res.status(409).json({ message: 'ÐšÐ¾Ð½Ñ„Ð»Ð¸ÐºÑ‚ Ð² Ð³Ñ€Ð°Ñ„Ð¸ÐºÐ°: Ð¼ÐµÑ…Ð°Ð½Ð¸ÐºÑŠÑ‚ Ð¸Ð¼Ð° Ð´Ñ€ÑƒÐ³Ð° Ð·Ð°Ð´Ð°Ñ‡Ð° Ð·Ð° Ñ‚Ð¾Ð·Ð¸ Ð¿ÐµÑ€Ð¸Ð¾Ð´.' });
        return;
      }
    }

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (scheduleDate) {
      updateData.date = scheduleDate;
    } else if (newStart) {
      updateData.date = newStart;
    }   
    if (newStart) updateData.startTime = newStart;
    if (newEnd) updateData.endTime = newEnd;
    if (workerId !== undefined) updateData.workerId = workerId || null;
    if (orderId !== undefined) updateData.orderId = orderId || null;
    if (status !== undefined) updateData.status = status;
    if (priority !== undefined) updateData.priority = priority;
    if (estimatedDuration !== undefined) updateData.estimatedDuration = estimatedDuration ? Number(estimatedDuration) : null;
    if (notes !== undefined) updateData.notes = notes;

    const schedule = await prisma.schedule.update({
      where: { id },
      data: updateData,
      include: {
        worker: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        order: {
          select: {
            id: true,
            orderNumber: true,
            displayOrderNumber: true,
          },
        },
      },
    });


    const finalOrderId = orderId !== undefined ? (orderId || null) : existingSchedule.orderId;

    if (finalOrderId) {
      const orderUpdateData: any = {};


      if (scheduleDate) {
        orderUpdateData.endDate = scheduleDate;
      } else if (newStart) {
        orderUpdateData.endDate = newStart;
      }


      if (status !== undefined) {
        const statusMap: any = {
          'SCHEDULED': 'WAITING',
          'IN_PROGRESS': 'IN_PROGRESS',
          'COMPLETED': 'READY',
          'CANCELLED': 'CANCELLED',
          'DELAYED': 'IN_PROGRESS',
        };
        if (statusMap[status]) {
          orderUpdateData.status = statusMap[status];
        }
      }

      if (Object.keys(orderUpdateData).length > 0) {
        await prisma.order.update({
          where: { id: finalOrderId },
          data: orderUpdateData,
        });
      }
    }

    res.status(200).json({ schedule });
  } catch (error) {
    console.error('Update schedule error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// =======================================================
// DELETE SCHEDULE
// =======================================================
export const deleteSchedule = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;
    const role = req.user!.role;

    if (role === 'ADMIN') {
      const serviceCompany = await prisma.serviceCompany.findUnique({
        where: { userId },
      });
      if (!serviceCompany) {
        res.status(404).json({ message: 'Service company not found' });
        return;
      }
      const schedule = await prisma.schedule.findUnique({
        where: { id },
        select: { serviceCompanyId: true },
      });
      if (!schedule || schedule.serviceCompanyId !== serviceCompany.id) {
        res.status(404).json({ message: 'Schedule not found' });
        return;
      }
    } else if (role === 'MECHANIC') {
      const worker = await prisma.worker.findUnique({
        where: { userId },
      });
      if (!worker) {
        res.status(404).json({ message: 'Worker profile not found' });
        return;
      }
      const schedule = await prisma.schedule.findUnique({
        where: { id },
        select: { workerId: true },
      });
      if (!schedule || schedule.workerId !== worker.id) {
        res.status(403).json({ message: 'Forbidden' });
        return;
      }
    }

    await prisma.schedule.delete({ where: { id } });

    res.status(200).json({ message: 'Schedule deleted successfully' });
  } catch (error) {
    console.error('Delete schedule error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// =======================================================
// COMPLETE SCHEDULE
// =======================================================
export const completeSchedule = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;
    const role = req.user!.role;

    if (role === 'ADMIN') {
      const serviceCompany = await prisma.serviceCompany.findUnique({
        where: { userId },
      });
      if (!serviceCompany) {
        res.status(404).json({ message: 'Service company not found' });
        return;
      }
      const schedule = await prisma.schedule.findUnique({
        where: { id },
        select: { serviceCompanyId: true },
      });
      if (!schedule || schedule.serviceCompanyId !== serviceCompany.id) {
        res.status(404).json({ message: 'Schedule not found' });
        return;
      }
    } else if (role === 'MECHANIC') {
      const worker = await prisma.worker.findUnique({
        where: { userId },
      });
      if (!worker) {
        res.status(404).json({ message: 'Worker profile not found' });
        return;
      }
      const schedule = await prisma.schedule.findUnique({
        where: { id },
        select: { workerId: true },
      });
      if (!schedule || schedule.workerId !== worker.id) {
        res.status(403).json({ message: 'Forbidden' });
        return;
      }
    }

    const schedule = await prisma.schedule.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        isCompleted: true,
      },
    });

    res.status(200).json({ schedule });
  } catch (error) {
    console.error('Complete schedule error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// =======================================================
// CHECK CONFLICTS
// =======================================================
export const checkConflicts = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { workerId, startTime, endTime, scheduleId } = req.body;
    const userId = req.user!.userId;
    const role = req.user!.role;

    if (!workerId || !startTime || !endTime) {
      res.status(400).json({ message: 'Missing required fields' });
      return;
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      res.status(400).json({ message: 'Invalid date format' });
      return;
    }

    if (role === 'ADMIN') {
      const serviceCompany = await prisma.serviceCompany.findUnique({
        where: { userId },
      });
      if (!serviceCompany) {
        res.status(404).json({ message: 'Service company not found' });
        return;
      }
      const worker = await prisma.worker.findFirst({
        where: { id: workerId, serviceCompanyId: serviceCompany.id },
        select: { id: true },
      });
      if (!worker) {
        res.status(403).json({ message: 'Forbidden' });
        return;
      }
    } else if (role === 'MECHANIC') {
      const worker = await prisma.worker.findUnique({
        where: { userId },
        select: { id: true },
      });
      if (!worker || worker.id !== workerId) {
        res.status(403).json({ message: 'Forbidden' });
        return;
      }
    }

    const hasConflict = await checkScheduleConflicts(
      workerId,
      start,
      end,
      scheduleId
    );

    res.status(200).json({ hasConflict });
  } catch (error) {
    console.error('Check conflicts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

