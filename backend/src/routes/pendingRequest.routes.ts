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


router.use(authenticate);
router.use(authorize('ADMIN'));
router.use(requireActiveAdminSubscription);


router.get('/', getAllPendingRequests);


router.patch('/:id/approve', approvePendingRequest);


router.patch('/:id/reject', rejectPendingRequest);

export default router;

