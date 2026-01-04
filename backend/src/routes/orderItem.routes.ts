import { Router } from 'express';
import {
  addOrderItem,
  getOrderItems,
  updateOrderItem,
  deleteOrderItem,
} from '../controllers/orderItem.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';
import { validate } from '../middleware/validation.middleware';
import { createOrderItemSchema } from '../validators/schemas';

const router = Router();

// Всички routes изискват authentication и ADMIN роля
router.use(authenticate);
router.use(authorize('ADMIN'));

// POST /api/order-items/:orderId - Добави елемент към поръчка с валидация
router.post('/:orderId', validate(createOrderItemSchema), addOrderItem);

// GET /api/order-items/:orderId - Вземи всички елементи на поръчка
router.get('/:orderId', getOrderItems);

// PUT /api/order-items/:id - Обнови елемент с валидация
router.put('/:id', validate(createOrderItemSchema), updateOrderItem);

// DELETE /api/order-items/:id - Изтрий елемент
router.delete('/:id', deleteOrderItem);

export default router;