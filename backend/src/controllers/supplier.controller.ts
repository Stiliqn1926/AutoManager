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

// ============================================
// CREATE SUPPLIER
// ============================================
export const createSupplier = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const {
      name,
      type,
      contactPerson,
      phonePrimary,
      phoneSecondary,
      email,
      addressLine,
      city,
      eik,
      vatNumber,
      website,
      notes,
      deliveryNotes,
      isPreferred,
    } = req.body;

    const userId = req.user!.userId;

    const serviceCompany = await prisma.serviceCompany.findUnique({
      where: { userId },
    });

    if (!serviceCompany) {
      res.status(404).json({ message: 'Service company not found' });
      return;
    }

    const supplier = await prisma.supplier.create({
      data: {
        name,
        type,
        contactPerson,
        phonePrimary,
        phoneSecondary,
        email,
        addressLine,
        city,
        eik,
        vatNumber,
        website,
        notes,
        deliveryNotes,
        isPreferred: isPreferred || false,
        serviceCompanyId: serviceCompany.id,
      },
    });

    res.status(201).json({
      message: 'Supplier created successfully',
      supplier,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// ============================================
// GET ALL SUPPLIERS
// ============================================
export const getAllSuppliers = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { search, isActive } = req.query;

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

    const where: any = {
      serviceCompanyId: serviceCompany.id,
      deletedAt: null,
    };

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { phonePrimary: { contains: search as string } },
        { email: { contains: search as string, mode: 'insensitive' } },
        { contactPerson: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const totalItems = await prisma.supplier.count({ where });

    const suppliers = await prisma.supplier.findMany({
      where,
      skip,
      take,
      orderBy: { name: 'asc' },
    });

    const pagination = getPaginationMeta(totalItems, page, limit);

    res.status(200).json({ suppliers, pagination });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// ============================================
// GET SUPPLIER BY ID
// ============================================
export const getSupplierById = async (
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

    const supplier = await prisma.supplier.findUnique({ where: { id } });

    if (!supplier || supplier.serviceCompanyId !== serviceCompany.id) {
      res.status(404).json({ message: 'Supplier not found' });
      return;
    }

    res.status(200).json({ supplier });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// ============================================
// UPDATE SUPPLIER
// ============================================
export const updateSupplier = async (
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

    const supplier = await prisma.supplier.findUnique({ where: { id } });

    if (!supplier || supplier.serviceCompanyId !== serviceCompany.id) {
      res.status(404).json({ message: 'Supplier not found' });
      return;
    }

    const updatedSupplier = await prisma.supplier.update({
      where: { id },
      data: req.body,
    });

    res.status(200).json({
      message: 'Supplier updated successfully',
      supplier: updatedSupplier,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// ============================================
// DELETE SUPPLIER (SOFT / HARD)
// ============================================
export const deleteSupplier = async (
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

    const supplier = await prisma.supplier.findUnique({ where: { id } });

    if (!supplier || supplier.serviceCompanyId !== serviceCompany.id) {
      res.status(404).json({ message: 'Supplier not found' });
      return;
    }

    await prisma.supplier.delete({ where: { id } });

    res.status(200).json({ message: 'Supplier deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// ============================================
// TOGGLE ACTIVE STATUS
// ============================================
export const toggleSupplierStatus = async (
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

    const supplier = await prisma.supplier.findUnique({ where: { id } });

    if (!supplier || supplier.serviceCompanyId !== serviceCompany.id) {
      res.status(404).json({ message: 'Supplier not found' });
      return;
    }

    const updated = await prisma.supplier.update({
      where: { id },
      data: { isActive: !supplier.isActive },
    });

    res.status(200).json({
      message: `Supplier ${updated.isActive ? 'activated' : 'deactivated'}`,
      supplier: updated,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// ============================================
// TOGGLE PREFERRED ⭐ (НОВО)
// ============================================
export const toggleSupplierPreferred = async (
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

    const supplier = await prisma.supplier.findUnique({ where: { id } });

    if (!supplier || supplier.serviceCompanyId !== serviceCompany.id) {
      res.status(404).json({ message: 'Supplier not found' });
      return;
    }

    const updated = await prisma.supplier.update({
      where: { id },
      data: { isPreferred: !supplier.isPreferred },
    });

    res.status(200).json({
      message: 'Supplier preferred status updated',
      supplier: updated,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};
