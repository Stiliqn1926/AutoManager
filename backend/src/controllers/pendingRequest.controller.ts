import { Request, Response } from 'express';
import prisma from '../config/database';

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
    });

    // ✅ Махнах ненужната трансформация - директно връщаме данните
    res.status(200).json({ requests: pendingRequests });
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

    await prisma.worker.create({
      data: {
        firstName: pendingRequest.firstName,
        lastName: pendingRequest.lastName,
        email: pendingRequest.email,
        phone: pendingRequest.phone,
        specialization: pendingRequest.specialization,
        userId: user.id,
        serviceCompanyId: serviceCompany.id,
      },
    });

    await prisma.pendingRequest.update({
      where: { id },
      data: { status: 'APPROVED' },
    });

    res.status(200).json({
      message: 'Pending request approved successfully',
    });
  } catch (error) {
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

    await prisma.pendingRequest.update({
      where: { id },
      data: { status: 'REJECTED', rejectionReason },
    });

    const user = await prisma.user.findUnique({
      where: { email: pendingRequest.email },
    });

    if (user) {
      await prisma.user.delete({
        where: { id: user.id },
      });
    }

    res.status(200).json({
      message: 'Pending request rejected successfully',
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};