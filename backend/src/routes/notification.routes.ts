import { Router } from 'express';
import {
  getAllNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  createNotification,
} from '../controllers/notification.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';

const router = Router();

// Всички routes изискват authentication
router.use(authenticate);

// GET /api/notifications - Вземи всички известия (CLIENT или MECHANIC)
router.get('/', authorize('CLIENT', 'MECHANIC'), getAllNotifications);

// GET /api/notifications/unread-count - Брой непрочетени (CLIENT или MECHANIC)
router.get('/unread-count', authorize('CLIENT', 'MECHANIC'), getUnreadCount);

// PUT /api/notifications/:id/read - Маркирай като прочетено (CLIENT или MECHANIC)
router.put('/:id/read', authorize('CLIENT', 'MECHANIC'), markAsRead);

// PUT /api/notifications/mark-all-read - Маркирай всички като прочетени (само CLIENT)
router.put('/mark-all-read', authorize('CLIENT'), markAllAsRead);

// DELETE /api/notifications/:id - Изтрий известие (само CLIENT)
router.delete('/:id', authorize('CLIENT'), deleteNotification);

// POST /api/notifications - Създай известие ръчно (ADMIN)
router.post('/', authorize('ADMIN'), createNotification);

export default router;