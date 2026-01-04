import { Router } from 'express';
import {
  createInvoice,
  getInvoiceByOrderId,
  getInvoiceById,
  updateInvoice,
  markInvoiceAsPaid,
  deleteInvoice,
} from '../controllers/invoice.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';
import { validate } from '../middleware/validation.middleware';
import { createInvoiceSchema } from '../validators/schemas';

const router = Router();

// Всички routes изискват authentication и ADMIN роля
router.use(authenticate);
router.use(authorize('ADMIN'));

// POST /api/invoices/order/:orderId - Създай фактура за поръчка с валидация
router.post('/order/:orderId', validate(createInvoiceSchema), createInvoice);

// GET /api/invoices/order/:orderId - Вземи фактура по orderId
router.get('/order/:orderId', getInvoiceByOrderId);

// GET /api/invoices/:id - Вземи фактура по ID
router.get('/:id', getInvoiceById);

// PUT /api/invoices/:id - Обнови фактура с валидация
router.put('/:id', validate(createInvoiceSchema), updateInvoice);

// PUT /api/invoices/:id/pay - Маркирай като платена
router.put('/:id/pay', markInvoiceAsPaid);

// DELETE /api/invoices/:id - Изтрий фактура
router.delete('/:id', deleteInvoice);

export default router;