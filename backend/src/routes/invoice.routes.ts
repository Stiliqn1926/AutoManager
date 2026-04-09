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
import { requireActiveAdminSubscription } from '../middleware/subscription.middleware';
import { validate } from '../middleware/validation.middleware';
import { createInvoiceSchema } from '../validators/schemas';

const router = Router();


router.use(authenticate);
router.use(authorize('ADMIN'));
router.use(requireActiveAdminSubscription);


router.post('/order/:orderId', validate(createInvoiceSchema), createInvoice);


router.get('/order/:orderId', getInvoiceByOrderId);


router.get('/:id', getInvoiceById);


router.put('/:id', validate(createInvoiceSchema), updateInvoice);


router.put('/:id/pay', markInvoiceAsPaid);


router.delete('/:id', deleteInvoice);

export default router;

