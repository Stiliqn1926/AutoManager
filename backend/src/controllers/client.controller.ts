import { Request, Response } from 'express';
import prisma from '../config/database';
import { getPagination, getPaginationMeta } from '../utils/pagination';

interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

// Create Client (ADMIN или MECHANIC добавя клиент)
export const createClient = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { firstName, lastName, phone, email, address } = req.body;
    const userId = req.user!.userId;

    // Вземи serviceCompanyId
    let serviceCompanyId: string;

    if (req.user!.role === 'ADMIN') {
      const serviceCompany = await prisma.serviceCompany.findUnique({
        where: { userId },
      });
      if (!serviceCompany) {
        res.status(404).json({ message: 'Service company not found' });
        return;
      }
      serviceCompanyId = serviceCompany.id;
    } else if (req.user!.role === 'MECHANIC') {
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
    } else {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }

    // Създай клиент
    const client = await prisma.client.create({
      data: {
        firstName,
        lastName,
        phone,
        email,
        address,
        serviceCompanyId,
      },
    });

    res.status(201).json({
      message: 'Client created successfully',
      client,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Get All Clients
export const getAllClients = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.userId;

    // Pagination
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const { skip, take } = getPagination(page, limit);

    // Search и filter параметри
    const { search, activeOnly } = req.query;

    // Вземи serviceCompanyId
    let serviceCompanyId: string;
    let workerId: string | null = null;

    if (req.user!.role === 'ADMIN') {
      const serviceCompany = await prisma.serviceCompany.findUnique({
        where: { userId },
      });
      if (!serviceCompany) {
        res.status(404).json({ message: 'Service company not found' });
        return;
      }
      serviceCompanyId = serviceCompany.id;
    } else if (req.user!.role === 'MECHANIC') {
      const worker = await prisma.worker.findUnique({
        where: { userId },
      });
      if (!worker) {
        res.status(404).json({ message: 'Worker profile not found' });
        return;
      }
      if (!worker.serviceCompanyId) {
        // Няма активен сервиз - върни празни данни вместо 403
        const pagination = getPaginationMeta(0, page, limit);
        res.status(200).json({ clients: [], pagination });
        return;
      }
      serviceCompanyId = worker.serviceCompanyId;
      workerId = worker.id;
    } else {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }

    // За механик - намери клиентите с поръчки при него
    let clientIdsForMechanic: string[] | null = null;
    if (req.user!.role === 'MECHANIC' && workerId) {
      const ordersForMechanic = await prisma.order.findMany({
        where: {
          workerId: workerId,
          serviceCompanyId: serviceCompanyId,
        },
        select: {
          clientId: true,
        },
        distinct: ['clientId'],
      });
      clientIdsForMechanic = ordersForMechanic.map(o => o.clientId);

      if (clientIdsForMechanic.length === 0) {
        const pagination = getPaginationMeta(0, page, limit);
        res.status(200).json({ clients: [], pagination });
        return;
      }
    }

    // За dashboard (без pagination) показваме само активни клиенти с userId
    // За пълния списък показваме всички
    const showOnlyActive = !req.query.page && !req.query.limit;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const whereClause: any = showOnlyActive
      ? {
          serviceCompanyId,
          userId: { not: null }, // Само клиенти с userId (не pending)
        }
      : { serviceCompanyId };

    // Определи списъка с ID-та за филтриране
    let allowedClientIds: string[] | null = clientIdsForMechanic;

    // Филтър за активни поръчки (само за механик) - пресичане на ID-та
    if (activeOnly === 'true' && workerId) {
      const clientsWithActiveOrders = await prisma.order.findMany({
        where: {
          workerId: workerId,
          serviceCompanyId: serviceCompanyId,
          status: { in: ['WAITING', 'IN_PROGRESS', 'READY'] },
        },
        select: {
          clientId: true,
        },
        distinct: ['clientId'],
      });

      const activeClientIds = clientsWithActiveOrders.map(o => o.clientId);

      // Пресечи с вече намерените ID-та ако има такива
      if (allowedClientIds) {
        allowedClientIds = allowedClientIds.filter(id => activeClientIds.includes(id));
      } else {
        allowedClientIds = activeClientIds;
      }
    }

    // Приложи филтъра по ID-та
    if (allowedClientIds) {
      whereClause.id = { in: allowedClientIds };
    }

    // Търсене по име или телефон
    if (search) {
      whereClause.OR = [
        { firstName: { contains: search as string, mode: 'insensitive' } },
        { lastName: { contains: search as string, mode: 'insensitive' } },
        { phone: { contains: search as string } },
      ];
    }

    const totalItems = await prisma.client.count({
      where: whereClause,
    });

    const clients = await prisma.client.findMany({
      where: whereClause,
      skip,
      take,
      include: {
        vehicles: {
          where: {
            serviceCompanyId: serviceCompanyId,
            deletedAt: null,
          },
        },
        orders: {
          where: {
            serviceCompanyId: serviceCompanyId,
            ...(workerId ? { workerId: workerId } : {}),
          },
        },
        user: {
          select: {
            email: true,
          },
        },
      },
    });

    // Добави _count и активни поръчки мануално от филтрираните масиви
    const clientIds = clients.map((client) => client.id);

    let activeOrderCountsByClient = new Map<string, number>();
    let lastOrderDateByClient = new Map<string, Date | null>();

    if (workerId && clientIds.length > 0) {
      const [activeOrderCounts, lastOrdersByClient] = await Promise.all([
        prisma.order.groupBy({
          by: ['clientId'],
          where: {
            clientId: { in: clientIds },
            workerId: workerId,
            serviceCompanyId: serviceCompanyId,
            status: { in: ['WAITING', 'IN_PROGRESS', 'READY'] },
          },
          _count: {
            _all: true,
          },
        }),
        prisma.order.groupBy({
          by: ['clientId'],
          where: {
            clientId: { in: clientIds },
            workerId: workerId,
            serviceCompanyId: serviceCompanyId,
          },
          _max: {
            createdAt: true,
          },
        }),
      ]);

      activeOrderCountsByClient = new Map(
        activeOrderCounts.map((row) => [row.clientId, row._count._all])
      );

      lastOrderDateByClient = new Map(
        lastOrdersByClient.map((row) => [row.clientId, row._max.createdAt ?? null])
      );
    }

    const clientsWithCount = clients.map((client) => ({
      ...client,
      _count: {
        vehicles: client.vehicles.length,
        orders: client.orders.length,
      },
      activeOrdersCount: workerId
        ? activeOrderCountsByClient.get(client.id) ?? 0
        : 0,
      lastOrderDate: workerId
        ? lastOrderDateByClient.get(client.id) ?? null
        : null,
    }));

    const pagination = getPaginationMeta(totalItems, page, limit);

    res.status(200).json({ clients: clientsWithCount, pagination });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Get Client by ID
export const getClientById = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    // Вземи serviceCompanyId
    let serviceCompanyId: string;
    let mechanicWorkerId: string | null = null;

    if (req.user!.role === 'ADMIN') {
      const serviceCompany = await prisma.serviceCompany.findUnique({
        where: { userId },
      });
      if (!serviceCompany) {
        res.status(404).json({ message: 'Service company not found' });
        return;
      }
      serviceCompanyId = serviceCompany.id;
    } else if (req.user!.role === 'MECHANIC') {
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
      mechanicWorkerId = worker.id;
    } else {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }

    const mechanicOrderFilter = mechanicWorkerId
      ? {
          OR: [
            { workerId: mechanicWorkerId },
            { schedules: { some: { workerId: mechanicWorkerId } } },
          ],
        }
      : null;

    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        vehicles: {
          where: {
            serviceCompanyId: serviceCompanyId,
            deletedAt: null,
            ...(mechanicOrderFilter && {
              orders: {
                some: {
                  serviceCompanyId: serviceCompanyId,
                  ...mechanicOrderFilter,
                },
              },
            }),
          },
          ...(mechanicOrderFilter && {
            include: {
              orders: {
                where: {
                  serviceCompanyId: serviceCompanyId,
                  ...mechanicOrderFilter,
                },
                select: {
                  id: true,
                  status: true,
                },
              },
            },
          }),
        },
        orders: {
          where: {
            serviceCompanyId: serviceCompanyId,
            ...(mechanicOrderFilter || {}),
          },
          include: {
            vehicle: {
              select: {
                id: true,
                brand: true,
                model: true,
                licensePlate: true,
              },
            },
          },
        },
        user: {
          select: {
            email: true,
          },
        },
      },
    });

    if (!client) {
      res.status(404).json({ message: 'Client not found' });
      return;
    }

    // Провери ownership
    if (client.serviceCompanyId !== serviceCompanyId) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }

    if (mechanicWorkerId && client.orders.length === 0) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }

    // Добави _count мануално от филтрираните масиви
    const clientWithCount = {
      ...client,
      _count: {
        vehicles: client.vehicles.length,
        orders: client.orders.length,
      },
    };

    res.status(200).json({ client: clientWithCount });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Update Client
