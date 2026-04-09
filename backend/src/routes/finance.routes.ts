import { Router } from 'express';
import {
  createFinance,
  getAllFinances,
  getFinanceSummary,
  getFinanceById,
  updateFinance,
  deleteFinance,
} from '../controllers/finance.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';
import { requireActiveAdminSubscription } from '../middleware/subscription.middleware';
import { validate } from '../middleware/validation.middleware';
import { createFinanceSchema, getFinanceFiltersSchema } from '../validators/schemas';

const router = Router();

// ============================================

// ============================================


router.post(
  '/',
  authenticate,
  requireActiveAdminSubscription,
  authorize('ADMIN'),
  validate(createFinanceSchema),
  createFinance
);


router.get(
  '/',
  authenticate,
  requireActiveAdminSubscription,
  authorize('ADMIN'),
  validate(getFinanceFiltersSchema, 'query'),
  getAllFinances
);


router.get(
  '/summary',
  authenticate,
  requireActiveAdminSubscription,
  authorize('ADMIN'),
  getFinanceSummary
);


router.get(
  '/:id',
  authenticate,
  requireActiveAdminSubscription,
  authorize('ADMIN'),
  getFinanceById
);


router.put(
  '/:id',
  authenticate,
  requireActiveAdminSubscription,
  authorize('ADMIN'),
  validate(createFinanceSchema),
  updateFinance
);


router.delete(
  '/:id',
  authenticate,
  requireActiveAdminSubscription,
  authorize('ADMIN'),
  deleteFinance
);

export default router;

