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
// FINANCE ROUTES (само ADMIN има достъп)
// ============================================

// CREATE - Създаване на транзакция
router.post(
  '/',
  authenticate,
  requireActiveAdminSubscription,
  authorize('ADMIN'),
  validate(createFinanceSchema),
  createFinance
);

// GET ALL - Списък с филтри и pagination
router.get(
  '/',
  authenticate,
  requireActiveAdminSubscription,
  authorize('ADMIN'),
  validate(getFinanceFiltersSchema, 'query'),
  getAllFinances
);

// GET SUMMARY - Обобщение (приходи, разходи, печалба)
router.get(
  '/summary',
  authenticate,
  requireActiveAdminSubscription,
  authorize('ADMIN'),
  getFinanceSummary
);

// GET BY ID - Конкретна транзакция
router.get(
  '/:id',
  authenticate,
  requireActiveAdminSubscription,
  authorize('ADMIN'),
  getFinanceById
);

// UPDATE - Редактиране на транзакция
router.put(
  '/:id',
  authenticate,
  requireActiveAdminSubscription,
  authorize('ADMIN'),
  validate(createFinanceSchema),
  updateFinance
);

// DELETE - Изтриване на транзакция
router.delete(
  '/:id',
  authenticate,
  requireActiveAdminSubscription,
  authorize('ADMIN'),
  deleteFinance
);

export default router;
