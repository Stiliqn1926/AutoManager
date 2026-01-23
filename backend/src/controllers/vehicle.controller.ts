import { Request, Response } from 'express';
import prisma from '../config/database';
import { getPagination, getPaginationMeta } from '../utils/pagination';
import fs from 'fs';
import path from 'path';

interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Unknown error';
};

// Create Vehicle (ADMIN добавя автомобил към клиент)
export const createVehicle = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const {
      clientId,
      brand,
      model,
      year,
      licensePlate,
      vin,
      color,
      mileage,
    } = req.body;
    const userId = req.user!.userId;

    // Вземи serviceCompanyId на ADMIN
    const serviceCompany = await prisma.serviceCompany.findUnique({
      where: { userId },
    });

    if (!serviceCompany) {
      res.status(404).json({ message: 'Service company not found' });
      return;
    }

    // Провери дали клиентът принадлежи към този сервиз
    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        serviceCompanyId: serviceCompany.id,
      },
    });

    if (!client) {
      res
        .status(404)
        .json({ message: 'Client not found in your service company' });
      return;
    }

    // Създай автомобил
    const vehicle = await prisma.vehicle.create({
      data: {
        brand,
        model,
        year,
        licensePlate,
        vin,
        color,
        mileage,
        clientId,
        serviceCompanyId: serviceCompany.id,
      },
    });

    res.status(201).json({
      message: 'Vehicle created successfully',
      vehicle,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Get All Vehicles (за този сервиз)
export const getAllVehicles = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.userId;

    // Pagination
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const { skip, take } = getPagination(page, limit);

    const serviceCompany = await prisma.serviceCompany.findUnique({
      where: { userId },
    });

    if (!serviceCompany) {
      res.status(404).json({ message: 'Service company not found' });
      return;
    }

    const totalItems = await prisma.vehicle.count({
      where: { serviceCompanyId: serviceCompany.id },
    });

    const vehicles = await prisma.vehicle.findMany({
      where: { serviceCompanyId: serviceCompany.id },
      skip,
      take,
      include: {
        client: {
          select: {
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        _count: {
          select: {
            orders: true,
          },
        },
      },
    });

    const pagination = getPaginationMeta(totalItems, page, limit);

    res.status(200).json({ vehicles, pagination });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Get Vehicle by ID
export const getVehicleById = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    // Вземи serviceCompanyId
    const serviceCompany = await prisma.serviceCompany.findUnique({
      where: { userId },
    });

    if (!serviceCompany) {
      res.status(404).json({ message: 'Service company not found' });
      return;
    }

    const vehicle = await prisma.vehicle.findUnique({
      where: { id },
      include: {
        client: {
          include: {
            user: {
              select: {
                email: true,
              },
            },
          },
        },
        orders: {
          include: {
            orderItems: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!vehicle) {
      res.status(404).json({ message: 'Vehicle not found' });
      return;
    }

    // Провери ownership
    if (vehicle.serviceCompanyId !== serviceCompany.id) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }

    res.status(200).json({ vehicle });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Update Vehicle
export const updateVehicle = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      brand,
      model,
      year,
      licensePlate,
      vin,
      color,
      mileage,
      status,
    } = req.body;
    const userId = req.user!.userId;

    // Вземи serviceCompanyId
    const serviceCompany = await prisma.serviceCompany.findUnique({
      where: { userId },
    });

    if (!serviceCompany) {
      res.status(404).json({ message: 'Service company not found' });
      return;
    }

    // Провери ownership
    const vehicle = await prisma.vehicle.findUnique({
      where: { id },
    });

    if (!vehicle) {
      res.status(404).json({ message: 'Vehicle not found' });
      return;
    }

    if (vehicle.serviceCompanyId !== serviceCompany.id) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }

    const updatedVehicle = await prisma.vehicle.update({
      where: { id },
      data: {
        brand,
        model,
        ...(year !== undefined && { year }),
        licensePlate,
        ...(vin !== undefined && { vin: vin || null }),
        ...(color !== undefined && { color: color || null }),
        ...(mileage !== undefined && { mileage }),
        ...(status !== undefined && { status }),
      },
    });

    res.status(200).json({
      message: 'Vehicle updated successfully',
      vehicle: updatedVehicle,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Delete Vehicle (деактивира)
export const deleteVehicle = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    // Вземи serviceCompanyId
    const serviceCompany = await prisma.serviceCompany.findUnique({
      where: { userId },
    });

    if (!serviceCompany) {
      res.status(404).json({ message: 'Service company not found' });
      return;
    }

    // Провери ownership
    const vehicle = await prisma.vehicle.findUnique({
      where: { id },
    });

    if (!vehicle) {
      res.status(404).json({ message: 'Vehicle not found' });
      return;
    }

    if (vehicle.serviceCompanyId !== serviceCompany.id) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }

    // Провери дали има свързани поръчки
    const ordersCount = await prisma.order.count({
      where: { vehicleId: id },
    });

    if (ordersCount > 0) {
      res.status(400).json({
        message: `Не може да изтриете този автомобил, защото има ${ordersCount} свързани поръчки`,
        hasOrders: true,
        ordersCount,
      });
      return;
    }

    // Няма поръчки - изтрий напълно
    await prisma.vehicle.delete({
      where: { id },
    });

    res.status(200).json({
      message: 'Автомобилът е изтрит успешно',
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Upload Vehicle Image
export const uploadVehicleImage = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    if (!req.file) {
      res.status(400).json({ message: 'Няма качен файл' });
      return;
    }

    // Провери дали vehicle съществува и принадлежи на този сервиз
    const serviceCompany = await prisma.serviceCompany.findUnique({
      where: { userId },
    });

    if (!serviceCompany) {
      res.status(404).json({ message: 'Service company not found' });
      return;
    }

    const vehicle = await prisma.vehicle.findFirst({
      where: {
        id,
        serviceCompanyId: serviceCompany.id,
      },
    });

    if (!vehicle) {
      res.status(404).json({ message: 'Vehicle not found' });
      return;
    }

    // Генерирай URL към снимката
    const imageUrl = `/uploads/vehicles/${req.file.filename}`;

    // Note: Vehicle model doesn't have imageUrl field
    // Just return the uploaded file info
    res.status(200).json({
      message: 'Снимката е качена успешно',
      vehicle,
      imageUrl,
    });
  } catch (error: unknown) {
    res.status(500).json({ message: 'Грешка при качване на снимка', error: getErrorMessage(error) });
  }
};

// Delete Vehicle Image
export const deleteVehicleImage = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    const serviceCompany = await prisma.serviceCompany.findUnique({
      where: { userId },
    });

    if (!serviceCompany) {
      res.status(404).json({ message: 'Service company not found' });
      return;
    }

    const vehicle = await prisma.vehicle.findFirst({
      where: {
        id,
        serviceCompanyId: serviceCompany.id,
      },
    });

    if (!vehicle) {
      res.status(404).json({ message: 'Vehicle not found' });
      return;
    }

    // Note: Vehicle model doesn't have imageUrl field
    // This endpoint doesn't do anything currently
    res.status(200).json({
      message: 'Vehicle image deletion not supported (no imageUrl field in model)',
      vehicle,
    });
  } catch (error: unknown) {
    res.status(500).json({ message: 'Грешка при изтриване на снимка', error: getErrorMessage(error) });
  }
}; 

// ============================================
// GET MECHANIC VEHICLES (само автомобили с поръчки при механика)
// ============================================
export const getMechanicVehicles = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.userId;

    // Вземи worker профил
    const worker = await prisma.worker.findUnique({
      where: { userId },
    });

    if (!worker) {
      res.status(404).json({ message: 'Worker profile not found' });
      return;
    }

    // Параметри за търсене и филтриране
    const { search, activeOnly } = req.query;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    if (!worker.serviceCompanyId) {
      // Няма активен сервиз - върни празни данни вместо 400
      res.status(200).json({
        vehicles: [],
        pagination: { totalItems: 0, totalPages: 0, currentPage: page, itemsPerPage: limit },
      });
      return;
    }

    // Store serviceCompanyId in a local variable for TypeScript
    const serviceCompanyId = worker.serviceCompanyId;
    const { skip, take } = getPagination(page, limit);

    // Намери всички vehicleId-та от поръчки на механика
    const ordersByMechanic = await prisma.order.findMany({
      where: {
        workerId: worker.id,
        serviceCompanyId: serviceCompanyId,
      },
      select: {
        vehicleId: true,
      },
      distinct: ['vehicleId'],
    });

    const vehicleIds = ordersByMechanic.map(o => o.vehicleId);

    if (vehicleIds.length === 0) {
      res.status(200).json({
        vehicles: [],
        pagination: { totalItems: 0, totalPages: 0, currentPage: 1, itemsPerPage: limit },
      });
      return;
    }

    // Определи списъка с ID-та за филтриране
    let allowedVehicleIds: string[] = vehicleIds;

    // Филтър за активни поръчки - пресичане на ID-та
    if (activeOnly === 'true') {
      const vehiclesWithActiveOrders = await prisma.order.findMany({
        where: {
          workerId: worker.id,
          serviceCompanyId: serviceCompanyId,
          status: { in: ['WAITING', 'IN_PROGRESS', 'READY'] },
        },
        select: {
          vehicleId: true,
        },
        distinct: ['vehicleId'],
      });

      const activeVehicleIds = vehiclesWithActiveOrders.map(o => o.vehicleId);
      // Пресечи с вече намерените ID-та
      allowedVehicleIds = allowedVehicleIds.filter(id => activeVehicleIds.includes(id));
    }

    // Филтри за търсене
    const whereClause: any = {
      id: { in: allowedVehicleIds },
      serviceCompanyId: serviceCompanyId,
    };

    // Търсене по номер или марка/модел
    if (search) {
      whereClause.OR = [
        { licensePlate: { contains: search as string, mode: 'insensitive' } },
        { brand: { contains: search as string, mode: 'insensitive' } },
        { model: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const totalItems = await prisma.vehicle.count({ where: whereClause });

    const vehicles = await prisma.vehicle.findMany({
      where: whereClause,
      skip,
      take,
      include: {
        client: {
          select: {
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        orders: {
          where: {
            workerId: worker.id,
            serviceCompanyId: serviceCompanyId,
            status: { in: ['WAITING', 'IN_PROGRESS', 'READY'] },
          },
          select: {
            id: true,
            status: true,
            createdAt: true,
          },
        },
        _count: {
          select: {
            orders: true,
          },
        },
      },
      orderBy: {
        brand: 'asc',
      },
    });

    // Добави последна поръчка и статус
    const vehiclesWithStatus = await Promise.all(
      vehicles.map(async (vehicle) => {
        const lastOrder = await prisma.order.findFirst({
          where: {
            vehicleId: vehicle.id,
            workerId: worker.id,
            serviceCompanyId: serviceCompanyId,
          },
          orderBy: {
            createdAt: 'desc',
          },
          select: {
            createdAt: true,
          },
        });

        return {
          ...vehicle,
          hasActiveOrder: vehicle.orders.length > 0,
          activeOrdersCount: vehicle.orders.length,
          lastOrderDate: lastOrder?.createdAt || null,
        };
      })
    );

    const pagination = getPaginationMeta(totalItems, page, limit);

    res.status(200).json({ vehicles: vehiclesWithStatus, pagination });
  } catch (error) {
    console.error('Get mechanic vehicles error:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

// ============================================
// GET MECHANIC VEHICLE BY ID (само неговите поръчки)
// ============================================
export const getMechanicVehicleById = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    // Вземи worker профил
    const worker = await prisma.worker.findUnique({
      where: { userId },
    });

    if (!worker) {
      res.status(404).json({ message: 'Worker profile not found' });
      return;
    }

    if (!worker.serviceCompanyId) {
      res.status(400).json({ message: 'No active service company' });
      return;
    }

    // Store serviceCompanyId in a local variable for TypeScript
    const serviceCompanyId = worker.serviceCompanyId;

    // Провери дали автомобилът има поръчки при механика
    const hasOrders = await prisma.order.findFirst({
      where: {
        vehicleId: id,
        workerId: worker.id,
        serviceCompanyId: serviceCompanyId,
      },
    });

    if (!hasOrders) {
      res.status(403).json({ message: 'No access to this vehicle' });
      return;
    }

    const vehicle = await prisma.vehicle.findUnique({
      where: { id },
      include: {
        client: {
          include: {
            user: {
              select: {
                email: true,
              },
            },
          },
        },
        orders: {
          where: {
            workerId: worker.id,
          },
          include: {
            orderItems: {
              select: {
                id: true,
                type: true,
                description: true,
                quantity: true,
                unitPrice: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!vehicle) {
      res.status(404).json({ message: 'Vehicle not found' });
      return;
    }

    // Провери ownership
    if (vehicle.serviceCompanyId !== serviceCompanyId) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }

    res.status(200).json({ vehicle });
  } catch (error) {
    console.error('Get mechanic vehicle error:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};