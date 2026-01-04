import { Router } from 'express';
import {
  getDashboardOverview,
  getFinanceChartData,
  getMechanicDashboard,
} from '../controllers/dashboard.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';

const router = Router();

// ADMIN Dashboard
router.get('/overview', authenticate, authorize('ADMIN'), getDashboardOverview);
router.get('/chart', authenticate, authorize('ADMIN'), getFinanceChartData);

// MECHANIC Dashboard
router.get('/mechanic', authenticate, authorize('MECHANIC'), getMechanicDashboard);

export default router;