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

class PendingRequestError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}

// Get All Pending Requests (admin only)
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

    const mechanicRequests = pendingRequests.filter(
      (request) => request.requestType === 'MECHANIC'
    );
    const clientRequests = pendingRequests.filter(
      (request) => request.requestType === 'CLIENT'
    );

    res.status(200).json({
      mechanicRequests,
      clientRequests,
      // Backward compatibility
      requests: pendingRequests,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Approve Pending Request (admin only)
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

    const result = await prisma.$transaction(async (tx) => {
      const pendingRequest = await tx.pendingRequest.findFirst({
        where: {
          id,
          serviceCompanyId: serviceCompany.id,
        },
      });

      if (!pendingRequest) {
        throw new PendingRequestError(404, 'Pending request not found');
      }

      // Atomic claim to prevent double approve/reject races.
      const claim = await tx.pendingRequest.updateMany({
        where: {
          id,
          serviceCompanyId: serviceCompany.id,
          status: 'PENDING',
        },
        data: {
          status: 'APPROVED',
        },
      });

      if (claim.count === 0) {
        throw new PendingRequestError(409, 'Request already processed');
      }

      const user = await tx.user.findUnique({
        where: { email: pendingRequest.email },
      });

      if (!user) {
        throw new PendingRequestError(404, 'User not found');
      }

      if (pendingRequest.requestType === 'MECHANIC') {
        const worker = await tx.worker.findUnique({
          where: { userId: user.id },
        });

        if (!worker) {
          throw new PendingRequestError(404, 'Worker not found');
        }

        await tx.worker.update({
          where: { id: worker.id },
          data: {
            isActive: true,
            serviceCompanyId: serviceCompany.id,
          },
        });

        await tx.mechanicServiceCompany.updateMany({
          where: {
            workerId: worker.id,
            serviceCompanyId: serviceCompany.id,
            status: 'PENDING',
          },
          data: {
            status: 'ACTIVE',
          },
        });
      } else {
        await tx.client.upsert({
          where: {
            userId_serviceCompanyId: {
              userId: user.id,
              serviceCompanyId: serviceCompany.id,
            },
          },
          update: {
            firstName: pendingRequest.firstName,
            lastName: pendingRequest.lastName,
            phone: pendingRequest.phone || '',
            isActive: true,
            deletedAt: null,
          },
          create: {
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

      await tx.pendingRequest.delete({
        where: { id },
      });

      return {
        requestType: pendingRequest.requestType,
        firstName: pendingRequest.firstName,
        userEmail: user.email,
      };
    });

    if (result.requestType === 'MECHANIC') {
      void sendEmail(
        result.userEmail,
        '\u041e\u0434\u043e\u0431\u0440\u0435\u043d\u0430 \u0437\u0430\u044f\u0432\u043a\u0430 \u0437\u0430 \u0440\u0435\u0433\u0438\u0441\u0442\u0440\u0430\u0446\u0438\u044f',
        emailTemplates.mechanicApproved(result.firstName, serviceCompany.name)
      ).catch((emailError) => {
        console.error('Failed to send approval email:', emailError);
      });
    } else {
      void sendEmail(
        result.userEmail,
        '\u041e\u0434\u043e\u0431\u0440\u0435\u043d\u0430 \u0437\u0430\u044f\u0432\u043a\u0430 \u0437\u0430 \u043a\u043b\u0438\u0435\u043d\u0442\u0441\u043a\u0438 \u0434\u043e\u0441\u0442\u044a\u043f',
        emailTemplates.clientApproved(result.firstName, serviceCompany.name)
      ).catch((emailError) => {
        console.error('Failed to send approval email:', emailError);
      });
    }

    res.status(200).json({
      message: 'Pending request approved successfully',
    });
  } catch (error) {
    if (error instanceof PendingRequestError) {
      res.status(error.statusCode).json({ message: error.message });
      return;
    }

    console.error('[approvePendingRequest] error:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

// Reject Pending Request (admin only)
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

    const result = await prisma.$transaction(async (tx) => {
      const pendingRequest = await tx.pendingRequest.findFirst({
        where: {
          id,
          serviceCompanyId: serviceCompany.id,
        },
      });

      if (!pendingRequest) {
        throw new PendingRequestError(404, 'Pending request not found');
      }

      // Atomic claim to prevent double approve/reject races.
      const claim = await tx.pendingRequest.updateMany({
        where: {
          id,
          serviceCompanyId: serviceCompany.id,
          status: 'PENDING',
        },
        data: {
          status: 'REJECTED',
          rejectionReason: rejectionReason || null,
        },
      });

      if (claim.count === 0) {
        throw new PendingRequestError(409, 'Request already processed');
      }

      const user = await tx.user.findUnique({
        where: { email: pendingRequest.email },
      });

      if (user && pendingRequest.requestType === 'MECHANIC') {
        const worker = await tx.worker.findUnique({
          where: { userId: user.id },
        });

        if (worker) {
          await tx.mechanicServiceCompany.updateMany({
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

          const activeOrPendingMemberships = await tx.mechanicServiceCompany.count({
            where: {
              workerId: worker.id,
              status: { in: ['ACTIVE', 'PENDING'] },
            },
          });

          if (activeOrPendingMemberships === 0) {
            await tx.worker.update({
              where: { id: worker.id },
              data: {
                serviceCompanyId: null,
                isActive: false,
              },
            });
          }
        }
      }

      await tx.pendingRequest.delete({
        where: { id },
      });

      return {
        firstName: pendingRequest.firstName,
        email: pendingRequest.email,
      };
    });

    void sendEmail(
      result.email,
      '\u041e\u0442\u0445\u0432\u044a\u0440\u043b\u0435\u043d\u0430 \u0437\u0430\u044f\u0432\u043a\u0430 \u0437\u0430 \u0440\u0435\u0433\u0438\u0441\u0442\u0440\u0430\u0446\u0438\u044f',
      emailTemplates.mechanicRejected(result.firstName, serviceCompany.name)
    ).catch((emailError) => {
      console.error('Failed to send rejection email:', emailError);
    });

    res.status(200).json({
      message: 'Pending request rejected successfully',
    });
  } catch (error) {
    if (error instanceof PendingRequestError) {
      res.status(error.statusCode).json({ message: error.message });
      return;
    }

    console.error('[rejectPendingRequest] error:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};
