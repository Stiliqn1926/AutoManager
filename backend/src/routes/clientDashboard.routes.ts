import { Router } from 'express';
import {
  getClientVehicles,
  getClientActiveOrders,
  getClientOrderHistory,
  getClientInvoices,
  getClientNotifications,
  markNotificationAsRead,
  getClientDashboardOverview,
} from '../controllers/clientDashboard.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';

const router = Router();

// Всички routes изискват authentication и CLIENT роля
router.use(authenticate);
router.use(authorize('CLIENT'));

// Dashboard Overview
router.get('/overview', getClientDashboardOverview);

// Vehicles
router.get('/vehicles', getClientVehicles);

// Orders
router.get('/orders/active', getClientActiveOrders);
router.get('/orders/history', getClientOrderHistory);

// Invoices
router.get('/invoices', getClientInvoices);

// Notifications
router.get('/notifications', getClientNotifications);
router.put('/notifications/:id/read', markNotificationAsRead);

export default router;