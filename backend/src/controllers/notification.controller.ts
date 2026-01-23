import { Request, Response } from 'express';
import prisma from '../config/database';
import { getPagination, getPaginationMeta } from '../utils/pagination';

interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
    serviceCompanyId?: string;
  };
}

// Get All Notifications (CLIENT или MECHANIC)
export const getAllNotifications = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const userRole = req.user!.role;

    // Pagination
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const { skip, take } = getPagination(page, limit);

    if (userRole === 'CLIENT') {
      // CLIENT вижда своите нотификации
      const clients = await prisma.client.findMany({
        where: { userId },
      });

      if (clients.length === 0) {
        res.status(404).json({ message: 'Client profile not found' });
        return;
      }

      const clientIds = clients.map(c => c.id);

      const totalItems = await prisma.notification.count({
        where: { clientId: { in: clientIds } },
      });

      const notifications = await prisma.notification.findMany({
        where: { clientId: { in: clientIds } },
        skip,
        take,
        include: {
          order: {
            select: {
              orderNumber: true,
              displayOrderNumber: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      const pagination = getPaginationMeta(totalItems, page, limit);

      res.status(200).json({ notifications, pagination });
    } else if (userRole === 'MECHANIC') {
      // MECHANIC вижда нотификациите на клиентите в сервиза
      const worker = await prisma.worker.findUnique({
        where: { userId },
      });

      if (!worker) {
        res.status(404).json({ message: 'Worker profile not found' });
        return;
      }

      if (!worker.serviceCompanyId) {
        res.status(403).json({ message: 'No active service company' });
        return;
      }

      const totalItems = await prisma.notification.count({
        where: {
          client: {
            serviceCompanyId: worker.serviceCompanyId,
          },
        },
      });

      const notifications = await prisma.notification.findMany({
        where: {
          client: {
            serviceCompanyId: worker.serviceCompanyId,
          },
        },
        include: {
          client: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
        skip,
        take,
        orderBy: {
          createdAt: 'desc',
        },
      });

      const pagination = getPaginationMeta(totalItems, page, limit);

      res.status(200).json({
        notifications: notifications.map(n => ({
          id: n.id,
          title: n.title,
          message: n.message,
          isRead: n.isRead,
          createdAt: n.createdAt,
          client: n.client ? `${n.client.firstName} ${n.client.lastName}` : 'System',
        })),
        pagination,
      });
    } else {
      res.status(403).json({ message: 'Forbidden' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Get Unread Notifications Count
export const getUnreadCount = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const userRole = req.user!.role;

    if (userRole === 'CLIENT') {
      const clients = await prisma.client.findMany({
        where: { userId },
      });

      if (clients.length === 0) {
        res.status(404).json({ message: 'Client profile not found' });
        return;
      }

      const count = await prisma.notification.count({
        where: {
          clientId: { in: clients.map(c => c.id) },
          isRead: false,
        },
      });

      res.status(200).json({ unreadCount: count });
    } else if (userRole === 'MECHANIC') {
      const worker = await prisma.worker.findUnique({
        where: { userId },
      });

      if (!worker) {
        res.status(404).json({ message: 'Worker profile not found' });
        return;
      }

      if (!worker.serviceCompanyId) {
        res.status(403).json({ message: 'No active service company' });
        return;
      }

      const count = await prisma.notification.count({
        where: {
          client: {
            serviceCompanyId: worker.serviceCompanyId,
          },
          isRead: false,
        },
      });

      res.status(200).json({ unreadCount: count });
    } else {
      res.status(403).json({ message: 'Forbidden' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Mark Notification as Read
export const markAsRead = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;
    const userRole = req.user!.role;

    // Провери дали нотификацията съществува
    const notification = await prisma.notification.findUnique({
      where: { id },
      include: {
        client: true,
      },
    });

    if (!notification) {
      res.status(404).json({ message: 'Notification not found' });
      return;
    }

    // Провери права
    if (userRole === 'CLIENT') {
      const clients = await prisma.client.findMany({
        where: { userId },
      });

      const clientIds = clients.map(c => c.id);

      if (notification.clientId && !clientIds.includes(notification.clientId)) {
        res.status(403).json({ message: 'Not your notification' });
        return;
      }
    } else if (userRole === 'MECHANIC') {
      const worker = await prisma.worker.findUnique({
        where: { userId },
      });

      if (!worker || (notification.client && notification.client.serviceCompanyId !== worker.serviceCompanyId)) {
        res.status(403).json({ message: 'Not your notification' });
        return;
      }
    } else {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }

    // Mark as read
    const updated = await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });

    res.status(200).json({
      message: 'Notification marked as read',
      notification: updated,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Mark All Notifications as Read (CLIENT only)
export const markAllAsRead = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const userRole = req.user!.role;

    if (userRole !== 'CLIENT') {
      res.status(403).json({ message: 'Only clients can mark all as read' });
      return;
    }

    const clients = await prisma.client.findMany({
      where: { userId },
    });

    if (clients.length === 0) {
      res.status(404).json({ message: 'Client profile not found' });
      return;
    }

    const result = await prisma.notification.updateMany({
      where: {
        clientId: { in: clients.map(c => c.id) },
        isRead: false,
      },
      data: { isRead: true },
    });

    res.status(200).json({
      message: 'All notifications marked as read',
      count: result.count,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Delete Notification
export const deleteNotification = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;
    const userRole = req.user!.role;

    // Провери дали нотификацията съществува
    const notification = await prisma.notification.findUnique({
      where: { id },
      include: {
        client: true,
      },
    });

    if (!notification) {
      res.status(404).json({ message: 'Notification not found' });
      return;
    }

    // Само CLIENT може да трие
    if (userRole !== 'CLIENT') {
      res.status(403).json({ message: 'Only clients can delete notifications' });
      return;
    }

    const clients = await prisma.client.findMany({
      where: { userId },
    });

    const clientIds = clients.map(c => c.id);

    if (notification.clientId && !clientIds.includes(notification.clientId)) {
      res.status(403).json({ message: 'Not your notification' });
      return;
    }

    await prisma.notification.delete({
      where: { id },
    });

    res.status(200).json({
      message: 'Notification deleted successfully',
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Create Notification (helper за ADMIN - ръчно известие)
export const createNotification = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { clientId, title, message, type } = req.body;

    const notification = await prisma.notification.create({
      data: {
        title,
        message,
        clientId,
      },
    });

    res.status(201).json({
      message: 'Notification created successfully',
      notification,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};