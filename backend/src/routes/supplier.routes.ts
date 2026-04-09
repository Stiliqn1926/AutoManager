import { Router } from 'express';
import {
  createSupplier,
  getAllSuppliers,
  getSupplierById,
  updateSupplier,
  deleteSupplier,
  toggleSupplierStatus,
  toggleSupplierPreferred,
} from '../controllers/supplier.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';
import { requireActiveAdminSubscription } from '../middleware/subscription.middleware';

const router = Router();

// Всички routes изискват authentication и ADMIN роля
router.use(authenticate);
router.use(authorize('ADMIN'));
router.use(requireActiveAdminSubscription);

// POST /api/suppliers - Създай доставчик
router.post('/', createSupplier);

// GET /api/suppliers - Всички доставчици
router.get('/', getAllSuppliers);

// GET /api/suppliers/:id - Доставчик по ID
router.get('/:id', getSupplierById);

// PUT /api/suppliers/:id - Обнови доставчик
router.put('/:id', updateSupplier);

// PATCH /api/suppliers/:id/toggle-status - Активирай / деактивирай
router.patch('/:id/toggle-status', toggleSupplierStatus);

// PATCH /api/suppliers/:id/toggle-preferred - Preferred / Unpreferred
router.patch('/:id/toggle-preferred', toggleSupplierPreferred);

// DELETE /api/suppliers/:id - Изтрий доставчик
router.delete('/:id', deleteSupplier);

export default router;
