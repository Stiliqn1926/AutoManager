import { Request, Response } from 'express';
import prisma from '../config/database';
import { sendEmail } from '../services/email.service';

interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
    serviceCompanyId?: string;
  };
}

class AppointmentRequestError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}

const buildScheduleOverlapWhere = (start: Date, end: Date) => ({
  OR: [
    {
      AND: [{ startTime: { lte: start } }, { endTime: { gt: start } }],
    },
    {
      AND: [{ startTime: { lt: end } }, { endTime: { gte: end } }],
    },
    {
      AND: [{ startTime: { gte: start } }, { endTime: { lte: end } }],
    },
  ],
});

const buildAppointmentOverlapWhere = (start: Date, end: Date) => ({
  OR: [
    {
      AND: [{ requestedStart: { lte: start } }, { requestedEnd: { gt: start } }],
    },
    {
      AND: [{ requestedStart: { lt: end } }, { requestedEnd: { gte: end } }],
    },
    {
      AND: [{ requestedStart: { gte: start } }, { requestedEnd: { lte: end } }],
    },
  ],
});

const formatDateTime = (date: Date): string =>
  date.toLocaleString('bg-BG', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

const buildApprovedEmail = (
  firstName: string,
  serviceCompanyName: string,
  start: Date,
  end: Date,
  workerName?: string,
  comment?: string
): string => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <h2 style="color: #10b981;">Заявката за час е одобрена</h2>
    <p>Здравей, ${firstName}!</p>
    <p>
      Твоята заявка към <strong>${serviceCompanyName}</strong> е одобрена.
    </p>
    <p><strong>Начало:</strong> ${formatDateTime(start)}</p>
    <p><strong>Край:</strong> ${formatDateTime(end)}</p>
    ${workerName ? `<p><strong>Механик:</strong> ${workerName}</p>` : ''}
    ${comment ? `<p><strong>Коментар от сервиза:</strong> ${comment}</p>` : ''}
    <br />
    <p>С уважение,<br />Екипът на AutoManager</p>
  </div>
`;

const buildRejectedEmail = (
  firstName: string,
  serviceCompanyName: string,
  comment?: string
): string => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <h2 style="color: #ef4444;">Заявката за час е отхвърлена</h2>
    <p>Здравей, ${firstName}!</p>
    <p>
      Твоята заявка към <strong>${serviceCompanyName}</strong> беше отхвърлена.
    </p>
    ${comment ? `<p><strong>Коментар от сервиза:</strong> ${comment}</p>` : ''}
    <br />
    <p>С уважение,<br />Екипът на AutoManager</p>
  </div>
`;

const resolveClientEmail = (client: { email: string | null; user: { email: string } | null }): string =>
  client.email || client.user?.email || '';

// =======================================
// CLIENT: CREATE APPOINTMENT REQUEST
// =======================================
export const createAppointmentRequest = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const {
      serviceCompanyId,
      requestedStart,
      requestedEnd,
      preferredWorkerId,
      message,
    } = req.body as {
      serviceCompanyId: string;
      requestedStart: string;
      requestedEnd: string;
      preferredWorkerId?: string | null;
      message?: string | null;
    };

    if (!userId) {
      res.status(401).json({ message: 'User ID not found' });
      return;
    }

    const start = new Date(requestedStart);
    const end = new Date(requestedEnd);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      res.status(400).json({ message: 'Невалиден формат на дата' });
      return;
    }

    if (start <= new Date()) {
      res.status(400).json({ message: 'Можете да заявите само бъдещ час' });
      return;
    }

    if (end <= start) {
      res.status(400).json({ message: 'Крайният час трябва да е след началния' });
      return;
    }

    const serviceCompany = await prisma.serviceCompany.findUnique({
      where: { id: serviceCompanyId },
      select: { id: true, isActive: true },
    });

    if (!serviceCompany || !serviceCompany.isActive) {
      res.status(404).json({ message: 'Сервизът не е намерен или е неактивен' });
      return;
    }

    const client = await prisma.client.findFirst({
      where: {
        userId,
        serviceCompanyId,
        isActive: true,
        deletedAt: null,
      },
      select: {
        id: true,
        firstName: true,
      },
    });

    if (!client) {
      res.status(403).json({ message: 'Нямате активен клиентски достъп до този сервиз' });
      return;
    }

    const selectedWorkerId = preferredWorkerId || null;

    if (selectedWorkerId) {
      const workerMembership = await prisma.mechanicServiceCompany.findFirst({
        where: {
          workerId: selectedWorkerId,
          serviceCompanyId,
          status: 'ACTIVE',
          worker: {
            isActive: true,
            deletedAt: null,
          },
        },
        select: { id: true },
      });

      if (!workerMembership) {
        res.status(400).json({ message: 'Избраният механик не е активен в сервиза' });
        return;
      }
    }

    const overlappingPendingRequest = await prisma.appointmentRequest.findFirst({
      where: {
        clientId: client.id,
        serviceCompanyId,
        status: 'PENDING',
        ...buildAppointmentOverlapWhere(start, end),
      },
      select: { id: true },
    });

    if (overlappingPendingRequest) {
      res.status(409).json({
        message: 'Вече имате чакаща заявка за същия период',
      });
      return;
    }

    const appointmentRequest = await prisma.appointmentRequest.create({
      data: {
        clientId: client.id,
        serviceCompanyId,
        preferredWorkerId: selectedWorkerId,
        requestedStart: start,
        requestedEnd: end,
        message: message?.trim() || null,
      },
      include: {
        serviceCompany: {
          select: {
            id: true,
            name: true,
          },
        },
        preferredWorker: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    await prisma.notification.create({
      data: {
        clientId: client.id,
        title: 'Заявката е изпратена',
        message: 'Заявката за час е създадена и чака одобрение от администратора.',
      },
    });

    res.status(201).json({
      message: 'Заявката за час е изпратена и чака одобрение.',
      appointmentRequest,
    });
  } catch (error) {
    console.error('[createAppointmentRequest] error:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

// =======================================
// CLIENT: LIST OWN APPOINTMENT REQUESTS
// =======================================
export const getClientAppointmentRequests = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const serviceCompanyId = (req.query.serviceCompanyId as string | undefined) || undefined;

    if (!userId) {
      res.status(401).json({ message: 'User ID not found' });
      return;
    }

    const clientProfiles = await prisma.client.findMany({
      where: {
        userId,
        ...(serviceCompanyId ? { serviceCompanyId } : {}),
      },
      select: { id: true },
    });

    if (clientProfiles.length === 0) {
      res.status(200).json({ appointmentRequests: [] });
      return;
    }

    const appointmentRequests = await prisma.appointmentRequest.findMany({
      where: {
        clientId: { in: clientProfiles.map((c) => c.id) },
      },
      include: {
        serviceCompany: {
          select: {
            id: true,
            name: true,
          },
        },
        preferredWorker: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        approvedSchedule: {
          select: {
            id: true,
            date: true,
            startTime: true,
            endTime: true,
            status: true,
            worker: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({ appointmentRequests });
  } catch (error) {
    console.error('[getClientAppointmentRequests] error:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

// =======================================
// CLIENT: CANCEL APPOINTMENT REQUEST
// =======================================
export const cancelAppointmentRequest = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
      res.status(401).json({ message: 'User ID not found' });
      return;
    }

    const clientProfiles = await prisma.client.findMany({
      where: { userId },
      select: { id: true },
    });

    const request = await prisma.appointmentRequest.findUnique({
      where: { id },
      select: {
        id: true,
        clientId: true,
        status: true,
      },
    });

    if (!request) {
      res.status(404).json({ message: 'Заявката не е намерена' });
      return;
    }

    const isOwner = clientProfiles.some((client) => client.id === request.clientId);
    if (!isOwner) {
      res.status(403).json({ message: 'Нямате достъп до тази заявка' });
      return;
    }

    if (request.status !== 'PENDING') {
      res.status(400).json({ message: 'Можете да отмените само чакащи заявки' });
      return;
    }

    await prisma.appointmentRequest.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        decidedAt: new Date(),
      },
    });

    res.status(200).json({ message: 'Заявката е отменена успешно' });
  } catch (error) {
    console.error('[cancelAppointmentRequest] error:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

// =======================================
// ADMIN: LIST PENDING APPOINTMENT REQUESTS
// =======================================
export const getPendingAppointmentRequests = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ message: 'User ID not found' });
      return;
    }

    const serviceCompany = await prisma.serviceCompany.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!serviceCompany) {
      res.status(404).json({ message: 'Service company not found' });
      return;
    }

    const requests = await prisma.appointmentRequest.findMany({
      where: {
        serviceCompanyId: serviceCompany.id,
        status: 'PENDING',
      },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
            user: {
              select: { email: true },
            },
          },
        },
        preferredWorker: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    res.status(200).json({ requests });
  } catch (error) {
    console.error('[getPendingAppointmentRequests] error:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

// =======================================
// ADMIN: APPROVE APPOINTMENT REQUEST
// =======================================
export const approveAppointmentRequest = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;
    const {
      startTime,
      endTime,
      workerId,
      title,
      description,
      priority,
      estimatedDuration,
      notes,
      adminComment,
    } = req.body as {
      startTime: string;
      endTime: string;
      workerId?: string | null;
      title?: string;
      description?: string | null;
      priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
      estimatedDuration?: number | null;
      notes?: string | null;
      adminComment?: string | null;
    };

    if (!userId) {
      res.status(401).json({ message: 'User ID not found' });
      return;
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      res.status(400).json({ message: 'Невалиден формат на дата' });
      return;
    }

    if (start < new Date()) {
      res.status(400).json({ message: 'Не може да одобрите час в минал момент' });
      return;
    }

    if (end <= start) {
      res.status(400).json({ message: 'Крайният час трябва да е след началния' });
      return;
    }

    const serviceCompany = await prisma.serviceCompany.findUnique({
      where: { userId },
      select: { id: true, name: true },
    });

    if (!serviceCompany) {
      res.status(404).json({ message: 'Service company not found' });
      return;
    }

    const result = await prisma.$transaction(async (tx) => {
      const appointmentRequest = await tx.appointmentRequest.findFirst({
        where: {
          id,
          serviceCompanyId: serviceCompany.id,
        },
        include: {
          client: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              user: {
                select: { email: true },
              },
            },
          },
          preferredWorker: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      if (!appointmentRequest) {
        throw new AppointmentRequestError(404, 'Заявката не е намерена');
      }

      const claim = await tx.appointmentRequest.updateMany({
        where: {
          id,
          serviceCompanyId: serviceCompany.id,
          status: 'PENDING',
        },
        data: {
          status: 'APPROVED',
          decidedAt: new Date(),
          adminComment: adminComment?.trim() || null,
        },
      });

      if (claim.count === 0) {
        throw new AppointmentRequestError(409, 'Заявката вече е обработена');
      }

      const selectedWorkerId = workerId || appointmentRequest.preferredWorkerId || null;

      if (selectedWorkerId) {
        const workerMembership = await tx.mechanicServiceCompany.findFirst({
          where: {
            workerId: selectedWorkerId,
            serviceCompanyId: serviceCompany.id,
            status: 'ACTIVE',
            worker: {
              isActive: true,
              deletedAt: null,
            },
          },
          include: {
            worker: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        });

        if (!workerMembership) {
          throw new AppointmentRequestError(400, 'Избраният механик не е активен в сервиза');
        }

        const conflict = await tx.schedule.findFirst({
          where: {
            serviceCompanyId: serviceCompany.id,
            workerId: selectedWorkerId,
            status: { in: ['SCHEDULED', 'IN_PROGRESS'] },
            ...buildScheduleOverlapWhere(start, end),
          },
          select: { id: true },
        });

        if (conflict) {
          throw new AppointmentRequestError(
            409,
            'Конфликт в графика: механикът вече има задача в този период'
          );
        }
      }

      const scheduleTitle = title?.trim()
        ? title.trim()
        : `Онлайн заявка: ${appointmentRequest.client.firstName} ${appointmentRequest.client.lastName}`;

      const scheduleDescription = description?.trim()
        ? description.trim()
        : appointmentRequest.message?.trim()
        ? `Заявка от клиент: ${appointmentRequest.message.trim()}`
        : 'Онлайн заявка за сервизен час';

      const schedule = await tx.schedule.create({
        data: {
          title: scheduleTitle,
          description: scheduleDescription,
          date: new Date(start),
          startTime: start,
          endTime: end,
          workerId: selectedWorkerId || undefined,
          serviceCompanyId: serviceCompany.id,
          status: 'SCHEDULED',
          priority: priority || 'NORMAL',
          estimatedDuration: estimatedDuration ?? undefined,
          notes: notes?.trim() || undefined,
        },
        include: {
          worker: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      await tx.appointmentRequest.update({
        where: { id: appointmentRequest.id },
        data: {
          approvedByUserId: userId,
          approvedScheduleId: schedule.id,
        },
      });

      const workerName = schedule.worker
        ? `${schedule.worker.firstName} ${schedule.worker.lastName}`
        : undefined;

      await tx.notification.create({
        data: {
          clientId: appointmentRequest.client.id,
          title: 'Заявката за час е одобрена',
          message: `Вашата заявка е одобрена за ${formatDateTime(start)}${
            workerName ? ` при механик ${workerName}` : ''
          }.`,
        },
      });

      return {
        client: appointmentRequest.client,
        workerName,
        start,
        end,
      };
    });

    const clientEmail = resolveClientEmail(result.client);
    if (clientEmail) {
      void sendEmail(
        clientEmail,
        'Заявката ви за сервизен час е одобрена',
        buildApprovedEmail(
          result.client.firstName,
          serviceCompany.name,
          result.start,
          result.end,
          result.workerName,
          adminComment?.trim() || undefined
        )
      ).catch((emailError) => {
        console.error('Failed to send appointment approval email:', emailError);
      });
    }

    res.status(200).json({
      message: 'Заявката е одобрена успешно и е добавена в графика',
    });
  } catch (error) {
    if (error instanceof AppointmentRequestError) {
      res.status(error.statusCode).json({ message: error.message });
      return;
    }

    console.error('[approveAppointmentRequest] error:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

// =======================================
// ADMIN: REJECT APPOINTMENT REQUEST
// =======================================
export const rejectAppointmentRequest = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;
    const { adminComment } = req.body as {
      adminComment?: string | null;
    };

    if (!userId) {
      res.status(401).json({ message: 'User ID not found' });
      return;
    }

    const serviceCompany = await prisma.serviceCompany.findUnique({
      where: { userId },
      select: { id: true, name: true },
    });

    if (!serviceCompany) {
      res.status(404).json({ message: 'Service company not found' });
      return;
    }

    const result = await prisma.$transaction(async (tx) => {
      const appointmentRequest = await tx.appointmentRequest.findFirst({
        where: {
          id,
          serviceCompanyId: serviceCompany.id,
        },
        include: {
          client: {
            select: {
              id: true,
              firstName: true,
              email: true,
              user: {
                select: { email: true },
              },
            },
          },
        },
      });

      if (!appointmentRequest) {
        throw new AppointmentRequestError(404, 'Заявката не е намерена');
      }

      const claim = await tx.appointmentRequest.updateMany({
        where: {
          id,
          serviceCompanyId: serviceCompany.id,
          status: 'PENDING',
        },
        data: {
          status: 'REJECTED',
          decidedAt: new Date(),
          adminComment: adminComment?.trim() || null,
          approvedByUserId: userId,
        },
      });

      if (claim.count === 0) {
        throw new AppointmentRequestError(409, 'Заявката вече е обработена');
      }

      await tx.notification.create({
        data: {
          clientId: appointmentRequest.client.id,
          title: 'Заявката за час е отхвърлена',
          message: adminComment?.trim()
            ? `Заявката ви беше отхвърлена. Коментар: ${adminComment.trim()}`
            : 'Заявката ви беше отхвърлена от администратора.',
        },
      });

      return appointmentRequest.client;
    });

    const clientEmail = resolveClientEmail(result);
    if (clientEmail) {
      void sendEmail(
        clientEmail,
        'Заявката ви за сервизен час е отхвърлена',
        buildRejectedEmail(
          result.firstName,
          serviceCompany.name,
          adminComment?.trim() || undefined
        )
      ).catch((emailError) => {
        console.error('Failed to send appointment rejection email:', emailError);
      });
    }

    res.status(200).json({
      message: 'Заявката е отхвърлена успешно',
    });
  } catch (error) {
    if (error instanceof AppointmentRequestError) {
      res.status(error.statusCode).json({ message: error.message });
      return;
    }

    console.error('[rejectAppointmentRequest] error:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};
