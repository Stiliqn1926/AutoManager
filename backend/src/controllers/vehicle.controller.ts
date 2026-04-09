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

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Unknown error';
};


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


    const serviceCompany = await prisma.serviceCompany.findUnique({
      where: { userId },
    });

    if (!serviceCompany) {
      res.status(404).json({ message: 'Service company not found' });
      return;
    }


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
    if (!client.isActive) {
      res.status(400).json({ message: 'Client is inactive' });
      return;
    }


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

    const clientId = req.query.clientId as string | undefined;

    const whereClause: { serviceCompanyId: string; clientId?: string } = {
      serviceCompanyId: serviceCompany.id,
      ...(clientId ? { clientId } : {}),
    };

    const totalItems = await prisma.vehicle.count({
      where: whereClause,
    });

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
    } = req.body;
    const userId = req.user!.userId;


    const serviceCompany = await prisma.serviceCompany.findUnique({
      where: { userId },
    });

    if (!serviceCompany) {
      res.status(404).json({ message: 'Service company not found' });
      return;
    }


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


export const deleteVehicle = async (
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


    const ordersCount = await prisma.order.count({
      where: { vehicleId: id },
    });

    if (ordersCount > 0) {
      res.status(400).json({
        message: `ÐÐµ Ð¼Ð¾Ð¶Ðµ Ð´Ð° Ð¸Ð·Ñ‚Ñ€Ð¸ÐµÑ‚Ðµ Ñ‚Ð¾Ð·Ð¸ Ð°Ð²Ñ‚Ð¾Ð¼Ð¾Ð±Ð¸Ð», Ð·Ð°Ñ‰Ð¾Ñ‚Ð¾ Ð¸Ð¼Ð° ${ordersCount} ÑÐ²ÑŠÑ€Ð·Ð°Ð½Ð¸ Ð¿Ð¾Ñ€ÑŠÑ‡ÐºÐ¸`,
        hasOrders: true,
        ordersCount,
      });
      return;
    }


    await prisma.vehicle.delete({
      where: { id },
    });

    res.status(200).json({
      message: 'ÐÐ²Ñ‚Ð¾Ð¼Ð¾Ð±Ð¸Ð»ÑŠÑ‚ Ðµ Ð¸Ð·Ñ‚Ñ€Ð¸Ñ‚ ÑƒÑÐ¿ÐµÑˆÐ½Ð¾',
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// ============================================

// ============================================
export const getMechanicVehicles = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.userId;


    const worker = await prisma.worker.findUnique({
      where: { userId },
    });

    if (!worker) {
      res.status(404).json({ message: 'Worker profile not found' });
      return;
    }


    const { search, activeOnly } = req.query;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    if (!worker.serviceCompanyId) {

      res.status(200).json({
        vehicles: [],
        pagination: { totalItems: 0, totalPages: 0, currentPage: page, itemsPerPage: limit },
      });
      return;
    }

    // Store serviceCompanyId in a local variable for TypeScript
    const serviceCompanyId = worker.serviceCompanyId;
    const { skip, take } = getPagination(page, limit);


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


    let allowedVehicleIds: string[] = vehicleIds;


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

      allowedVehicleIds = allowedVehicleIds.filter(id => activeVehicleIds.includes(id));
    }


    const whereClause: any = {
      id: { in: allowedVehicleIds },
      serviceCompanyId: serviceCompanyId,
    };


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


    const vehicleIdsOnPage = vehicles.map((vehicle) => vehicle.id);

    let lastOrderDateByVehicle = new Map<string, Date | null>();

    if (vehicleIdsOnPage.length > 0) {
      const lastOrdersByVehicle = await prisma.order.groupBy({
        by: ['vehicleId'],
        where: {
          vehicleId: { in: vehicleIdsOnPage },
          workerId: worker.id,
          serviceCompanyId: serviceCompanyId,
        },
        _max: {
          createdAt: true,
        },
      });

      lastOrderDateByVehicle = new Map(
        lastOrdersByVehicle.map((row) => [row.vehicleId, row._max.createdAt ?? null])
      );
    }

    const vehiclesWithStatus = vehicles.map((vehicle) => ({
      ...vehicle,
      hasActiveOrder: vehicle.orders.length > 0,
      activeOrdersCount: vehicle.orders.length,
      lastOrderDate: lastOrderDateByVehicle.get(vehicle.id) ?? null,
    }));

    const pagination = getPaginationMeta(totalItems, page, limit);

    res.status(200).json({ vehicles: vehiclesWithStatus, pagination });
  } catch (error) {
    console.error('Get mechanic vehicles error:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

// ============================================

// ============================================
export const getMechanicVehicleById = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;


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


