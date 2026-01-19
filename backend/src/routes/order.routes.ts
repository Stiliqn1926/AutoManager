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
import { validate } from '../middleware/validation.middleware';
import { requireActiveService } from '../middleware/mechanicServiceCheck.middleware';
import { createOrderSchema, updateOrderStatusSchema } from '../validators/schemas';

const router = Router();

// Всички routes изискват authentication
router.use(authenticate);

// POST /api/orders - Създай поръчка с валидация (ADMIN и MECHANIC)
router.post(
  '/',
  authorize('ADMIN', 'MECHANIC'),
  validate(createOrderSchema),
  createOrder
);

// GET /api/orders - Вземи поръчки (ADMIN вижда всички, MECHANIC само своите)
router.get('/', authorize('ADMIN', 'MECHANIC'), getAllOrders);

// GET /api/orders/:id - Вземи поръчка по ID (ADMIN и MECHANIC)
router.get('/:id', authorize('ADMIN', 'MECHANIC'), getOrderById);

// PUT /api/orders/:id - Обнови поръчка (ADMIN и MECHANIC)
router.put('/:id', authorize('ADMIN', 'MECHANIC'), updateOrder);

// PUT /api/orders/:id/status - Обнови статус с валидация (ADMIN и MECHANIC с ограничения)
router.put(
  '/:id/status',
  authorize('ADMIN', 'MECHANIC'),
  validate(updateOrderStatusSchema),
  updateOrderStatus
);

// PATCH /api/orders/:id/status - Обнови статус с валидация (ADMIN и MECHANIC с ограничения)
router.patch(
  '/:id/status',
  authorize('ADMIN', 'MECHANIC'),
  validate(updateOrderStatusSchema),
  updateOrderStatus
);

// POST /api/orders/:id/complete - Завърши поръчка (само ADMIN)
router.post('/:id/complete', authorize('ADMIN'), completeOrder);

// DELETE /api/orders/:id - Изтрий поръчка (само ADMIN)
router.delete('/:id', authorize('ADMIN'), deleteOrder);

// POST /api/orders/:id/finalize - Финализирай поръчка и генерирай фактура (само ADMIN)
router.post('/:id/finalize', authorize('ADMIN'), finalizeOrder);

// NOTE: Order Items routes са в отделен файл - orderItem.routes.ts
// Използвай /api/order-items/* за управление на order items

export default router;
