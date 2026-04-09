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


router.use(authenticate);
router.use(authorize('ADMIN'));
router.use(requireActiveAdminSubscription);


router.post('/', createSupplier);


router.get('/', getAllSuppliers);


router.get('/:id', getSupplierById);


router.put('/:id', updateSupplier);


router.patch('/:id/toggle-status', toggleSupplierStatus);

// PATCH /api/suppliers/:id/toggle-preferred - Preferred / Unpreferred
router.patch('/:id/toggle-preferred', toggleSupplierPreferred);


router.delete('/:id', deleteSupplier);

export default router;

