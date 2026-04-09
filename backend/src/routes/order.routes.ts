import { Router } from 'express';
import {
  createOrder,
  getAllOrders,
  getOrderById,
  updateOrder,
  updateOrderStatus,
  completeOrder,
  deleteOrder,
  finalizeOrder,
} from '../controllers/order.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';
import { requireActiveAdminSubscription } from '../middleware/subscription.middleware';
import { validate } from '../middleware/validation.middleware';
import { createOrderSchema, updateOrderStatusSchema } from '../validators/schemas';

const router = Router();

router.use(authenticate);
router.use(requireActiveAdminSubscription);

router.post('/', authorize('ADMIN', 'MECHANIC'), validate(createOrderSchema), createOrder);
router.get('/', authorize('ADMIN', 'MECHANIC'), getAllOrders);
router.get('/:id', authorize('ADMIN', 'MECHANIC'), getOrderById);
router.put('/:id', authorize('ADMIN', 'MECHANIC'), updateOrder);
router.put('/:id/status', authorize('ADMIN', 'MECHANIC'), validate(updateOrderStatusSchema), updateOrderStatus);
router.patch('/:id/status', authorize('ADMIN', 'MECHANIC'), validate(updateOrderStatusSchema), updateOrderStatus);
router.post('/:id/complete', authorize('ADMIN'), completeOrder);
router.delete('/:id', authorize('ADMIN'), deleteOrder);
router.post('/:id/finalize', authorize('ADMIN'), finalizeOrder);

export default router;