export const updateClient = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { firstName, lastName, phone, email, address } = req.body;
    const userId = req.user!.userId;

    // Вземи serviceCompanyId
    let serviceCompanyId: string;

    if (req.user!.role === 'ADMIN') {
      const serviceCompany = await prisma.serviceCompany.findUnique({
        where: { userId },
      });
      if (!serviceCompany) {
        res.status(404).json({ message: 'Service company not found' });
        return;
      }
      serviceCompanyId = serviceCompany.id;
    } else if (req.user!.role === 'MECHANIC') {
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
    } else {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }

    // Провери ownership
    const client = await prisma.client.findUnique({
      where: { id },
    });

    if (!client) {
      res.status(404).json({ message: 'Client not found' });
      return;
    }

    if (client.serviceCompanyId !== serviceCompanyId) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }

    const updatedClient = await prisma.client.update({
      where: { id },
      data: {
        firstName,
        lastName,
        phone,
        email,
        address,
      },
    });

    res.status(200).json({
      message: 'Client updated successfully',
      client: updatedClient,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Delete Client (изтрива напълно само ако няма поръчки и автомобили)
export const deleteClient = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    // Само ADMIN може да изтрива клиенти
    if (req.user!.role !== 'ADMIN') {
      res.status(403).json({ message: 'Само администратори могат да изтриват клиенти' });
      return;
    }

    const serviceCompany = await prisma.serviceCompany.findUnique({
      where: { userId },
    });
    if (!serviceCompany) {
      res.status(404).json({ message: 'Service company not found' });
      return;
    }

    // Провери ownership и вземи броя на поръчки/автомобили
    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            vehicles: true,
            orders: true,
          },
        },
      },
    });

    if (!client) {
      res.status(404).json({ message: 'Client not found' });
      return;
    }

    if (client.serviceCompanyId !== serviceCompany.id) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }

    // Провери дали има поръчки или автомобили
    if (client._count.vehicles > 0 || client._count.orders > 0) {
      res.status(400).json({
        message: 'Не може да изтриете клиент с поръчки или автомобили. Деактивирайте го вместо това.'
      });
      return;
    }

    // Изтрий клиента напълно
    await prisma.client.delete({
      where: { id },
    });

    res.status(200).json({
      message: 'Клиентът е изтрит успешно',
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Toggle Client Active Status
export const toggleClientActive = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    // Само ADMIN може да toggle-ва
    const serviceCompany = await prisma.serviceCompany.findUnique({
      where: { userId },
    });

    if (!serviceCompany) {
      res.status(404).json({ message: 'Service company not found' });
      return;
    }

    // Провери ownership
    const client = await prisma.client.findUnique({
      where: { id },
    });

    if (!client) {
      res.status(404).json({ message: 'Client not found' });
      return;
    }

    if (client.serviceCompanyId !== serviceCompany.id) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }

    const updatedClient = await prisma.client.update({
      where: { id },
      data: { isActive: !client.isActive },
    });

    res.status(200).json({
      message: 'Client status updated successfully',
      client: updatedClient,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// 🆕 Добави се към сервиз (чрез uniqueCode)
export const addToService = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { uniqueCode, firstName, lastName, phone, address } = req.body;

    // Намери сервиза по код
    const serviceCompany = await prisma.serviceCompany.findUnique({
      where: { uniqueCode },
    });

    if (!serviceCompany) {
      res.status(404).json({ message: 'Невалиден код на сервиз' });
      return;
    }

    // Провери дали вече не е добавен
    const existingClient = await prisma.client.findFirst({
      where: {
        userId,
        serviceCompanyId: serviceCompany.id,
      },
    });

    if (existingClient) {
      res.status(400).json({ message: 'Вече сте добавен към този сервиз' });
      return;
    }

    // Вземи User email
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    // Създай нов Client профил
    const newClient = await prisma.client.create({
      data: {
        userId,
        serviceCompanyId: serviceCompany.id,
        firstName,
        lastName,
        phone,
        email: user?.email,
        address,
      },
      include: {
        serviceCompany: true,
      },
    });

    res.status(201).json({
      message: 'Успешно се добавихте към сервиза',
      client: newClient,
    });
  } catch (error) {
    res.status(500).json({ message: 'Грешка при добавяне към сервиз', error });
  }
};