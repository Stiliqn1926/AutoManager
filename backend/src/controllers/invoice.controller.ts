import { Request, Response } from 'express';
import prisma from '../config/database';
import { sendEmail, emailTemplates } from '../services/email.service';
// Environment constants
const DEFAULT_TAX_RATE = parseFloat(process.env.DEFAULT_TAX_RATE || '0.20');

interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

// Generate unique invoice number
const generateInvoiceNumber = async (
  serviceCompanyId: string
): Promise<string> => {
  const year = new Date().getFullYear();
  const count = await prisma.invoice.count({
    where: {
      order: {
        serviceCompanyId,
      },
      createdAt: {
        gte: new Date(`${year}-01-01`),
      },
    },
  });

  const invoiceNum = String(count + 1).padStart(4, '0');
  return `INV-${year}-${invoiceNum}`;
};

// Create Invoice (ADMIN генерира фактура за поръчка) - С ТРАНЗАКЦИЯ
export const createInvoice = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { orderId } = req.params;
    const { tax, notes } = req.body;
    const userId = req.user!.userId;

    // Вземи serviceCompanyId
    const serviceCompany = await prisma.serviceCompany.findUnique({
      where: { userId },
    });

    if (!serviceCompany) {
      res.status(404).json({ message: 'Service company not found' });
      return;
    }

    // Провери дали поръчката съществува
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        orderItems: true,
        invoices: true,
      },
    });

    if (!order) {
      res.status(404).json({ message: 'Order not found' });
      return;
    }

    // Провери дали вече има фактура
    if (order.invoices && order.invoices.length > 0) {
      res
        .status(400)
        .json({ message: 'Invoice already exists for this order' });
      return;
    }

    // Провери дали има OrderItems
    if (!order.orderItems || order.orderItems.length === 0) {
      res
        .status(400)
        .json({ message: 'Cannot create invoice without order items' });
      return;
    }

    // Изчисли subtotal от OrderItems
    const subtotal = order.orderItems.reduce((sum: number, item: any) => {
      return sum + Number(item.totalPrice);
    }, 0);

    // Изчисли ДДС (ако tax не е подаден, по подразбиране 20%)
    const taxAmount = tax !== undefined ? tax : subtotal * DEFAULT_TAX_RATE;

    // Изчисли total
    const total = subtotal + taxAmount;

    // Генерирай invoice number
    const invoiceNumber = await generateInvoiceNumber(serviceCompany.id);

    // ТРАНЗАКЦИЯ - всичко или нищо!
    const result = await prisma.$transaction(async (tx) => {
      // Създай фактура
      const invoice = await tx.invoice.create({
        data: {
          invoiceNumber,
          subtotal,
          tax: taxAmount,
          total,
          notes,
          orderId,
          serviceCompanyId: order.serviceCompanyId,
        },
      });

      // Изпрати известие до клиента
      await tx.notification.create({
        data: {
          title: 'Нова фактура',
          message: `Фактура ${invoiceNumber} е готова. Сума: ${total.toFixed(
            2
          )} лв`,
          clientId: order.clientId,
        },
      });

      return invoice;
    });

    // Изпрати EMAIL до клиента (извън транзакцията)
    const client = await prisma.client.findUnique({
      where: { id: order.clientId },
      include: { user: true },
    });

    if (client?.user?.email) {
      try {
        await sendEmail(
          client.user.email,
          'Нова фактура',
          emailTemplates.invoiceReady(
            invoiceNumber,
            total,
            order.orderNumber
          )
        );
      } catch (emailError) {
        console.error('Failed to send email:', emailError);
      }
    }

    res.status(201).json({
      message: 'Invoice created successfully',
      invoice: result,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Get Invoice by Order ID
export const getInvoiceByOrderId = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { orderId } = req.params;

    const invoice = await prisma.invoice.findFirst({
      where: { orderId },
      include: {
        order: {
          include: {
            orderItems: true,
            vehicle: true,
            client: true,
          },
        },
      },
    });

    if (!invoice) {
      res.status(404).json({ message: 'Invoice not found' });
      return;
    }

    res.status(200).json({ invoice });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Get Invoice by ID
export const getInvoiceById = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        order: {
          include: {
            orderItems: true,
            vehicle: true,
            client: true,
            serviceCompany: true,
          },
        },
      },
    });

    if (!invoice) {
      res.status(404).json({ message: 'Invoice not found' });
      return;
    }

    res.status(200).json({ invoice });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Update Invoice
export const updateInvoice = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { tax, notes, dueDate } = req.body;

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        order: {
          include: {
            orderItems: true,
          },
        },
      },
    });

    if (!invoice) {
      res.status(404).json({ message: 'Invoice not found' });
      return;
    }

    // Изчисли отново subtotal
    const subtotal = invoice.order.orderItems.reduce((sum, item) => {
      return sum + Number(item.totalPrice);
    }, 0);

    // Изчисли ДДС
    const taxAmount = tax !== undefined ? tax : subtotal * DEFAULT_TAX_RATE;

    // Изчисли total
    const total = subtotal + taxAmount;

    const updatedInvoice = await prisma.invoice.update({
      where: { id },
      data: {
        subtotal,
        tax: taxAmount,
        total,
        notes,
        dueDate: dueDate ? new Date(dueDate) : undefined,
      },
    });

    res.status(200).json({
      message: 'Invoice updated successfully',
      invoice: updatedInvoice,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Mark Invoice as Paid (ADMIN маркира фактура като платена)
export const markInvoiceAsPaid = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const invoice = await prisma.invoice.findUnique({
      where: { id },
    });

    if (!invoice) {
      res.status(404).json({ message: 'Invoice not found' });
      return;
    }

    if (invoice.isPaid) {
      res.status(400).json({ message: 'Invoice is already paid' });
      return;
    }

    const updatedInvoice = await prisma.invoice.update({
      where: { id },
      data: {
        isPaid: true,
        paidDate: new Date(),
      },
    });

    res.status(200).json({
      message: 'Invoice marked as paid successfully',
      invoice: updatedInvoice,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Delete Invoice (само ADMIN)
export const deleteInvoice = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    await prisma.invoice.delete({
      where: { id },
    });

    res.status(200).json({
      message: 'Invoice deleted successfully',
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};
