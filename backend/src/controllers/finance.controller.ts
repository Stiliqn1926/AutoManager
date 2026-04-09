import { Request, Response } from 'express';
import prisma from '../config/database';
import { getPagination, getPaginationMeta } from '../utils/pagination';
import logger from '../services/logger.service';

// ============================================
// AUTH REQUEST INTERFACE
// ============================================
interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
    serviceCompanyId?: string;
    workerId?: string;
    clientId?: string;
  };
}

// ============================================
// CREATE FINANCE TRANSACTION
// ============================================
export const createFinance = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { type, category, amount, description, date } = req.body;
    const serviceCompanyId = req.user?.serviceCompanyId;

    if (!serviceCompanyId) {
      res.status(403).json({ message: 'ÐÑÐ¼Ð°Ñ‚Ðµ Ð´Ð¾ÑÑ‚ÑŠÐ¿ Ð´Ð¾ Ñ‚Ð¾Ð·Ð¸ Ñ€ÐµÑÑƒÑ€Ñ' });
      return;
    }

    const finance = await prisma.finance.create({
      data: {
        type,
        category,
        amount,
        description,
        date: date ? new Date(date) : new Date(),
        serviceCompanyId,
      },
    });

    logger.info(`Finance transaction created: ${finance.id} (${type})`);

    res.status(201).json({
      message: 'Ð¢Ñ€Ð°Ð½Ð·Ð°ÐºÑ†Ð¸ÑÑ‚Ð° Ðµ Ð´Ð¾Ð±Ð°Ð²ÐµÐ½Ð° ÑƒÑÐ¿ÐµÑˆÐ½Ð¾',
      finance,
    });
  } catch (error: unknown) {
    logger.error('Error creating finance:', error);
    res.status(500).json({ message: 'Ð“Ñ€ÐµÑˆÐºÐ° Ð¿Ñ€Ð¸ ÑÑŠÐ·Ð´Ð°Ð²Ð°Ð½Ðµ Ð½Ð° Ñ‚Ñ€Ð°Ð½Ð·Ð°ÐºÑ†Ð¸Ñ' });
  }
};

// ============================================
// GET ALL FINANCE TRANSACTIONS (filters + pagination)
// ============================================
export const getAllFinances = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const serviceCompanyId = req.user?.serviceCompanyId;
    const validatedQuery = (req as any).validatedQuery || req.query;
    const { type, category, startDate, endDate, page = 1, limit = 20 } =
      validatedQuery;

    if (!serviceCompanyId) {
      res.status(403).json({ message: 'ÐÑÐ¼Ð°Ñ‚Ðµ Ð´Ð¾ÑÑ‚ÑŠÐ¿ Ð´Ð¾ Ñ‚Ð¾Ð·Ð¸ Ñ€ÐµÑÑƒÑ€Ñ' });
      return;
    }

    const where: any = { serviceCompanyId };

    if (type) where.type = type;
    if (category) where.category = category;

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate as string);
      if (endDate) where.date.lte = new Date(endDate as string);
    }

    const { skip, take } = getPagination(Number(page), Number(limit));

    const [finances, total] = await Promise.all([
      prisma.finance.findMany({
        where,
        skip,
        take,
        orderBy: { date: 'desc' },
      }),
      prisma.finance.count({ where }),
    ]);

    const pagination = getPaginationMeta(total, Number(page), Number(limit));

    res.status(200).json({
      finances,
      pagination,
    });
  } catch (error: unknown) {
    logger.error('Error fetching finances:', error);
    res.status(500).json({ message: 'Ð“Ñ€ÐµÑˆÐºÐ° Ð¿Ñ€Ð¸ Ð·Ð°Ñ€ÐµÐ¶Ð´Ð°Ð½Ðµ Ð½Ð° Ñ‚Ñ€Ð°Ð½Ð·Ð°ÐºÑ†Ð¸Ð¸Ñ‚Ðµ' });
  }
};

// ============================================
// GET FINANCE SUMMARY (ORDERS + MANUAL FINANCE)
// ============================================
export const getFinanceSummary = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const serviceCompanyId = req.user?.serviceCompanyId;
    const { startDate, endDate } = req.query;

    if (!serviceCompanyId) {
      res.status(403).json({ message: 'ÐÑÐ¼Ð°Ñ‚Ðµ Ð´Ð¾ÑÑ‚ÑŠÐ¿ Ð´Ð¾ Ñ‚Ð¾Ð·Ð¸ Ñ€ÐµÑÑƒÑ€Ñ' });
      return;
    }

    const dateFilter: any = {};
    if (startDate || endDate) {
      if (startDate) dateFilter.gte = new Date(startDate as string);
      if (endDate) dateFilter.lte = new Date(endDate as string);
    }


    const paidInvoices = await prisma.invoice.findMany({
      where: {
        serviceCompanyId,
        isPaid: true,
        ...(Object.keys(dateFilter).length > 0 && {
          paidDate: dateFilter,
        }),
      },
      select: {
        total: true,
      },
    });

    const orderRevenue = paidInvoices.reduce(
      (sum, invoice) => sum + Number(invoice.total || 0),
      0
    );


    const finances = await prisma.finance.findMany({
      where: {
        serviceCompanyId,
        ...(Object.keys(dateFilter).length > 0 && { date: dateFilter }),
      },
      select: {
        type: true,
        amount: true,
      },
    });

    let otherIncome = 0;
    let totalExpense = 0;

    finances.forEach((finance) => {
      const amount = Number(finance.amount);
      if (finance.type === 'INCOME') {
        otherIncome += amount;
      } else {
        totalExpense += amount;
      }
    });

    const totalIncome = orderRevenue + otherIncome;
    const profit = totalIncome - totalExpense;


    const paidOrdersCount = await prisma.invoice.count({
      where: {
        serviceCompanyId,
        isPaid: true,
      },
    });


    const unpaidOrdersCount = await prisma.order.count({
      where: {
        serviceCompanyId,
        invoices: {
          none: {
            isPaid: true,
          },
        },
      },
    });

    res.status(200).json({
      summary: {
        orderRevenue: orderRevenue.toFixed(2),
        otherIncome: otherIncome.toFixed(2),
        totalIncome: totalIncome.toFixed(2),
        totalExpense: totalExpense.toFixed(2),
        profit: profit.toFixed(2),
        paidOrdersCount,
        unpaidOrdersCount,
      },
    });
  } catch (error: unknown) {
    logger.error('Error fetching finance summary:', error);
    res.status(500).json({ message: 'Ð“Ñ€ÐµÑˆÐºÐ° Ð¿Ñ€Ð¸ Ð¸Ð·Ñ‡Ð¸ÑÐ»ÑÐ²Ð°Ð½Ðµ Ð½Ð° Ð¾Ð±Ð¾Ð±Ñ‰ÐµÐ½Ð¸ÐµÑ‚Ð¾' });
  }
};

