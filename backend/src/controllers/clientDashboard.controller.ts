import { Request, Response } from 'express';
import prisma from '../config/database';
import path from 'path';
import fs from 'fs';

interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
    serviceCompanyId?: string;
  };
} 

export const getClientProfile = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ message: 'User ID not found' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    const client = await prisma.client.findFirst({
      where: { userId, isActive: true, deletedAt: null },
    });

    if (!client) {
      res.status(404).json({ message: 'Client profile not found' });
      return;
    }

    res.status(200).json({
      profile: {
        email: user?.email,
        firstName: client.firstName,
        lastName: client.lastName,
        phone: client.phone,
        address: client.address,
        createdAt: client.createdAt,
      },
    });
  } catch (error) {
    console.error('[getClientProfile] error:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

// =======================================
// UPDATE CLIENT PROFILE
// =======================================
export const updateClientProfile = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { firstName, lastName, phone, address } = req.body;

    if (!userId) {
      res.status(401).json({ message: 'User ID not found' });
      return;
    }

    const client = await prisma.client.findFirst({
      where: { userId, isActive: true, deletedAt: null },
    });

    if (!client) {
      res.status(404).json({ message: 'Client profile not found' });
      return;
    }

    const updated = await prisma.client.update({
      where: { id: client.id },
      data: { firstName, lastName, phone, address },
    });

    res.status(200).json({
      message: 'Профилът е обновен успешно',
      client: updated,
    });
  } catch (error) {
    console.error('[updateClientProfile] error:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

// =======================================
// CHANGE PASSWORD
// =======================================
export const changePassword = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { currentPassword, newPassword } = req.body;

    if (!userId) {
      res.status(401).json({ message: 'User ID not found' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    const bcrypt = await import('bcryptjs');
    const isValid = await bcrypt.compare(currentPassword, user.password);

    if (!isValid) {
      res.status(400).json({ message: 'Грешна текуща парола' });
      return;
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: userId },
      data: { 
        password: hashedPassword,
        tokenVersion: { increment: 1 },
      },
    });

    res.status(200).json({ message: 'Паролата е сменена успешно' });
  } catch (error) {
    console.error('[changePassword] error:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

// =======================================
// GET CLIENT PENDING REQUESTS
// =======================================
export const getClientPendingRequests = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ message: 'User ID not found' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    const pendingRequests = await prisma.pendingRequest.findMany({
      where: {
        email: user.email,
        requestType: 'CLIENT',
        status: 'PENDING',
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
        createdAt: 'desc',
      },
    });

    res.status(200).json({ pendingRequests });
  } catch (error) {
    console.error('[getClientPendingRequests] error:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

// =======================================
// CANCEL CLIENT PENDING REQUEST
// =======================================
export const cancelClientPendingRequest = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { requestId } = req.params;

    if (!userId) {
      res.status(401).json({ message: 'User ID not found' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    const pendingRequest = await prisma.pendingRequest.findUnique({
      where: { id: requestId },
    });

    if (!pendingRequest) {
      res.status(404).json({ message: 'Заявката не е намерена' });
      return;
    }

    if (pendingRequest.email !== user.email) {
      res.status(403).json({ message: 'Нямате право да откажете тази заявка' });
      return;
    }

    if (pendingRequest.status !== 'PENDING') {
      res.status(400).json({ message: 'Заявката вече е обработена' });
      return;
    }

    await prisma.pendingRequest.delete({
      where: { id: requestId },
    });

    res.status(200).json({ message: 'Заявката е отказана успешно' });
  } catch (error) {
    console.error('[cancelClientPendingRequest] error:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

// =======================================
// GET CLIENT SERVICE COMPANIES
// =======================================
export const getClientServiceCompanies = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;

    console.log('🔍 [getClientServiceCompanies] userId:', userId);

    if (!userId) {
      res.status(401).json({ message: 'User ID not found' });
      return;
    }

    // Вземи всички Client профили за този user
    const clients = await prisma.client.findMany({
      where: { 
        userId,
        isActive: true,
        deletedAt: null,
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

    console.log('[getClientServiceCompanies] clients found:', clients.length);

    // 🆕 ФИЛТРИРАМЕ само валидни записи (с existing serviceCompany)
    const validClients = clients.filter(client => client.serviceCompany !== null);
    
    console.log('[getClientServiceCompanies] valid clients:', validClients.length);

    // Мапваме към по-чист формат
    const serviceCompanies = validClients.map(client => ({
      clientId: client.id,
      serviceCompany: client.serviceCompany!,  // Safe защото филтрирахме null
    }));

    res.status(200).json({ serviceCompanies });
  } catch (error) {
    console.error('[getClientServiceCompanies] error:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};
// =======================================
// GET CLIENT VEHICLES + SERVICE HISTORY
// =======================================
export const getClientVehicles = async (
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

    // Вземи всички активни client профили за user-а (по желание филтрирани по сервиз)
    const clients = await prisma.client.findMany({
      where: {
        userId,
        isActive: true,
        deletedAt: null,
        ...(serviceCompanyId ? { serviceCompanyId } : {}),
      },
      select: { id: true, serviceCompanyId: true },
    });

    if (clients.length === 0) {
      res.status(404).json({ message: 'Client profile not found' });
      return;
    }

    const clientIds = clients.map((c) => c.id);
    const serviceCompanyIds = clients.map((c) => c.serviceCompanyId).filter(Boolean) as string[];

    const vehicles = await prisma.vehicle.findMany({
      where: {
        clientId: { in: clientIds },
        deletedAt: null,
        // ако е подаден serviceCompanyId -> филтрирай
        ...(serviceCompanyId
          ? { serviceCompanyId }
          : serviceCompanyIds.length
          ? { serviceCompanyId: { in: serviceCompanyIds } }
          : {}),
      },
      include: {
        orders: {
          orderBy: { createdAt: 'desc' },
          where: serviceCompanyId ? { serviceCompanyId } : undefined,
          include: {
            orderItems: true,
            invoices: true,
            worker: {
              select: { firstName: true, lastName: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({
      vehicles: vehicles.map((v) => ({
        id: v.id,
        brand: v.brand,
        model: v.model,
        year: v.year,
        licensePlate: v.licensePlate,
        vin: v.vin,
        color: v.color,
        mileage: v.mileage,
        updatedAt: v.updatedAt,
        _count: {
          orders: v.orders.length,
        },
        serviceHistory: v.orders.map((order) => ({
          id: order.id,
          orderNumber: order.orderNumber,
          displayOrderNumber: order.displayOrderNumber,
          description: order.description,
          status: order.status,
          totalPrice: order.totalPrice,
          endDate: order.endDate,
          completedDate: order.completedDate,
          createdAt: order.createdAt,
          worker: order.worker ? `${order.worker.firstName} ${order.worker.lastName}` : null,
          items: order.orderItems,
          invoice: order.invoices[0] || null,
        })),
      })),
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};
 
// vehicle details by id
export const getClientVehicleById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;
    const serviceCompanyId = req.query.serviceCompanyId as string | undefined;

    if (!userId) {
      res.status(401).json({ message: 'User ID not found' });
      return;
    }

    if (!serviceCompanyId) {
      res.status(400).json({ message: 'serviceCompanyId is required' });
      return;
    }

    const client = await prisma.client.findFirst({
      where: {
        userId,
        serviceCompanyId,
        isActive: true,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (!client) {
      res.status(404).json({ message: 'Client profile not found' });
      return;
    }

    const vehicle = await prisma.vehicle.findFirst({
      where: {
        id,
        clientId: client.id,
        serviceCompanyId,
        deletedAt: null,
      },
      include: {
  orders: {
    orderBy: { createdAt: 'desc' },
    include: {
      orderItems: true,
      invoices: true,
      worker: {
        select: { firstName: true, lastName: true },
      },
    },
  },
},
    });

    if (!vehicle) {
      res.status(404).json({ message: 'Vehicle not found' });
      return;
    }

   res.status(200).json({
  vehicle: {
    id: vehicle.id,
    brand: vehicle.brand,
    model: vehicle.model,
    year: vehicle.year,
    licensePlate: vehicle.licensePlate,
    vin: vehicle.vin,
    color: vehicle.color,
    mileage: vehicle.mileage,
    createdAt: vehicle.createdAt,
    updatedAt: vehicle.updatedAt,
    serviceHistory: vehicle.orders.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      displayOrderNumber: order.displayOrderNumber,
      description: order.description,
      status: order.status,
      totalPrice: order.totalPrice,
      endDate: order.endDate,
      completedDate: order.completedDate,
      createdAt: order.createdAt,
      worker: order.worker ? `${order.worker.firstName} ${order.worker.lastName}` : null,
      items: order.orderItems,
      invoice: order.invoices[0] || null,
    })),
  },
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
      displayOrderNumber: order.displayOrderNumber,
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
// GET CLIENT ORDER BY ID
// =======================================
export const getClientOrderById = async (
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

    // Вземи всички Client профили за този user
    const clients = await prisma.client.findMany({
      where: { 
        userId,
        isActive: true,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (clients.length === 0) {
      res.status(404).json({ message: 'Client profile not found' });
      return;
    }

    const clientIds = clients.map((c) => c.id);

    // Намери поръчката
    const order = await prisma.order.findFirst({
      where: {
        id,
        clientId: { in: clientIds },
      },
      include: {
        vehicle: {
          select: {
            id: true,
            brand: true,
            model: true,
            licensePlate: true,
            year: true,
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
    });

    if (!order) {
      res.status(404).json({ message: 'Order not found' });
      return;
    }

    res.status(200).json({
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
      displayOrderNumber: order.displayOrderNumber,
        description: order.description,
        diagnosis: order.diagnosis,
        status: order.status,
        priority: order.priority,
        totalPrice: order.totalPrice,
        startDate: order.startDate,
        endDate: order.endDate,
        completedDate: order.completedDate,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        notes: order.notes,
        vehicle: order.vehicle,
        worker: order.worker
          ? `${order.worker.firstName} ${order.worker.lastName}`
          : null,
        items: order.orderItems,
        invoice: order.invoices[0] || null,
      },
    });
  } catch (error) {
    console.error('[getClientOrderById] error:', error);
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
      displayOrderNumber: order.displayOrderNumber,
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
          displayOrderNumber: o.displayOrderNumber,
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
      include: {
        order: {
          select: {
            orderNumber: true,
            displayOrderNumber: true,
          },
        },
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
    const { serviceCompanyId } = req.query; // 🆕 Филтър по сервиз

    if (!userId) {
      res.status(401).json({ message: 'User ID not found' });
      return;
    }

    // Намери Client профила за този user и serviceCompany
    const client = await prisma.client.findFirst({
      where: {
        userId,
        serviceCompanyId: serviceCompanyId as string,
        isActive: true,
        deletedAt: null,
      },
    });

    if (!client) {
      res.status(404).json({ message: 'Client profile not found' });
      return;
    }

    const clientId = client.id;

    // 1️⃣ OVERVIEW STATS (числа за cards)
    const activeOrdersCount = await prisma.order.count({
      where: {
        clientId,
        status: { in: ['WAITING', 'IN_PROGRESS', 'READY'] },
      },
    });

    const unreadNotifications = await prisma.notification.count({
      where: { clientId, isRead: false },
    });

    const unpaidInvoices = await prisma.invoice.count({
      where: {
        order: { clientId },
        isPaid: false,
      },
    });

    // 2️⃣ АКТИВНИ РЕМОНТИ (списък)
    const activeOrders = await prisma.order.findMany({
      where: {
        clientId,
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
      },
      orderBy: { createdAt: 'desc' },
      take: 5, // Последните 5
    });

    // 3️⃣ ПОСЛЕДНА АКТИВНОСТ (от notifications)
    const recentActivity = await prisma.notification.findMany({
      where: { clientId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        order: {
          select: {
            orderNumber: true,
            displayOrderNumber: true,
          },
        },
      },
    });

    res.status(200).json({
      overview: {
        activeOrders: activeOrdersCount,
        unreadNotifications,
        unpaidInvoices,
      },
      activeOrdersList: activeOrders.map(order => ({
        id: order.id,
        orderNumber: order.orderNumber,
        displayOrderNumber: order.displayOrderNumber,
        description: order.description,
        status: order.status,
        totalPrice: order.totalPrice,
        endDate: order.endDate,
        createdAt: order.createdAt,
        vehicle: order.vehicle,
        worker: order.worker
          ? `${order.worker.firstName} ${order.worker.lastName}`
          : null,
      })),
      recentActivity: recentActivity.map(notification => ({
        id: notification.id,
        title: notification.title,
        message: notification.message,
        isRead: notification.isRead,
        createdAt: notification.createdAt,
        orderNumber: notification.order?.orderNumber || null,
        displayOrderNumber: notification.order?.displayOrderNumber || null,
      })),
    });
  } catch (error) {
    console.error('[getClientDashboardOverview] error:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

// =======================================
// ADD SERVICE COMPANY (JOIN via uniqueCode)
// =======================================
export const addServiceCompany = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { uniqueCode } = req.body;

    if (!userId) {
      res.status(401).json({ message: 'User ID not found' });
      return;
    }

    if (!uniqueCode || typeof uniqueCode !== 'string') {
      res.status(400).json({ message: 'Unique code is required' });
      return;
    }

    // Намери сервиза по uniqueCode
    const serviceCompany = await prisma.serviceCompany.findUnique({
      where: { uniqueCode: uniqueCode.toUpperCase() },
    });

    if (!serviceCompany) {
      res.status(404).json({ message: 'Невалиден код на сервиз' });
      return;
    }

    if (!serviceCompany.isActive) {
      res.status(400).json({ message: 'Този сервиз е неактивен' });
      return;
    }

    // Вземи данните на user-а
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Провери дали вече не е добавен (активен Client)
    const existingClient = await prisma.client.findFirst({
      where: {
        userId,
        serviceCompanyId: serviceCompany.id,
        isActive: true,
        deletedAt: null,
      },
    });

    if (existingClient) {
      res.status(400).json({ message: 'Вече сте добавени към този сервиз' });
      return;
    }

    // Провери дали има pending request
    const existingRequest = await prisma.pendingRequest.findFirst({
      where: {
        email: user.email,
        serviceCompanyId: serviceCompany.id,
        requestType: 'CLIENT',
        status: 'PENDING',
      },
    });

    if (existingRequest) {
      res.status(400).json({ 
        message: 'Вече имате изчакваща заявка за този сервиз',
        status: 'PENDING'
      });
      return;
    }

    // Провери дали има съществуващ Client профил (дори от друг сервиз)
    const anyClientProfile = await prisma.client.findFirst({
      where: {
        userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Ако няма никакъв Client профил, използвай данни от email
    const firstName = anyClientProfile?.firstName || user.email.split('@')[0];
    const lastName = anyClientProfile?.lastName || '';
    const phone = anyClientProfile?.phone || '';

    // 🆕 Създай PendingRequest вместо директно Client
    const pendingRequest = await prisma.pendingRequest.create({
      data: {
        requestType: 'CLIENT',
        email: user.email,
        firstName,
        lastName,
        phone,
        specialization: null,
        serviceCompanyId: serviceCompany.id,
        status: 'PENDING',
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

    res.status(201).json({
      message: 'Заявката е изпратена. Очаква одобрение от администратора.',
      status: 'PENDING',
      request: {
        id: pendingRequest.id,
        serviceCompany: pendingRequest.serviceCompany,
      },
    });
  } catch (error) {
    console.error('[addServiceCompany] error:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

// =======================================
// LEAVE SERVICE COMPANY
// =======================================
export const leaveServiceCompany = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { clientId } = req.params;

    if (!userId) {
      res.status(401).json({ message: 'User ID not found' });
      return;
    }

    // Намери Client профила
    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        userId,
      },
    });

    if (!client) {
      res.status(404).json({ message: 'Client profile not found' });
      return;
    }

    // Провери дали има активни поръчки
    const activeOrdersCount = await prisma.order.count({
      where: {
        clientId: client.id,
        status: { in: ['WAITING', 'IN_PROGRESS', 'READY'] },
      },
    });

    if (activeOrdersCount > 0) {
      res.status(400).json({
        message: 'Не можете да напуснете сервиз с активни поръчки',
      });
      return;
    }

    // Soft delete на Client профила
    await prisma.client.update({
      where: { id: clientId },
      data: {
        isActive: false,
        deletedAt: new Date(),
      },
    });

    res.status(200).json({ message: 'Успешно напуснахте сервиза' });
  } catch (error) {
    console.error('[leaveServiceCompany] error:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

// =======================================
// DOWNLOAD INVOICE PDF
// =======================================
export const downloadInvoicePDF = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { invoiceNumber } = req.params;

    if (!userId) {
      res.status(401).json({ message: 'User ID not found' });
      return;
    }

    // Намери всички Client профили на този user
    const clients = await prisma.client.findMany({
      where: { userId },
    });

    if (clients.length === 0) {
      res.status(404).json({ message: 'Client profile not found' });
      return;
    }

    // Намери фактурата по invoiceNumber
    const invoice = await prisma.invoice.findFirst({
      where: { invoiceNumber },
      include: {
        order: {
          select: {
            clientId: true,
          },
        },
      },
    });

    if (!invoice) {
      res.status(404).json({ message: 'Invoice not found' });
      return;
    }

    // Провери дали фактурата принадлежи на този клиент
    const clientIds = clients.map(c => c.id);
    if (!clientIds.includes(invoice.order.clientId)) {
      res.status(403).json({ message: 'Forbidden: Invoice does not belong to you' });
      return;
    }

    // Провери дали PDF файлът съществува
    const pdfPath = path.join(process.cwd(), 'uploads', 'invoices', `${invoiceNumber}.pdf`);

    if (!fs.existsSync(pdfPath)) {
      res.status(404).json({ message: 'PDF file not found' });
      return;
    }

    // Изпрати PDF файла
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${invoiceNumber}.pdf"`);

    const fileStream = fs.createReadStream(pdfPath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('[downloadInvoicePDF] error:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};
