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
import { requireActiveAdminSubscription } from '../middleware/subscription.middleware';

const router = Router();


router.use(authenticate);
router.use(requireActiveAdminSubscription);


router.get('/', authorize('CLIENT', 'MECHANIC'), getAllNotifications);


router.get('/unread-count', authorize('CLIENT', 'MECHANIC'), getUnreadCount);


router.put('/:id/read', authorize('CLIENT', 'MECHANIC'), markAsRead);


router.put('/mark-all-read', authorize('CLIENT'), markAllAsRead);


router.delete('/:id', authorize('CLIENT'), deleteNotification);


router.post('/', authorize('ADMIN'), createNotification);

export default router;

