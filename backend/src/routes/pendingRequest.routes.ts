import { Router } from 'express';
import {
  getAllPendingRequests,
  approvePendingRequest,
  rejectPendingRequest,
} from '../controllers/pendingRequest.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';
import { requireActiveAdminSubscription } from '../middleware/subscription.middleware';

const router = Router();

// Всички routes изискват authentication и ADMIN роля
router.use(authenticate);
router.use(authorize('ADMIN'));
router.use(requireActiveAdminSubscription);

// GET /api/pending-requests - Вземи всички pending заявки
router.get('/', getAllPendingRequests);

// PATCH /api/pending-requests/:id/approve - Одобри заявка
router.patch('/:id/approve', approvePendingRequest);

// PATCH /api/pending-requests/:id/reject - Отхвърли заявка
router.patch('/:id/reject', rejectPendingRequest);

export default router;
