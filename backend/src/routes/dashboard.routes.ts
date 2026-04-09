import { Router } from 'express';
import {
  getDashboardOverview,
  getFinanceChartData,
  getMechanicDashboard,
} from '../controllers/dashboard.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';
import { requireActiveAdminSubscription } from '../middleware/subscription.middleware';
import { requireActiveService } from '../middleware/mechanicServiceCheck.middleware';

const router = Router();

// ADMIN Dashboard
router.get(
  '/overview',
  authenticate,
  requireActiveAdminSubscription,
  authorize('ADMIN'),
  getDashboardOverview
);
router.get(
  '/chart',
  authenticate,
  requireActiveAdminSubscription,
  authorize('ADMIN'),
  getFinanceChartData
);


router.get('/mechanic', authenticate, authorize('MECHANIC'), getMechanicDashboard);

export default router;

