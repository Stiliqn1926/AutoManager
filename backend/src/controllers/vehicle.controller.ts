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
        client: true,
        orders: {
          include: {
            orderItems: true,
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
        year,
        licensePlate,
        vin,
        color,
        mileage,
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

    const updatedVehicle = await prisma.vehicle.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    res.status(200).json({
      message: 'Vehicle deactivated successfully',
      vehicle: updatedVehicle,
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
  } catch (error: any) {
    res.status(500).json({ message: 'Грешка при качване на снимка', error: error.message });
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
  } catch (error: any) {
    res.status(500).json({ message: 'Грешка при изтриване на снимка', error: error.message });
  }
};