// ============================================
// GET FINANCE BY ID
// ============================================
export const getFinanceById = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const serviceCompanyId = req.user?.serviceCompanyId;

    const finance = await prisma.finance.findFirst({
      where: { id, serviceCompanyId },
    });

    if (!finance) {
      res.status(404).json({ message: 'Ð¢Ñ€Ð°Ð½Ð·Ð°ÐºÑ†Ð¸ÑÑ‚Ð° Ð½Ðµ Ðµ Ð½Ð°Ð¼ÐµÑ€ÐµÐ½Ð°' });
      return;
    }

    res.status(200).json({ finance });
  } catch (error: unknown) {
    logger.error('Error fetching finance by ID:', error);
    res.status(500).json({ message: 'Ð“Ñ€ÐµÑˆÐºÐ° Ð¿Ñ€Ð¸ Ð·Ð°Ñ€ÐµÐ¶Ð´Ð°Ð½Ðµ Ð½Ð° Ñ‚Ñ€Ð°Ð½Ð·Ð°ÐºÑ†Ð¸ÑÑ‚Ð°' });
  }
};

// ============================================
// UPDATE FINANCE
// ============================================
export const updateFinance = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { type, category, amount, description, date } = req.body;
    const serviceCompanyId = req.user?.serviceCompanyId;

    const finance = await prisma.finance.findFirst({
      where: { id, serviceCompanyId },
    });

    if (!finance) {
      res.status(404).json({ message: 'Ð¢Ñ€Ð°Ð½Ð·Ð°ÐºÑ†Ð¸ÑÑ‚Ð° Ð½Ðµ Ðµ Ð½Ð°Ð¼ÐµÑ€ÐµÐ½Ð°' });
      return;
    }

    const updatedFinance = await prisma.finance.update({
      where: { id },
      data: {
        type,
        category,
        amount,
        description,
        date: date ? new Date(date) : finance.date,
      },
    });

    logger.info(`Finance updated: ${id}`);

    res.status(200).json({
      message: 'Ð¢Ñ€Ð°Ð½Ð·Ð°ÐºÑ†Ð¸ÑÑ‚Ð° Ðµ Ð°ÐºÑ‚ÑƒÐ°Ð»Ð¸Ð·Ð¸Ñ€Ð°Ð½Ð° ÑƒÑÐ¿ÐµÑˆÐ½Ð¾',
      finance: updatedFinance,
    });
  } catch (error: unknown) {
    logger.error('Error updating finance:', error);
    res.status(500).json({ message: 'Ð“Ñ€ÐµÑˆÐºÐ° Ð¿Ñ€Ð¸ Ð°ÐºÑ‚ÑƒÐ°Ð»Ð¸Ð·Ð¸Ñ€Ð°Ð½Ðµ Ð½Ð° Ñ‚Ñ€Ð°Ð½Ð·Ð°ÐºÑ†Ð¸ÑÑ‚Ð°' });
  }
};

// ============================================
// DELETE FINANCE
// ============================================
export const deleteFinance = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const serviceCompanyId = req.user?.serviceCompanyId;

    const finance = await prisma.finance.findFirst({
      where: { id, serviceCompanyId },
    });

    if (!finance) {
      res.status(404).json({ message: 'Ð¢Ñ€Ð°Ð½Ð·Ð°ÐºÑ†Ð¸ÑÑ‚Ð° Ð½Ðµ Ðµ Ð½Ð°Ð¼ÐµÑ€ÐµÐ½Ð°' });
      return;
    }

    await prisma.finance.delete({ where: { id } });

    logger.info(`Finance deleted: ${id}`);

    res.status(200).json({ message: 'Ð¢Ñ€Ð°Ð½Ð·Ð°ÐºÑ†Ð¸ÑÑ‚Ð° Ðµ Ð¸Ð·Ñ‚Ñ€Ð¸Ñ‚Ð° ÑƒÑÐ¿ÐµÑˆÐ½Ð¾' });
  } catch (error: unknown) {
    logger.error('Error deleting finance:', error);
    res.status(500).json({ message: 'Ð“Ñ€ÐµÑˆÐºÐ° Ð¿Ñ€Ð¸ Ð¸Ð·Ñ‚Ñ€Ð¸Ð²Ð°Ð½Ðµ Ð½Ð° Ñ‚Ñ€Ð°Ð½Ð·Ð°ÐºÑ†Ð¸ÑÑ‚Ð°' });
  }
};


