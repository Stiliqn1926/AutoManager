import { Request, Response } from 'express';
type OrderStatus = 'WAITING' | 'IN_PROGRESS' | 'READY' | 'COMPLETED' | 'CANCELLED';
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

const generateOrderNumber = async (): Promise<string> => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return `AUTO-${timestamp}-${random}`;
};

const generateDisplayOrderNumber = async (serviceCompanyId: string): Promise<string> => {
  const lastOrder = await prisma.order.findFirst({
    where: { serviceCompanyId },
    orderBy: { createdAt: 'desc' },
    select: { displayOrderNumber: true },
  });

  let nextNum = 1;
  if (lastOrder?.displayOrderNumber) {
    const match = lastOrder.displayOrderNumber.match(/(\d+)$/);
    if (match) {
      nextNum = parseInt(match[1], 10) + 1;
    }
  }

  return `#${nextNum}`;
};

export const createOrder = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { vehicleId, clientId, description, workerId, startDate, endDate } = req.body;
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

      if (workerId) {
        const worker = await prisma.worker.findFirst({
          where: {
            id: workerId,
            serviceCompanyId,
            isActive: true,
          },
        });

        if (!worker) {
          res.status(400).json({ message: 'Worker is inactive or not in this service company' });
          return;
        }
      }
    } 
    else if (userRole === 'MECHANIC') {
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

      serviceCompanyId = worker.serviceCompanyId;
      assignedWorkerId = worker.id;
    } else {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (end < start) {
        res.status(400).json({ message: 'End date cannot be before start date' });
        return;
      }
    }

    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        serviceCompanyId,
      },
    });

    if (!client) {
      res.status(404).json({ message: 'Client not found in your service company' });
      return;
    }

    if (!client.isActive) {
      res.status(400).json({ message: 'Client is inactive' });
      return;
    }

    if (vehicleId) {
      const vehicle = await prisma.vehicle.findFirst({
        where: {
          id: vehicleId,
          clientId,
          serviceCompanyId,
        },
      });

      if (!vehicle) {
        res.status(400).json({ message: 'Vehicle does not belong to the active client' });
        return;
      }
    }

    const orderNumber = await generateOrderNumber();
    const displayOrderNumber = await generateDisplayOrderNumber(serviceCompanyId);

    const result = await prisma.$transaction(async (tx: any) => {
      const order = await tx.order.create({
        data: {
          orderNumber,
          displayOrderNumber,
          description,
          vehicleId,
          clientId,
          workerId: assignedWorkerId,
          serviceCompanyId,
          ...(startDate && { startDate: new Date(startDate) }),
          ...(endDate && { endDate: new Date(endDate) }),
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
    const workerIdFilter = req.query.workerId as string | undefined;

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

      if (workerIdFilter) {
        whereClause.workerId = workerIdFilter;
      }
    } else if (userRole === 'MECHANIC') {
      const worker = await prisma.worker.findUnique({
        where: { userId },
      });

      if (!worker) {
        res.status(404).json({ message: 'Worker profile not found' });
        return;
      }

      if (!worker.serviceCompanyId) {
        const pagination = getPaginationMeta(0, page, limit);
        res.status(200).json({ orders: [], pagination });
        return;
      }

      whereClause.workerId = worker.id;
      whereClause.serviceCompanyId = worker.serviceCompanyId;
    } else {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }

    if (statusFilter) {
      const statuses = statusFilter.split(',').map((s: string) => s.trim()) as OrderStatus[];
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

    const ordersWithPaymentStatus = orders.map((order: typeof orders[number]) => ({
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

    // Map invoice data to order for frontend compatibility
    const firstInvoice = order.invoices?.[0];
    const orderWithPayment = {
      ...order,
      isPaid: firstInvoice?.isPaid || false,
      paidAt: firstInvoice?.paidDate || null,
      paymentMethod: firstInvoice?.paymentMethod || null,
    };

    res.status(200).json({ order: orderWithPayment });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const updateOrder = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      diagnosis,
      notes,
      status,
      workerId,
      startDate,
      endDate,
      isPaid,
      paymentMethod,
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

    if (userRole === 'ADMIN') {
      const serviceCompany = await prisma.serviceCompany.findUnique({
        where: { userId },
      });

      if (!serviceCompany || order.serviceCompanyId !== serviceCompany.id) {
        res.status(403).json({ message: 'Forbidden' });
        return;
      }

      if (workerId && workerId !== order.workerId) {
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

        // Check if new worker has schedule conflict
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
    } else if (userRole === 'MECHANIC') {
      const worker = await prisma.worker.findUnique({
        where: { userId },
      });

      if (!worker || order.workerId !== worker.id) {
        res.status(403).json({ message: 'You can only edit your own orders' });
        return;
      }
    }

    if (orderItems && Array.isArray(orderItems)) {
      const hasInvalidItem = orderItems.some((item: any) => {
        const quantity = Number(item?.quantity);
        const unitPrice = Number(item?.unitPrice);
        return !Number.isFinite(quantity) || quantity <= 0 || !Number.isFinite(unitPrice) || unitPrice <= 0;
      });

      if (hasInvalidItem) {
        res.status(400).json({ message: 'Quantity and unit price are required for order items' });
        return;
      }
    }

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (end < start) {
        res.status(400).json({ message: 'End date cannot be before start date' });
        return;
      }
    }

    const updatedOrder = await prisma.$transaction(async (tx: any) => {
      const updateData: Record<string, unknown> = {};

      if (diagnosis !== undefined) {
        updateData.diagnosis = diagnosis;
      }

      if (notes !== undefined) {
        updateData.notes = notes;
      }

      if (status !== undefined) {
        updateData.status = status as OrderStatus;
      }

      if (userRole === 'ADMIN') {
        if (workerId) {
          updateData.worker = { connect: { id: workerId } };
        } else if (workerId === '') {
          updateData.worker = { disconnect: true };
        }
      }

      if (startDate !== undefined) {
        updateData.startDate = startDate ? new Date(startDate) : null;
      }

      if (endDate !== undefined) {
        updateData.endDate = endDate ? new Date(endDate) : null;
      }

      const updated = await tx.order.update({
        where: { id },
        data: updateData,
      });

      // Sync schedule deadline
      if (endDate) {
        await tx.schedule.updateMany({
          where: { orderId: id },
          data: { date: new Date(endDate) },
        });
      }

      // Sync schedule status
      if (status) {
        const statusMap: Record<string, 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'> = {
          'WAITING': 'SCHEDULED',
          'IN_PROGRESS': 'IN_PROGRESS',
          'READY': 'COMPLETED',
          'COMPLETED': 'COMPLETED',
          'CANCELLED': 'CANCELLED',
        };
        if (statusMap[status]) {
          await tx.schedule.updateMany({
            where: { orderId: id },
            data: {
              status: statusMap[status],
              ...(status === 'COMPLETED' && { isCompleted: true }),
            },
          });
        }
      }

      // Update worker in schedule
      if (userRole === 'ADMIN' && workerId !== undefined) {
        await tx.schedule.updateMany({
          where: { orderId: id },
          data: { workerId: workerId || null },
        });
      }

      // Update order items
      if (orderItems && Array.isArray(orderItems)) {
        await tx.orderItem.deleteMany({
          where: { orderId: id },
        });

        if (orderItems.length > 0) {
          await tx.orderItem.createMany({
            data: orderItems.map((item: any) => ({
              orderId: id,
              type: item.type || 'LABOR',
              name: item.description || 'Без описание',
              description: item.description,
              quantity: Number(item.quantity),
              unitPrice: Number(item.unitPrice),
              totalPrice: Number(item.quantity) * Number(item.unitPrice),
              serviceCompanyId: order.serviceCompanyId,
            })),
          });
        }

        const newOrderItems = await tx.orderItem.findMany({
          where: { orderId: id },
        });

        const totalPrice = newOrderItems.reduce((sum: number, item: { totalPrice: number | string }) => {
          return sum + Number(item.totalPrice);
        }, 0);

        await tx.order.update({
          where: { id },
          data: { totalPrice },
        });
      }

      // Auto-mark as paid when COMPLETED
      if (userRole === 'ADMIN' && status === 'COMPLETED') {
        const existingInvoice = await tx.invoice.findFirst({
          where: { orderId: id },
        });

        if (existingInvoice) {
          await tx.invoice.update({
            where: { id: existingInvoice.id },
            data: {
              isPaid: true,
              paidDate: new Date(),
              paymentMethod: paymentMethod || existingInvoice.paymentMethod || null,
            },
          });
        }
      }

      // Update payment method
      if (userRole === 'ADMIN' && paymentMethod !== undefined) {
        const existingInvoice = await tx.invoice.findFirst({
          where: { orderId: id },
        });

        if (existingInvoice && status !== 'COMPLETED') {
          await tx.invoice.update({
            where: { id: existingInvoice.id },
            data: { paymentMethod: paymentMethod || null },
          });
        }
      }

      return updated;
    });

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
        invoices: true,
      },
    });

    // Map invoice data to order for frontend compatibility
    const firstInvoice = finalOrder?.invoices?.[0];
    const orderWithPayment = {
      ...finalOrder,
      isPaid: firstInvoice?.isPaid || false,
      paidAt: firstInvoice?.paidDate || null,
      paymentMethod: firstInvoice?.paymentMethod || null,
    };

    res.status(200).json({
      message: 'Order updated successfully',
      order: orderWithPayment,
    });
  } catch (error) {
    console.error('Update order error:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

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

    const updatedOrder = await prisma.$transaction(async (tx: any) => {
      const updated = await tx.order.update({
        where: { id },
        data: {
          status,
          completedDate: status === 'COMPLETED' ? new Date() : undefined,
        },
      });

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
            message: `Вашата поръчка ${order.displayOrderNumber || order.orderNumber} е ${status === 'READY' ? 'готова за плащане' : 'завършена и платена'}.`,
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
        
        if (status === 'READY') {
        
          void sendEmail(
              client.user.email,
              'Поръчката е готова за плащане',
              emailTemplates.orderReady(order.displayOrderNumber || order.orderNumber, vehicleInfo)
        
          ).catch((emailError) => {
        
            console.error('Failed to send email:', emailError);
        
          });
        
        } else if (status === 'COMPLETED') {
        
          void sendEmail(
              client.user.email,
              'Поръчката е завършена',
              emailTemplates.orderCompleted(order.displayOrderNumber || order.orderNumber, vehicleInfo)
        
          ).catch((emailError) => {
        
            console.error('Failed to send email:', emailError);
        
          });
        
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

    const completedOrder = await prisma.$transaction(async (tx: any) => {
      const updated = await tx.order.update({
        where: { id },
        data: {
          status: 'COMPLETED',
          completedDate: new Date(),
        },
      });

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
          message: `Вашата поръчка ${order.displayOrderNumber || order.orderNumber} е завършена и платена. Благодарим ви!`,
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
      
      void sendEmail(
          client.user.email,
          'Поръчката е завършена',
          emailTemplates.orderCompleted(order.displayOrderNumber || order.orderNumber, vehicleInfo)
      
      ).catch((emailError) => {
      
        console.error('Failed to send email:', emailError);
      
      });
    }

    res.status(200).json({
      message: 'Order completed successfully',
      order: completedOrder,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

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
    const tax = 0;
    const total = subtotal;

    const invoice = await prisma.$transaction(async (tx: any) => {
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
        message: `Вашата фактура за поръчка ${order.displayOrderNumber || order.orderNumber} е готова за преглед.`,
        clientId: order.clientId,
      },
    });

    if (order.client.user?.email) {
      void sendEmail(
          order.client.user.email,
          'Фактурата е готова',
          emailTemplates.invoiceReady(invoiceNumber, total, order.displayOrderNumber || order.orderNumber),
          [
            {
              filename: fileName,
              path: outputPath,
            },
          ]
      ).catch((emailError) => {
        console.error('Failed to send email:', emailError);
      });
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

export const addOrderItem = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { orderId } = req.params;
    const { type, name, quantity, unitPrice, description } = req.body;
    const userId = req.user!.userId;
    const role = req.user!.role;

    const totalPrice = quantity * unitPrice;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { serviceCompanyId: true },
    });

    if (!order) {
      res.status(404).json({ message: 'Order not found' });
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
      if (order.serviceCompanyId !== serviceCompany.id) {
        res.status(403).json({ message: 'Forbidden' });
        return;
      }
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

export const getOrderItems = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { orderId } = req.params;
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
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        select: { serviceCompanyId: true },
      });
      if (!order || order.serviceCompanyId !== serviceCompany.id) {
        res.status(404).json({ message: 'Order not found' });
        return;
      }
    }

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

export const updateOrderItem = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { type, name, quantity, unitPrice, description } = req.body;
    const userId = req.user!.userId;
    const role = req.user!.role;

    const totalPrice = quantity * unitPrice;

    if (role === 'ADMIN') {
      const serviceCompany = await prisma.serviceCompany.findUnique({
        where: { userId },
      });
      if (!serviceCompany) {
        res.status(404).json({ message: 'Service company not found' });
        return;
      }
      const existingItem = await prisma.orderItem.findUnique({
        where: { id },
        select: { orderId: true },
      });
      if (!existingItem) {
        res.status(404).json({ message: 'Order item not found' });
        return;
      }
      const order = await prisma.order.findUnique({
        where: { id: existingItem.orderId },
        select: { serviceCompanyId: true },
      });
      if (!order || order.serviceCompanyId !== serviceCompany.id) {
        res.status(403).json({ message: 'Forbidden' });
        return;
      }
    }

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

export const deleteOrderItem = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;
    const role = req.user!.role;

    const orderItem = await prisma.orderItem.findUnique({
      where: { id },
    });

    if (!orderItem) {
      res.status(404).json({ message: 'Order item not found' });
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
      const order = await prisma.order.findUnique({
        where: { id: orderItem.orderId },
        select: { serviceCompanyId: true },
      });
      if (!order || order.serviceCompanyId !== serviceCompany.id) {
        res.status(403).json({ message: 'Forbidden' });
        return;
      }
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

const updateOrderTotalPrice = async (orderId: string): Promise<void> => {
  const orderItems = await prisma.orderItem.findMany({
    where: { orderId },
  });

  const totalPrice = orderItems.reduce<number>(
    (sum, item) => sum + Number(item.totalPrice),
    0
  );

  await prisma.order.update({
    where: { id: orderId },
    data: { totalPrice },
  });
};
