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

// ============================================
// GET DASHBOARD OVERVIEW (ADMIN)
// ============================================
export const getDashboardOverview = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const serviceCompanyId = req.user?.serviceCompanyId;

    if (!serviceCompanyId) {
      res.status(403).json({ message: 'Service company not found' });
      return;
    }

    const now = new Date();

    // Паралелно зареждане на всички данни
    const [
      totalOrders,
      activeOrders,
      completedOrders,
      financeIncome,
      financeExpenses,
      totalClients,
      totalWorkers,
      pendingRequests,
      recentOrders,
      todaySchedules,
    ] = await Promise.all([
      // Orders stats
      prisma.order.count({ where: { serviceCompanyId } }),
      prisma.order.count({
        where: { serviceCompanyId, status: { in: ['WAITING', 'IN_PROGRESS', 'READY'] } },
      }),
      prisma.order.findMany({
        where: { serviceCompanyId, status: 'COMPLETED' },
        select: { totalPrice: true },
      }),

      // Finance
      prisma.finance.findMany({
        where: { serviceCompanyId, type: 'INCOME' },
        select: { amount: true },
      }),
      prisma.finance.findMany({
        where: { serviceCompanyId, type: 'EXPENSE' },
        select: { amount: true },
      }),

      // Clients & Workers
      prisma.client.count({ where: { serviceCompanyId } }),
      // ✅ ПОПРАВКА: Брой механици с ACTIVE membership (не директно по serviceCompanyId)
      prisma.mechanicServiceCompany.count({
        where: {
          serviceCompanyId,
          status: 'ACTIVE',
          worker: {
            deletedAt: null,
            isActive: true,
          },
        },
      }),

      // Pending requests
      prisma.pendingRequest.count({
        where: { serviceCompanyId, status: 'PENDING' },
      }),

      // Recent orders (за списък)
      prisma.order.findMany({
        where: { serviceCompanyId, status: { in: ['WAITING', 'IN_PROGRESS', 'READY'] } },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          vehicle: { select: { brand: true, model: true, licensePlate: true } },
          client: { select: { firstName: true, lastName: true } },
        },
      }),

      // Today's active schedules ONLY - само активни статуси
      prisma.schedule.findMany({
        where: {
          serviceCompanyId,
          status: { in: ['SCHEDULED', 'IN_PROGRESS'] }, // ✅ САМО активни графици
          startTime: { lte: now },
          endTime: { gt: now },
        },
        include: {
          worker: { select: { firstName: true, lastName: true } },
          order: {
            select: {
              status: true,
              orderNumber: true,
            }
          },
        },
      }),
    ]);

    // Calculate revenue
    const orderRevenue = completedOrders.reduce((sum, order) => {
      return sum + Number(order.totalPrice || 0);
    }, 0);
    const otherIncome = financeIncome.reduce((sum, f) => sum + Number(f.amount), 0);
    const totalRevenue = orderRevenue + otherIncome;
    const totalExpenses = financeExpenses.reduce((sum, f) => sum + Number(f.amount), 0);

    // ✅ Филтрирай графици - само онези без поръчка ИЛИ с активна поръчка
    const activeSchedules = todaySchedules.filter(schedule => {
      // Ако няма свързана поръчка, това е самостоятелна задача - покажи я
      if (!schedule.order) return true;

      // Ако има поръчка, покажи само ако е активна (не COMPLETED/CANCELLED)
      return ['WAITING', 'IN_PROGRESS', 'READY'].includes(schedule.order.status);
    });

    res.status(200).json({
      stats: {
        totalOrders,
        activeOrders,
        totalRevenue: Number(totalRevenue.toFixed(2)),
        totalExpenses: Number(totalExpenses.toFixed(2)),
        totalClients,
        totalWorkers,
        pendingRequests,
      },
      recentOrders,
      todaySchedules: activeSchedules,
    });
  } catch (error) {
    console.error('Dashboard overview error:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

// ============================================
// GET FINANCE CHART DATA (ADMIN) - МЕСЕЧНИ ДАННИ
// ============================================
export const getFinanceChartData = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const serviceCompanyId = req.user?.serviceCompanyId;
    const { period = 'year' } = req.query;

    if (!serviceCompanyId) {
      res.status(403).json({ message: 'Service company not found' });
      return;
    }

    const now = new Date();
    let startDate = new Date();
    let monthsToShow = 12;
    let daysToShow = 0;

    if (period === 'week') {
      startDate.setDate(now.getDate() - 6); // Последните 7 дни (включително днес)
      daysToShow = 7;
    } else if (period === 'month') {
      startDate.setMonth(now.getMonth() - 1);
      monthsToShow = 2;
    } else if (period === 'quarter') {
      startDate.setMonth(now.getMonth() - 3);
      monthsToShow = 4;
    } else if (period === 'semester') {
      startDate.setMonth(now.getMonth() - 6);
      monthsToShow = 7;
    } else {
      startDate.setMonth(now.getMonth() - 11);
      monthsToShow = 12;
    }

    const completedOrders = await prisma.order.findMany({
      where: {
        serviceCompanyId,
        status: 'COMPLETED',
        completedDate: {
          gte: startDate,
        },
      },
      select: {
        completedDate: true,
        totalPrice: true,
      },
    });

    // ОТ ПЛАТЕНИ ФАКТУРИ
    const paidInvoices = await prisma.invoice.findMany({
      where: {
        serviceCompanyId,
        isPaid: true,
        paidDate: {
          gte: startDate,
        },
      },
      select: {
        paidDate: true,
        total: true,
      },
    });

    const finances = await prisma.finance.findMany({
      where: {
        serviceCompanyId,
        date: {
          gte: startDate,
        },
      },
      select: {
        date: true,
        type: true,
        amount: true,
      },
    });

    const formatMonth = (date: Date): string => {
      const months = [
        'Яну', 'Фев', 'Мар', 'Апр', 'Май', 'Юни',
        'Юли', 'Авг', 'Сеп', 'Окт', 'Ное', 'Дек',
      ];
      return `${months[date.getMonth()]} ${date.getFullYear()}`;
    };

    const formatDay = (date: Date): string => {
      const day = date.getDate();
      const month = date.getMonth() + 1;
      return `${day}/${month}`;
    };

    const chartData: { month: string; income: number; expense: number }[] = [];

    if (period === 'week') {
      // Generate daily data for week
      for (let i = 0; i < daysToShow; i++) {
        const d = new Date(startDate);
        d.setDate(startDate.getDate() + i);
        chartData.push({
          month: formatDay(d),
          income: 0,
          expense: 0,
        });
      }

      completedOrders.forEach(order => {
        if (order.completedDate) {
          const key = formatDay(new Date(order.completedDate));
          const row = chartData.find(m => m.month === key);
          if (row) {
            row.income += Number(order.totalPrice || 0);
          }
        }
      });

      paidInvoices.forEach(invoice => {
        if (invoice.paidDate) {
          const key = formatDay(new Date(invoice.paidDate));
          const row = chartData.find(m => m.month === key);
          if (row) {
            row.income += Number(invoice.total || 0);
          }
        }
      });

      finances.forEach(finance => {
        const key = formatDay(new Date(finance.date));
        const row = chartData.find(m => m.month === key);
        if (row) {
          if (finance.type === 'INCOME') {
            row.income += Number(finance.amount);
          } else {
            row.expense += Number(finance.amount);
          }
        }
      });
    } else {
      // Generate monthly data for other periods
      for (let i = 0; i < monthsToShow; i++) {
        const d = new Date(startDate);
        d.setMonth(startDate.getMonth() + i);
        chartData.push({
          month: formatMonth(d),
          income: 0,
          expense: 0,
        });
      }

      completedOrders.forEach(order => {
        if (order.completedDate) {
          const key = formatMonth(new Date(order.completedDate));
          const row = chartData.find(m => m.month === key);
          if (row) {
            row.income += Number(order.totalPrice || 0);
          }
        }
      });

      paidInvoices.forEach(invoice => {
        if (invoice.paidDate) {
          const key = formatMonth(new Date(invoice.paidDate));
          const row = chartData.find(m => m.month === key);
          if (row) {
            row.income += Number(invoice.total || 0);
          }
        }
      });

      finances.forEach(finance => {
        const key = formatMonth(new Date(finance.date));
        const row = chartData.find(m => m.month === key);
        if (row) {
          if (finance.type === 'INCOME') {
            row.income += Number(finance.amount);
          } else {
            row.expense += Number(finance.amount);
          }
        }
      });
    }

    chartData.forEach(row => {
      row.income = Number(row.income.toFixed(2));
      row.expense = Number(row.expense.toFixed(2));
    });

    res.status(200).json({ monthlyData: chartData });
  } catch (error) {
    console.error('Finance chart error:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

// ============================================
// GET MECHANIC DASHBOARD (MECHANIC)
// ============================================
export const getMechanicDashboard = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;

    const worker = await prisma.worker.findUnique({
      where: { userId },
    });

    if (!worker) {
      res.status(404).json({ message: 'Worker profile not found' });
      return;
    }

    // ✅ КРИТИЧНА ПРОВЕРКА: Провери дали има ACTIVE membership
    // Не е достатъчно само worker.serviceCompanyId - трябва и ACTIVE membership!
    let activeMembership = null;

    if (worker.serviceCompanyId) {
      activeMembership = await prisma.mechanicServiceCompany.findFirst({
        where: {
          workerId: worker.id,
          serviceCompanyId: worker.serviceCompanyId,
          status: 'ACTIVE',
        },
      });
    }

    // Ако няма ACTIVE membership ИЛИ worker.isActive = false → върни празна статистика
    if (!activeMembership || !worker.isActive) {
      // Няма активен сервиз или не е одобрен - върни празна статистика за onboarding UI
      res.status(200).json({
        worker: {
          id: worker.id,
          name: `${worker.firstName} ${worker.lastName}`,
          specialization: worker.specialization,
          isActive: worker.isActive,
        },
        hasActiveService: false,
        statistics: {
          totalOrders: 0,
          completedOrders: 0,
          activeOrders: 0,
          todayTasks: 0,
        },
        activeOrders: [],
        todaySchedule: [],
        upcomingSchedule: [],
      });
      return;
    }

    // ✅ Вземи serviceCompanyId от activeMembership (не от worker, защото може да е null)
    const activeServiceCompanyId = activeMembership.serviceCompanyId;

    const now = new Date();
    const todayStart = new Date(now.setHours(0, 0, 0, 0));
    const todayEnd = new Date(now.setHours(23, 59, 59, 999));

    // Паралелно зареждане
    const [
      myOrders,
      todaySchedule,
      upcomingSchedule,
      totalOrders,
      completedOrders,
    ] = await Promise.all([
      // Активни поръчки
      prisma.order.findMany({
        where: {
          workerId: worker.id,
          serviceCompanyId: activeServiceCompanyId,
          status: { in: ['WAITING', 'IN_PROGRESS', 'READY'] },
        },
        select: {
          id: true,
          orderNumber: true,
          status: true,
          priority: true,
          description: true,
          createdAt: true,
          client: {
            select: {
              firstName: true,
              lastName: true,
              phone: true,
            },
          },
          vehicle: {
            select: {
              brand: true,
              model: true,
              licensePlate: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),

      // Днешен график
      prisma.schedule.findMany({
        where: {
          workerId: worker.id,
          serviceCompanyId: activeServiceCompanyId,
          startTime: {
            gte: todayStart,
            lte: todayEnd,
          },
          status: { in: ['SCHEDULED', 'IN_PROGRESS'] },
        },
        include: {
          order: {
            select: {
              orderNumber: true,
              status: true,
            },
          },
        },
        orderBy: {
          startTime: 'asc',
        },
      }),

      // Предстоящи задачи (без днешните)
      prisma.schedule.findMany({
        where: {
          workerId: worker.id,
          serviceCompanyId: activeServiceCompanyId,
          startTime: {
            gt: todayEnd,
          },
          status: { in: ['SCHEDULED', 'IN_PROGRESS'] },
        },
        include: {
          order: {
            select: {
              orderNumber: true,
              status: true,
            },
          },
        },
        orderBy: {
          startTime: 'asc',
        },
        take: 10,
      }),

      // Статистики
      prisma.order.count({
        where: {
          workerId: worker.id,
          serviceCompanyId: activeServiceCompanyId,
        },
      }),

      prisma.order.count({
        where: {
          workerId: worker.id,
          serviceCompanyId: activeServiceCompanyId,
          status: 'COMPLETED',
        },
      }),
    ]);

    res.status(200).json({
      worker: {
        id: worker.id,
        name: `${worker.firstName} ${worker.lastName}`,
        specialization: worker.specialization,
        isActive: worker.isActive, // ✅ Винаги true тук, но добавено за консистентност
      },
      hasActiveService: true,
      statistics: {
        totalOrders,
        completedOrders,
        activeOrders: myOrders.length,
        todayTasks: todaySchedule.length,
      },
      activeOrders: myOrders,
      todaySchedule,
      upcomingSchedule,
    });
  } catch (error) {
    console.error('Mechanic dashboard error:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};