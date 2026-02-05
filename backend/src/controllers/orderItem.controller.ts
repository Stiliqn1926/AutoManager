import { Request, Response } from 'express';
import prisma from '../config/database';

interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

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
      orderBy: { createdAt: 'asc' },
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

  const totalPrice = orderItems.reduce((sum, item) => {
    return sum + Number(item.totalPrice);
  }, 0);

  await prisma.order.update({
    where: { id: orderId },
    data: { totalPrice },
  });
};
