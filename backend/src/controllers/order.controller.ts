import { Request, Response } from 'express';
import prisma from '../config/database';
import { sendEmail, emailTemplates } from '../services/email.service';
import { getPagination, getPaginationMeta } from '../utils/pagination';
import { generateInvoicePDF, generateInvoiceNumber } from '../services/pdf.service';
import path from 'path';
import fs from 'fs';

interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

// Generate unique order number
const generateOrderNumber = async (serviceCompanyId: string): Promise<string> => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  
  return `AUTO-${timestamp}-${random}`;
};

// Create Order (ADMIN или MECHANIC)
export const createOrder = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { vehicleId, clientId, description, workerId } = req.body;
    const userId = req.user!.userId;
    const userRole = req.user!.role;

    let serviceCompanyId: string;
    let assignedWorkerId: string | null = workerId || null;

    if (userRole === 'ADMIN') {
      const serviceCompany = await prisma.serviceCompany.findUnique({
        where: { userId },
      });

      if (!serviceCompany) {
        res.status(404).json({ message: 'Service company not found' });
        return;
      }
      serviceCompanyId = serviceCompany.id;
    } 
    else if (userRole === 'MECHANIC') {
      const worker = await prisma.worker.findUnique({
        where: { userId },
      });

      if (!worker) {
        res.status(404).json({ message: 'Worker profile not found' });
        return;
      }
      
      serviceCompanyId = worker.serviceCompanyId;
      assignedWorkerId = worker.id;
    } else {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }

    const orderNumber = await generateOrderNumber(serviceCompanyId);

    // ✅ ТРАНЗАКЦИЯ: Създаване на поръчка (БЕЗ автоматичен график)
    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          orderNumber,
          description,
          vehicleId,
          clientId,
          workerId: assignedWorkerId,
          serviceCompanyId,
        },
        include: {
          vehicle: true,
          client: true,
          worker: true,
        },
      });

      return order;
    });

    res.status(201).json({
      message: 'Order created successfully',
      order: result,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};
  
// Get All Orders (ADMIN вижда всички, MECHANIC само своите) - С PAGINATION
export const getAllOrders = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const userRole = req.user!.role;

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const { skip, take } = getPagination(page, limit);
    const statusFilter = req.query.status as string;

    let whereClause: any = {};

    if (userRole === 'ADMIN') {
      const serviceCompany = await prisma.serviceCompany.findUnique({
        where: { userId },
      });

      if (!serviceCompany) {
        res.status(404).json({ message: 'Service company not found' });
        return;
      }

      whereClause.serviceCompanyId = serviceCompany.id;
    } else if (userRole === 'MECHANIC') {
      const worker = await prisma.worker.findUnique({
        where: { userId },
      });

      if (!worker) {
        res.status(404).json({ message: 'Worker profile not found' });
        return;
      }

      whereClause.workerId = worker.id;
    } else {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }

    // Add status filter if provided
    if (statusFilter) {
      const statuses = statusFilter.split(',').map(s => s.trim());
      whereClause.status = { in: statuses };
    }

    const totalItems = await prisma.order.count({ where: whereClause });

    const orders = await prisma.order.findMany({
      where: whereClause,
      skip,
      take,
      include: {
        vehicle: true,
        client: {
          select: {
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        worker: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        invoices: {
          select: {
            isPaid: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const pagination = getPaginationMeta(totalItems, page, limit);

    // Трансформираме orders да включат isPaid директно
    const ordersWithPaymentStatus = orders.map((order) => ({
      ...order,
      isPaid: order.invoices[0]?.isPaid ?? false,
    }));

    res.status(200).json({
      orders: ordersWithPaymentStatus,
      pagination,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Get Order by ID
export const getOrderById = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;
    const userRole = req.user!.role;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        vehicle: true,
        client: {
          include: {
            user: true,
          },
        },
        worker: true,
        orderItems: true,
        invoices: true,
      },
    });

    if (!order) {
      res.status(404).json({ message: 'Order not found' });
      return;
    }

    // Permission check
    if (userRole === 'ADMIN') {
      const serviceCompany = await prisma.serviceCompany.findUnique({
        where: { userId },
      });

      if (!serviceCompany || order.serviceCompanyId !== serviceCompany.id) {
        res.status(403).json({ message: 'Forbidden' });
        return;
      }
    } else if (userRole === 'MECHANIC') {
      const worker = await prisma.worker.findUnique({
        where: { userId },
      });

      if (!worker || order.workerId !== worker.id) {
        res.status(403).json({ message: 'Forbidden' });
        return;
      }
    }

    res.status(200).json({ order });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Update Order (ADMIN може всичко, MECHANIC ограничено)
export const updateOrder = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      description,
      status,
      workerId,
      totalPrice,
      orderItems
    } = req.body;
    const userId = req.user!.userId;
    const userRole = req.user!.role;

    const order = await prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      res.status(404).json({ message: 'Order not found' });
      return;
    }

    // Ако е ADMIN, провери дали е от неговата компания
    if (userRole === 'ADMIN') {
      const serviceCompany = await prisma.serviceCompany.findUnique({
        where: { userId },
      });

      if (!serviceCompany || order.serviceCompanyId !== serviceCompany.id) {
        res.status(403).json({ message: 'Forbidden' });
        return;
      }

      // ✅ ПРОВЕРКА: Дали новият механик е зает в този период
      if (workerId && workerId !== order.workerId) {
        const startTime = new Date();
        const endTime = new Date();
        endTime.setHours(endTime.getHours() + 4);

        const hasConflict = await prisma.schedule.findFirst({
          where: {
            workerId,
            orderId: { not: id },
            AND: [
              { startTime: { lt: endTime } },
              { endTime: { gt: startTime } },
            ],
          },
        });

        if (hasConflict) {
          res.status(409).json({
            message: 'Механикът е зает и не може да бъде преназначен',
          });
          return;
        }
      }
    }
    // Ако е MECHANIC, провери дали е НЕГОВА поръчка
    else if (userRole === 'MECHANIC') {
      const worker = await prisma.worker.findUnique({
        where: { userId },
      });

      if (!worker || order.workerId !== worker.id) {
        res.status(403).json({ message: 'You can only edit your own orders' });
        return;
      }
    }

    // ТРАНЗАКЦИЯ - обнови поръчка + обнови order items + управлявай график
    const updatedOrder = await prisma.$transaction(async (tx) => {
      // Обнови основната поръчка
      const updated = await tx.order.update({
        where: { id },
        data: {
          description,
          status,
          workerId: userRole === 'ADMIN' ? workerId : undefined,
          totalPrice,
        },
      });

      // ✅ УПРАВЛЕНИЕ НА ГРАФИК при смяна на механик
      if (userRole === 'ADMIN' && workerId !== undefined) {
        // Изтрий стария график (ако има)
        await tx.schedule.deleteMany({
          where: { orderId: id },
        });

        // Създай нов график, ако има възложен механик
        if (workerId) {
          const startTime = new Date();
          const endTime = new Date();
          endTime.setHours(endTime.getHours() + 4);

          await tx.schedule.create({
            data: {
              date: startTime,
              title: `Поръчка ${order.orderNumber}`,
              description: description || order.description,
              startTime,
              endTime,
              workerId,
              serviceCompanyId: order.serviceCompanyId,
              orderId: id,
            },
          });
        }
      }

      // Ако има orderItems, обнови ги
      if (orderItems && Array.isArray(orderItems)) {
        // Изтрий всички стари order items
        await tx.orderItem.deleteMany({
          where: { orderId: id },
        });

        // Създай новите order items
        if (orderItems.length > 0) {
          await tx.orderItem.createMany({
            data: orderItems.map((item: any) => ({
              orderId: id,
              type: item.type,
              name: item.description,
              quantity: Number(item.quantity),
              unitPrice: Number(item.unitPrice),
              totalPrice: Number(item.quantity) * Number(item.unitPrice),
              serviceCompanyId: order.serviceCompanyId,
            })),
          });
        }

        // Обнови totalPrice на поръчката
        const newOrderItems = await tx.orderItem.findMany({
          where: { orderId: id },
        });

        const totalPrice = newOrderItems.reduce((sum, item) => {
          return sum + Number(item.totalPrice);
        }, 0);

        await tx.order.update({
          where: { id },
          data: { totalPrice },
        });
      }

      return updated;
    });

    // Вземи обновената поръчка с всички relations
    const finalOrder = await prisma.order.findUnique({
      where: { id },
      include: {
        orderItems: true,
        vehicle: true,
        client: {
          include: {
            user: true,
          },
        },
        worker: true,
      },
    });

    res.status(200).json({
      message: 'Order updated successfully',
      order: finalOrder,
    });
  } catch (error) {
    console.error('Update order error:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

// Update Order Status (с ограничения за MECHANIC) - С ТРАНЗАКЦИЯ
export const updateOrderStatus = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userRole = req.user!.role;
    const userId = req.user!.userId;

    const order = await prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      res.status(404).json({ message: 'Order not found' });
      return;
    }

    if (userRole === 'MECHANIC') {
      const worker = await prisma.worker.findUnique({
        where: { userId },
      });

      if (order.workerId !== worker?.id) {
        res.status(403).json({ message: 'You can only update your own orders' });
        return;
      }

      if (status === 'COMPLETED') {
        res.status(403).json({ message: 'Only admin can mark orders as completed' });
        return;
      }

      const allowedStatuses = ['WAITING', 'IN_PROGRESS', 'READY'];
      if (!allowedStatuses.includes(status)) {
        res.status(403).json({ message: 'Invalid status for mechanic' });
        return;
      }
    }

    const updatedOrder = await prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id },
        data: {
          status,
          completedDate: status === 'COMPLETED' ? new Date() : undefined,
        },
      });

      // ✅ АКТУАЛИЗИРАЙ ГРАФИК при завършване/отмяна
      if (status === 'COMPLETED') {
        await tx.schedule.updateMany({
          where: { orderId: id },
          data: {
            status: 'COMPLETED',
            isCompleted: true,
          },
        });
      } else if (status === 'CANCELLED') {
        await tx.schedule.updateMany({
          where: { orderId: id },
          data: {
            status: 'CANCELLED',
          },
        });
      }

      if (status === 'READY' || status === 'COMPLETED') {
        await tx.notification.create({
          data: {
            title: status === 'READY' ? 'Поръчката е готова' : 'Поръчката е завършена',
            message: `Вашата поръчка ${order.orderNumber} е ${status === 'READY' ? 'готова за плащане' : 'завършена и платена'}.`,
            clientId: order.clientId,
          },
        });
      }

      return updated;
    });

    if (status === 'READY' || status === 'COMPLETED') {
      const client = await prisma.client.findUnique({
        where: { id: order.clientId },
        include: { user: true },
      });

      const vehicle = await prisma.vehicle.findUnique({
        where: { id: order.vehicleId },
      });

      if (client?.user?.email && vehicle) {
        const vehicleInfo = `${vehicle.brand} ${vehicle.model} (${vehicle.licensePlate})`;
        
        try {
          if (status === 'READY') {
            await sendEmail(
              client.user.email,
              'Поръчката е готова за плащане',
              emailTemplates.orderReady(order.orderNumber, vehicleInfo)
            );
          } else if (status === 'COMPLETED') {
            await sendEmail(
              client.user.email,
              'Поръчката е завършена',
              emailTemplates.orderCompleted(order.orderNumber, vehicleInfo)
            );
          }
        } catch (emailError) {
          console.error('Failed to send email:', emailError);
        }
      }
    }

    res.status(200).json({
      message: 'Order status updated successfully',
      order: updatedOrder,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Complete Order (само ADMIN) - С ТРАНЗАКЦИЯ
export const completeOrder = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const userRole = req.user!.role;

    if (userRole !== 'ADMIN') {
      res.status(403).json({ message: 'Only admin can complete orders' });
      return;
    }

    const order = await prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      res.status(404).json({ message: 'Order not found' });
      return;
    }

    const completedOrder = await prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id },
        data: {
          status: 'COMPLETED',
          completedDate: new Date(),
        },
      });

      // ✅ АКТУАЛИЗИРАЙ ГРАФИК при завършване
      await tx.schedule.updateMany({
        where: { orderId: id },
        data: {
          status: 'COMPLETED',
          isCompleted: true,
        },
      });

      await tx.notification.create({
        data: {
          title: 'Поръчката е завършена',
          message: `Вашата поръчка ${order.orderNumber} е завършена и платена. Благодарим ви!`,
          clientId: order.clientId,
        },
      });

      return updated;
    });

    const client = await prisma.client.findUnique({
      where: { id: order.clientId },
      include: { user: true },
    });

    const vehicle = await prisma.vehicle.findUnique({
      where: { id: order.vehicleId },
    });

    if (client?.user?.email && vehicle) {
      const vehicleInfo = `${vehicle.brand} ${vehicle.model} (${vehicle.licensePlate})`;
      
      try {
        await sendEmail(
          client.user.email,
          'Поръчката е завършена',
          emailTemplates.orderCompleted(order.orderNumber, vehicleInfo)
        );
      } catch (emailError) {
        console.error('Failed to send email:', emailError);
      }
    }

    res.status(200).json({
      message: 'Order completed successfully',
      order: completedOrder,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Delete Order (само ADMIN)
export const deleteOrder = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;
    const userRole = req.user!.role;

    if (userRole !== 'ADMIN') {
      res.status(403).json({ message: 'Only admin can delete orders' });
      return;
    }

    const serviceCompany = await prisma.serviceCompany.findUnique({
      where: { userId },
    });

    if (!serviceCompany) {
      res.status(404).json({ message: 'Service company not found' });
      return;
    }

    const order = await prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      res.status(404).json({ message: 'Order not found' });
      return;
    }

    if (order.serviceCompanyId !== serviceCompany.id) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }

    await prisma.order.delete({
      where: { id },
    });

    res.status(200).json({
      message: 'Order deleted successfully',
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Finalize Order and Generate Invoice (само ADMIN)
export const finalizeOrder = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const userRole = req.user!.role;
    const userId = req.user!.userId;

    if (userRole !== 'ADMIN') {
      res.status(403).json({ message: 'Only admin can finalize orders' });
      return;
    }

    const serviceCompany = await prisma.serviceCompany.findUnique({
      where: { userId },
    });

    if (!serviceCompany) {
      res.status(404).json({ message: 'Service company not found' });
      return;
    }

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        orderItems: true,
        client: {
          include: {
            user: true,
          },
        },
        vehicle: true,
        invoices: true,
      },
    });

    if (!order) {
      res.status(404).json({ message: 'Order not found' });
      return;
    }

    if (!order.orderItems || order.orderItems.length === 0) {
      res.status(400).json({ message: 'Cannot finalize order without items' });
      return;
    }

    if (order.invoices[0]) {
      res.status(400).json({ message: 'Order already has an invoice' });
      return;
    }

    const invoiceNumber = generateInvoiceNumber();

    const invoiceData = {
      orderNumber: order.orderNumber,
      invoiceNumber,
      issueDate: new Date(),
      clientName: `${order.client.firstName} ${order.client.lastName}`,
      clientPhone: order.client.phone,
      clientEmail: order.client.user?.email || order.client.email || 'Няма email',
      vehicleInfo: `${order.vehicle.brand} ${order.vehicle.model} (${order.vehicle.licensePlate})`,
      orderItems: order.orderItems.map((item) => ({
        type: item.type,
        name: item.name,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        totalPrice: Number(item.totalPrice),
      })),
      totalPrice: Number(order.totalPrice) || 0,
      serviceCompanyName: serviceCompany.name,
      serviceCompanyAddress: serviceCompany.address || 'Адрес не е посочен',
      serviceCompanyPhone: serviceCompany.phone,
      serviceCompanyEmail: serviceCompany.email,
    };

    const fileName = `${invoiceNumber}.pdf`;
    const outputPath = path.join(process.cwd(), 'uploads', 'invoices', fileName);

    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    await generateInvoicePDF(invoiceData, outputPath);

    const invoiceUrl = `/uploads/invoices/${fileName}`;

    const subtotal = Number(order.totalPrice) || 0;
    const taxRate = 0.20;
    const tax = subtotal * taxRate;
    const total = subtotal + tax;

    const invoice = await prisma.$transaction(async (tx) => {
      const createdInvoice = await tx.invoice.create({
        data: {
          invoiceNumber,
          orderId: order.id,
          subtotal,
          tax,
          total,
          issueDate: new Date(),
          serviceCompanyId: order.serviceCompanyId,
        },
      });

      await tx.order.update({
        where: { id },
        data: {
          status: 'READY',
        },
      });

      return createdInvoice;
    });

    const updatedOrder = await prisma.order.findUnique({
      where: { id },
      include: {
        vehicle: true,
        client: {
          include: {
            user: true,
          },
        },
        orderItems: true,
        invoices: true,
      },
    });

    await prisma.notification.create({
      data: {
        title: 'Фактурата е готова',
        message: `Вашата фактура за поръчка ${order.orderNumber} е готова за преглед.`,
        clientId: order.clientId,
      },
    });

    if (order.client.user?.email) {
      try {
        await sendEmail(
          order.client.user.email,
          'Фактурата е готова',
          emailTemplates.invoiceReady(invoiceNumber, total, order.orderNumber),
          [
            {
              filename: fileName,
              path: outputPath,
            },
          ]
        );
      } catch (emailError) {
        console.error('Failed to send email:', emailError);
      }
    }

    res.status(200).json({
      message: 'Invoice generated successfully',
      order: updatedOrder,
      invoiceUrl,
    });
  } catch (error) {
    console.error('Finalize order error:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

// Add Order Item (ADMIN добавя част/труд/консуматив към поръчка)
export const addOrderItem = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { orderId } = req.params;
    const { type, name, quantity, unitPrice, description } = req.body;

    const totalPrice = quantity * unitPrice;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { serviceCompanyId: true },
    });

    if (!order) {
      res.status(404).json({ message: 'Order not found' });
      return;
    }

    const orderItem = await prisma.orderItem.create({
      data: {
        type,
        name,
        quantity,
        unitPrice,
        totalPrice,
        description,
        orderId,
        serviceCompanyId: order.serviceCompanyId,
      },
    });

    await updateOrderTotalPrice(orderId);

    res.status(201).json({
      message: 'Order item added successfully',
      orderItem,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Get Order Items (всички елементи на поръчка)
export const getOrderItems = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { orderId } = req.params;

    const orderItems = await prisma.orderItem.findMany({
      where: { orderId },
      orderBy: {
        createdAt: 'asc',
      },
    });

    res.status(200).json({ orderItems });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Update Order Item
export const updateOrderItem = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { type, name, quantity, unitPrice, description } = req.body;

    const totalPrice = quantity * unitPrice;

    const updatedItem = await prisma.orderItem.update({
      where: { id },
      data: {
        type,
        name,
        quantity,
        unitPrice,
        totalPrice,
        description,
      },
    });

    const orderItem = await prisma.orderItem.findUnique({
      where: { id },
    });
    
    if (orderItem) {
      await updateOrderTotalPrice(orderItem.orderId);
    }

    res.status(200).json({
      message: 'Order item updated successfully',
      orderItem: updatedItem,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Delete Order Item
export const deleteOrderItem = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const orderItem = await prisma.orderItem.findUnique({
      where: { id },
    });

    if (!orderItem) {
      res.status(404).json({ message: 'Order item not found' });
      return;
    }

    await prisma.orderItem.delete({
      where: { id },
    });

    await updateOrderTotalPrice(orderItem.orderId);

    res.status(200).json({
      message: 'Order item deleted successfully',
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Helper function: Update Order Total Price
const updateOrderTotalPrice = async (orderId: string): Promise<void> => {
  const orderItems = await prisma.orderItem.findMany({
    where: { orderId },
  });

  const totalPrice = orderItems.reduce((sum, item) => {
    return sum + Number(item.totalPrice);
  }, 0);

  await prisma.order.update({
    where: { id: orderId },
    data: { totalPrice },
  });
};