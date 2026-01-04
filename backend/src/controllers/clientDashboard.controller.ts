import { Request, Response } from 'express';
import prisma from '../config/database';

interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
    serviceCompanyId?: string;
  };
}

// =======================================
// GET CLIENT VEHICLES + SERVICE HISTORY
// =======================================
export const getClientVehicles = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ message: 'User ID not found' });
      return;
    }

    const clients = await prisma.client.findMany({
      where: { userId },
    });

    if (clients.length === 0) {
      res.status(404).json({ message: 'Client profile not found' });
      return;
    }

    const vehicles = await prisma.vehicle.findMany({
      where: {
        clientId: { in: clients.map(c => c.id) },
        deletedAt: null,
      },
      include: {
        orders: {
          orderBy: { createdAt: 'desc' },
          include: {
            orderItems: true,
            invoices: true,
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

    res.status(200).json({
      vehicles: vehicles.map(v => ({
        id: v.id,
        brand: v.brand,
        model: v.model,
        year: v.year,
        licensePlate: v.licensePlate,
        vin: v.vin,
        color: v.color,
        mileage: v.mileage,
        serviceHistory: v.orders.map(order => ({
          id: order.id,
          orderNumber: order.orderNumber,
          description: order.description,
          status: order.status,
          totalPrice: order.totalPrice,
          endDate: order.endDate,
          completedDate: order.completedDate,
          createdAt: order.createdAt,
          worker: order.worker
            ? `${order.worker.firstName} ${order.worker.lastName}`
            : null,
          items: order.orderItems,
          invoice: order.invoices[0] || null,
        })),
      })),
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// =======================================
// GET CLIENT ACTIVE ORDERS
// =======================================
export const getClientActiveOrders = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ message: 'User ID not found' });
      return;
    }

    const clients = await prisma.client.findMany({
      where: { userId },
    });

    if (clients.length === 0) {
      res.status(404).json({ message: 'Client profile not found' });
      return;
    }

    const activeOrders = await prisma.order.findMany({
      where: {
        clientId: { in: clients.map(c => c.id) },
        status: { in: ['WAITING', 'IN_PROGRESS', 'READY'] },
      },
      include: {
        vehicle: {
          select: {
            brand: true,
            model: true,
            licensePlate: true,
          },
        },
        worker: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        orderItems: true,
        invoices: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({
      activeOrders: activeOrders.map(order => ({
        id: order.id,
        orderNumber: order.orderNumber,
        description: order.description,
        status: order.status,
        totalPrice: order.totalPrice,
        endDate: order.endDate,
        createdAt: order.createdAt,
        vehicle: order.vehicle,
        worker: order.worker
          ? `${order.worker.firstName} ${order.worker.lastName}`
          : null,
        items: order.orderItems,
        invoice: order.invoices[0] || null,
      })),
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// =======================================
// GET CLIENT ORDER HISTORY (COMPLETED)
// =======================================
export const getClientOrderHistory = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ message: 'User ID not found' });
      return;
    }

    const clients = await prisma.client.findMany({
      where: { userId },
    });

    if (clients.length === 0) {
      res.status(404).json({ message: 'Client profile not found' });
      return;
    }

    const completedOrders = await prisma.order.findMany({
      where: {
        clientId: { in: clients.map(c => c.id) },
        status: 'COMPLETED',
      },
      include: {
        vehicle: {
          select: {
            brand: true,
            model: true,
            licensePlate: true,
          },
        },
        worker: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        orderItems: true,
        invoices: true,
      },
      orderBy: { completedDate: 'desc' },
    });

    res.status(200).json({
      orderHistory: completedOrders.map(order => ({
        id: order.id,
        orderNumber: order.orderNumber,
        description: order.description,
        status: order.status,
        totalPrice: order.totalPrice,
        completedDate: order.completedDate,
        createdAt: order.createdAt,
        vehicle: order.vehicle,
        worker: order.worker
          ? `${order.worker.firstName} ${order.worker.lastName}`
          : null,
        items: order.orderItems,
        invoice: order.invoices[0] || null,
      })),
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// =======================================
// GET CLIENT INVOICES
// =======================================
export const getClientInvoices = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ message: 'User ID not found' });
      return;
    }

    const clients = await prisma.client.findMany({
      where: { userId },
    });

    if (clients.length === 0) {
      res.status(404).json({ message: 'Client profile not found' });
      return;
    }

    const orders = await prisma.order.findMany({
      where: {
        clientId: { in: clients.map(c => c.id) },
      },
      include: {
        invoices: true,
        vehicle: {
          select: {
            brand: true,
            model: true,
            licensePlate: true,
          },
        },
        orderItems: true,
      },
    });

    const invoices = orders
      .filter(o => o.invoices.length > 0)
      .map(o => ({
        id: o.invoices[0]!.id,
        invoiceNumber: o.invoices[0]!.invoiceNumber,
        totalAmount: o.invoices[0]!.total,
        issueDate: o.invoices[0]!.issueDate,
        dueDate: o.invoices[0]!.dueDate,
        isPaid: o.invoices[0]!.isPaid,
        paidDate: o.invoices[0]!.paidDate,
        order: {
          id: o.id,
          orderNumber: o.orderNumber,
          description: o.description,
          vehicle: o.vehicle,
          items: o.orderItems,
        },
      }));

    res.status(200).json({ invoices });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// =======================================
// GET CLIENT NOTIFICATIONS
// =======================================
export const getClientNotifications = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ message: 'User ID not found' });
      return;
    }

    const clients = await prisma.client.findMany({
      where: { userId },
    });

    const notifications = await prisma.notification.findMany({
      where: {
        clientId: { in: clients.map(c => c.id) },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    const unreadCount = await prisma.notification.count({
      where: {
        clientId: { in: clients.map(c => c.id) },
        isRead: false,
      },
    });

    res.status(200).json({ notifications, unreadCount });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// =======================================
// MARK NOTIFICATION AS READ
// =======================================
export const markNotificationAsRead = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });

    res.status(200).json({ message: 'Notification marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// =======================================
// CLIENT DASHBOARD OVERVIEW
// =======================================
export const getClientDashboardOverview = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;

    const clients = await prisma.client.findMany({
      where: { userId },
    });

    const clientIds = clients.map(c => c.id);

    const totalVehicles = await prisma.vehicle.count({
      where: { clientId: { in: clientIds }, deletedAt: null },
    });

    const activeOrders = await prisma.order.count({
      where: {
        clientId: { in: clientIds },
        status: { in: ['WAITING', 'IN_PROGRESS', 'READY'] },
      },
    });

    const completedOrders = await prisma.order.count({
      where: { clientId: { in: clientIds }, status: 'COMPLETED' },
    });

    const unreadNotifications = await prisma.notification.count({
      where: { clientId: { in: clientIds }, isRead: false },
    });

    const unpaidInvoices = await prisma.invoice.count({
      where: {
        order: { clientId: { in: clientIds } },
        isPaid: false,
      },
    });

    res.status(200).json({
      overview: {
        totalVehicles,
        activeOrders,
        completedOrders,
        unreadNotifications,
        unpaidInvoices,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};
