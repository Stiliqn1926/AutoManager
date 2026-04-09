import { Request, Response } from 'express';
import prisma from '../config/database';
import { sendEmail, emailTemplates } from '../services/email.service';
// Environment constants
const DEFAULT_TAX_RATE = 0;

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


export const createInvoice = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { orderId } = req.params;
    const { notes } = req.body;
    const userId = req.user!.userId;


    const serviceCompany = await prisma.serviceCompany.findUnique({
      where: { userId },
    });

    if (!serviceCompany) {
      res.status(404).json({ message: 'Service company not found' });
      return;
    }


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
    if (order.serviceCompanyId !== serviceCompany.id) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }


    if (order.invoices && order.invoices.length > 0) {
      res
        .status(400)
        .json({ message: 'Invoice already exists for this order' });
      return;
    }


    if (!order.orderItems || order.orderItems.length === 0) {
      res
        .status(400)
        .json({ message: 'Cannot create invoice without order items' });
      return;
    }


    const subtotal = order.orderItems.reduce((sum: number, item: any) => {
      return sum + Number(item.totalPrice);
    }, 0);

    // No VAT
    const taxAmount = DEFAULT_TAX_RATE;
    const total = subtotal;


    const invoiceNumber = await generateInvoiceNumber(serviceCompany.id);


    const result = await prisma.$transaction(async (tx) => {

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


      await tx.notification.create({
        data: {
          title: 'ÐÐ¾Ð²Ð° Ñ„Ð°ÐºÑ‚ÑƒÑ€Ð°',
          message: `Ð¤Ð°ÐºÑ‚ÑƒÑ€Ð° ${invoiceNumber} Ðµ Ð³Ð¾Ñ‚Ð¾Ð²Ð°. Ð¡ÑƒÐ¼Ð°: ${total.toFixed(
            2
          )} â‚¬`,
          clientId: order.clientId,
        },
      });

      return invoice;
    });


    const client = await prisma.client.findUnique({
      where: { id: order.clientId },
      include: { user: true },
    });

    if (client?.user?.email) {
      void sendEmail(
          client.user.email,
          'ÐÐ¾Ð²Ð° Ñ„Ð°ÐºÑ‚ÑƒÑ€Ð°',
          emailTemplates.invoiceReady(
            invoiceNumber,
            total,
            order.orderNumber
          )
      ).catch((emailError) => {
        console.error('Failed to send email:', emailError);
      });
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
    const userId = req.user!.userId;
    const role = req.user!.role;

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
    if (role === 'ADMIN') {
      const serviceCompany = await prisma.serviceCompany.findUnique({
        where: { userId },
      });
      if (!serviceCompany) {
        res.status(404).json({ message: 'Service company not found' });
        return;
      }
      if (invoice.serviceCompanyId !== serviceCompany.id) {
        res.status(403).json({ message: 'Forbidden' });
        return;
      }
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
    const userId = req.user!.userId;
    const role = req.user!.role;

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
    if (role === 'ADMIN') {
      const serviceCompany = await prisma.serviceCompany.findUnique({
        where: { userId },
      });
      if (!serviceCompany) {
        res.status(404).json({ message: 'Service company not found' });
        return;
      }
      if (invoice.serviceCompanyId !== serviceCompany.id) {
        res.status(403).json({ message: 'Forbidden' });
        return;
      }
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
    const { notes, dueDate } = req.body;
    const userId = req.user!.userId;
    const role = req.user!.role;

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
    if (role === 'ADMIN') {
      const serviceCompany = await prisma.serviceCompany.findUnique({
        where: { userId },
      });
      if (!serviceCompany) {
        res.status(404).json({ message: 'Service company not found' });
        return;
      }
      if (invoice.serviceCompanyId !== serviceCompany.id) {
        res.status(403).json({ message: 'Forbidden' });
        return;
      }
    }


    const subtotal = invoice.order.orderItems.reduce((sum, item) => {
      return sum + Number(item.totalPrice);
    }, 0);

    // No VAT
    const taxAmount = DEFAULT_TAX_RATE;
    const total = subtotal;

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


export const markInvoiceAsPaid = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;
    const role = req.user!.role;

    const invoice = await prisma.invoice.findUnique({
      where: { id },
    });

    if (!invoice) {
      res.status(404).json({ message: 'Invoice not found' });
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
      if (invoice.serviceCompanyId !== serviceCompany.id) {
        res.status(403).json({ message: 'Forbidden' });
        return;
      }
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


export const deleteInvoice = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
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

      const invoice = await prisma.invoice.findUnique({ where: { id } });
      if (!invoice || invoice.serviceCompanyId !== serviceCompany.id) {
        res.status(404).json({ message: 'Invoice not found' });
        return;
      }
    }

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

