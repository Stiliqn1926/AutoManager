import { Router } from 'express';
import {
  createBillingPortalSession,
  createCheckoutSession,
  getSubscriptionStatus,
} from '../controllers/billing.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';

const router = Router();

router.use(authenticate);
router.use(authorize('ADMIN'));

router.post('/checkout-session', createCheckoutSession);
router.post('/portal-session', createBillingPortalSession);
router.get('/subscription-status', getSubscriptionStatus);

export default router;


