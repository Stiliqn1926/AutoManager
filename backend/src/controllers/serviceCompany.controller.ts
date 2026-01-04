import { Request, Response } from 'express';
import prisma from '../config/database';
import { generateUniqueCode } from '../utils/generateUniqueCode';

interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

// Create Service Company (само за ADMIN)
export const createServiceCompany = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { name, address, phone, email, bulstat, vatNumber, description } = req.body;
    const userId = req.user!.userId;

    // Провери дали вече има автосервиз за този потребител
    const existingCompany = await prisma.serviceCompany.findUnique({
      where: { userId },
    });

    if (existingCompany) {
      res.status(400).json({ message: 'Service company already exists for this user' });
      return;
    }

    // Генерирай уникален код
    const uniqueCode = generateUniqueCode();

    // Създай автосервиз
    const serviceCompany = await prisma.serviceCompany.create({
      data: {
        name,
        address,
        phone,
        email,
        uniqueCode,
        bulstat,
        vatNumber,
        description,
        userId,
      },
    });

    res.status(201).json({
      message: 'Service company created successfully',
      serviceCompany,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Get Service Company (текущия автосервиз на логнатия ADMIN)
export const getMyServiceCompany = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.userId;

    const serviceCompany = await prisma.serviceCompany.findUnique({
      where: { userId },
      include: {
        workers: true,
        clients: true,
        vehicles: true,
        orders: true,
      },
    });

    if (!serviceCompany) {
      res.status(404).json({ message: 'Service company not found' });
      return;
    }

    res.status(200).json({ serviceCompany });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Update Service Company
export const updateServiceCompany = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { name, address, phone, email, bulstat, vatNumber, description } = req.body;

    const updatedCompany = await prisma.serviceCompany.update({
      where: { userId },
      data: {
        name,
        address,
        phone,
        email,
        bulstat,
        vatNumber,
        description,
      },
    });

    res.status(200).json({
      message: 'Service company updated successfully',
      serviceCompany: updatedCompany,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};