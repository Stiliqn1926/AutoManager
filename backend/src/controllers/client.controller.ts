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
        // Няма активен сервиз - върни празни данни вместо 403
        const pagination = getPaginationMeta(0, page, limit);
        res.status(200).json({ clients: [], pagination });
        return;
      }
      serviceCompanyId = worker.serviceCompanyId;
    } else {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }

    // За dashboard (без pagination) показваме само активни клиенти с userId
    // За пълния списък показваме всички
    const showOnlyActive = !req.query.page && !req.query.limit;

    const whereClause = showOnlyActive
      ? {
          serviceCompanyId,
          userId: { not: null }, // Само клиенти с userId (не pending)
        }
      : { serviceCompanyId };

    const totalItems = await prisma.client.count({
      where: whereClause,
    });

    const clients = await prisma.client.findMany({
      where: whereClause,
      skip,
      take,
      include: {
        vehicles: true,
        user: {
          select: {
            email: true,
          },
        },
        _count: {
          select: {
            vehicles: true,
            orders: true,
          },
        },
      },
    });

    const pagination = getPaginationMeta(totalItems, page, limit);

    res.status(200).json({ clients, pagination });
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

    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        vehicles: true,
        orders: true,
        user: {
          select: {
            email: true,
          },
        },
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

    // Провери ownership
    if (client.serviceCompanyId !== serviceCompanyId) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }

    res.status(200).json({ client });
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

// Delete Client (деактивира)
export const deleteClient = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
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
      data: { isActive: false },
    });

    res.status(200).json({
      message: 'Client deactivated successfully',
      client: updatedClient,
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