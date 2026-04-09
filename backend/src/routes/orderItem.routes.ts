import { Router } from 'express';
import {
  addOrderItem,
  getOrderItems,
  updateOrderItem,
  deleteOrderItem,
} from '../controllers/orderItem.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';
import { requireActiveAdminSubscription } from '../middleware/subscription.middleware';
import { validate } from '../middleware/validation.middleware';
import { createOrderItemSchema } from '../validators/schemas';

const router = Router();

router.use(authenticate);
router.use(authorize('ADMIN'));
router.use(requireActiveAdminSubscription);

router.post('/:orderId', validate(createOrderItemSchema), addOrderItem);
router.get('/:orderId', getOrderItems);
router.put('/:id', validate(createOrderItemSchema), updateOrderItem);
router.delete('/:id', deleteOrderItem);

export default router;

