import { Request, Response } from 'express';
import prisma from '../config/database';
import { sendEmail, emailTemplates } from '../services/email.service';

interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

// Get All Pending Requests (само ADMIN)
export const getAllPendingRequests = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.userId;

    const serviceCompany = await prisma.serviceCompany.findUnique({
      where: { userId },
    });

    if (!serviceCompany) {
      res.status(404).json({ message: 'Service company not found' });
      return;
    }

    const pendingRequests = await prisma.pendingRequest.findMany({
      where: {
        serviceCompanyId: serviceCompany.id,
        status: 'PENDING',
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        requestType: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        specialization: true,
        skills: true,
        status: true,
        createdAt: true,
      },
    });

    // Разделяме по тип
    const mechanicRequests = pendingRequests.filter(r => r.requestType === 'MECHANIC');
    const clientRequests = pendingRequests.filter(r => r.requestType === 'CLIENT');

    res.status(200).json({
      mechanicRequests,
      clientRequests,
      // За backward compatibility
      requests: pendingRequests
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Approve Pending Request (само ADMIN)
export const approvePendingRequest = async (
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

    const pendingRequest = await prisma.pendingRequest.findUnique({
      where: { id },
    });

    if (!pendingRequest) {
      res.status(404).json({ message: 'Pending request not found' });
      return;
    }

    if (pendingRequest.serviceCompanyId !== serviceCompany.id) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }

    if (pendingRequest.status !== 'PENDING') {
      res.status(400).json({ message: 'Request already processed' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { email: pendingRequest.email },
    });

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // 🆕 Разделяме логиката по requestType
    if (pendingRequest.requestType === 'MECHANIC') {
      // === MECHANIC APPROVAL LOGIC ===
      const worker = await prisma.worker.findUnique({
        where: { userId: user.id },
      });

      if (!worker) {
        res.status(404).json({ message: 'Worker not found' });
        return;
      }

      await prisma.worker.update({
        where: { id: worker.id },
        data: {
          isActive: true,
          serviceCompanyId: serviceCompany.id,
        },
      });

      const membership = await prisma.mechanicServiceCompany.findFirst({
        where: {
          workerId: worker.id,
          serviceCompanyId: serviceCompany.id,
          status: 'PENDING',
        },
      });

      if (membership) {
        await prisma.mechanicServiceCompany.update({
          where: { id: membership.id },
          data: { status: 'ACTIVE' },
        });
      }

      try {
        await sendEmail(
          user.email,
          'Одобрена заявка за регистрация',
          emailTemplates.mechanicApproved(
            pendingRequest.firstName,
            serviceCompany.name
          )
        );
      } catch (emailError) {
        console.error('Failed to send approval email:', emailError);
      }
    } else if (pendingRequest.requestType === 'CLIENT') {
      // === CLIENT APPROVAL LOGIC ===

      // Провери дали вече има Client за ТОЗИ user И ТОЗИ serviceCompany
      const existingClient = await prisma.client.findFirst({
        where: {
          userId: user.id,
          serviceCompanyId: serviceCompany.id,
        },
      });

      if (existingClient) {
        // Ако съществува, само го активирай
        await prisma.client.update({
          where: { id: existingClient.id },
          data: {
            isActive: true,
            deletedAt: null,
          },
        });
      } else {
        // Създай НОВ Client запис за този сервиз
        // (потребителят може да има други Client записи в други сервизи)
        await prisma.client.create({
          data: {
            firstName: pendingRequest.firstName,
            lastName: pendingRequest.lastName,
            phone: pendingRequest.phone || '',
            email: user.email,
            userId: user.id,
            serviceCompanyId: serviceCompany.id,
            isActive: true,
          },
        });
      }

      // Изпрати email за одобрение на клиента
      try {
        await sendEmail(
          user.email,
          'Одобрена заявка',
          emailTemplates.mechanicApproved(
            pendingRequest.firstName,
            serviceCompany.name
          )
        );
      } catch (emailError) {
        console.error('Failed to send approval email:', emailError);
      }
    }

    // Изтрий одобрения request (вече не е pending)
    await prisma.pendingRequest.delete({
      where: { id },
    });

    res.status(200).json({
      message: 'Pending request approved successfully',
    });
  } catch (error) {
    console.error('[approvePendingRequest] error:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

// Reject Pending Request (само ADMIN)
export const rejectPendingRequest = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body;
    const userId = req.user!.userId;

    const serviceCompany = await prisma.serviceCompany.findUnique({
      where: { userId },
    });

    if (!serviceCompany) {
      res.status(404).json({ message: 'Service company not found' });
      return;
    }

    const pendingRequest = await prisma.pendingRequest.findUnique({
      where: { id },
    });

    if (!pendingRequest) {
      res.status(404).json({ message: 'Pending request not found' });
      return;
    }

    if (pendingRequest.serviceCompanyId !== serviceCompany.id) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }

    if (pendingRequest.status !== 'PENDING') {
      res.status(400).json({ message: 'Request already processed' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { email: pendingRequest.email },
    });

    if (user) {
      const worker = await prisma.worker.findUnique({
        where: { userId: user.id },
      });

      if (worker) {
        // Маркирай PENDING membership като INACTIVE вместо да го изтриваш
        await prisma.mechanicServiceCompany.updateMany({
          where: {
            workerId: worker.id,
            serviceCompanyId: serviceCompany.id,
            status: 'PENDING',
          },
          data: {
            status: 'INACTIVE',
            leftAt: new Date(),
          },
        });

        // Провери дали има други активни или pending memberships
        const otherMemberships = await prisma.mechanicServiceCompany.findMany({
          where: {
            workerId: worker.id,
            status: { in: ['ACTIVE', 'PENDING'] },
          },
        });

        // Ако няма други memberships, маркирай Worker-a като неактивен
        if (otherMemberships.length === 0) {
          await prisma.worker.update({
            where: { id: worker.id },
            data: {
              serviceCompanyId: null,
              isActive: false,
            },
          });
        }
      }
    }

    // Изпрати email нотификация за отхвърляне
    try {
      await sendEmail(
        pendingRequest.email,
        'Отхвърлена заявка за регистрация',
        emailTemplates.mechanicRejected(
          pendingRequest.firstName,
          serviceCompany.name
        )
      );
    } catch (emailError) {
      console.error('Failed to send rejection email:', emailError);
      // Продължаваме въпреки грешката при email-а
    }

    // Изтрий напълно отхвърлената заявка от базата
    await prisma.pendingRequest.delete({
      where: { id },
    });

    res.status(200).json({
      message: 'Pending request rejected successfully',
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};