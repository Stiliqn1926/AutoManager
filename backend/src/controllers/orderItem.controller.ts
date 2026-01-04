import { Request, Response } from 'express';
import prisma from '../config/database';

interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

// Add Order Item (ADMIN добавя част/труд/консуматив към поръчка)
export const addOrderItem = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { orderId } = req.params;
    const { type, name, quantity, unitPrice, description } = req.body;

    // Изчисли totalPrice
    const totalPrice = quantity * unitPrice;

    // Get order to access serviceCompanyId
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { serviceCompanyId: true },
    });

    if (!order) {
      res.status(404).json({ message: 'Order not found' });
      return;
    }

    // Създай OrderItem
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

    // Обнови totalPrice на поръчката
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

    // Изчисли totalPrice
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

    // Обнови totalPrice на поръчката
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

    // Обнови totalPrice на поръчката
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