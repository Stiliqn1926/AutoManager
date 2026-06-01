import { Router } from 'express';
import {
  approveAppointmentRequest,
  cancelAppointmentRequest,
  createAppointmentRequest,
  getClientAppointmentRequests,
  getPendingAppointmentRequests,
  rejectAppointmentRequest,
} from '../controllers/appointmentRequest.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';
import { requireActiveAdminSubscription } from '../middleware/subscription.middleware';
import { validate } from '../middleware/validation.middleware';
import {
  approveAppointmentRequestSchema,
  createAppointmentRequestSchema,
  rejectAppointmentRequestSchema,
} from '../validators/schemas';

const router = Router();

router.use(authenticate);
router.use(requireActiveAdminSubscription);

router.get('/my', authorize('CLIENT'), getClientAppointmentRequests);
router.post(
  '/',
  authorize('CLIENT'),
  validate(createAppointmentRequestSchema),
  createAppointmentRequest
);
router.delete('/:id/cancel', authorize('CLIENT'), cancelAppointmentRequest);

router.get('/pending', authorize('ADMIN'), getPendingAppointmentRequests);
router.patch(
  '/:id/approve',
  authorize('ADMIN'),
  validate(approveAppointmentRequestSchema),
  approveAppointmentRequest
);
router.patch(
  '/:id/reject',
  authorize('ADMIN'),
  validate(rejectAppointmentRequestSchema),
  rejectAppointmentRequest
);

export default router;
