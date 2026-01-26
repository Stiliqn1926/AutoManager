import { Router } from 'express';
import {
  getClientServiceCompanies,
  getClientPendingRequests,
  cancelClientPendingRequest,
  addServiceCompany,
  leaveServiceCompany,
  getClientVehicles,
  getClientVehicleById,
  getClientActiveOrders,
  getClientOrders,
  getClientOrderById,
  getClientOrderHistory,
  getClientInvoices,
  downloadInvoicePDF,
  getClientNotifications,
  markNotificationAsRead,
  getClientDashboardOverview,
  getClientProfile,
  updateClientProfile,
  changePassword,
} from '../controllers/clientDashboard.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';

const router = Router();

router.use(authenticate);
router.use(authorize('CLIENT'));

// Profile
router.get('/profile', getClientProfile);
router.put('/profile', updateClientProfile);
router.put('/profile/password', changePassword);

// Service Companies
router.get('/service-companies', getClientServiceCompanies);
router.get('/service-companies/pending', getClientPendingRequests);
router.delete('/service-companies/pending/:requestId', cancelClientPendingRequest);
router.post('/service-companies/add', addServiceCompany);
router.delete('/service-companies/:clientId/leave', leaveServiceCompany);

// Dashboard Overview
router.get('/overview', getClientDashboardOverview);
router.get('/dashboard', getClientDashboardOverview);

// Vehicles
router.get('/vehicles', getClientVehicles);
router.get('/vehicles/:id', getClientVehicleById);

// Orders
router.get('/orders', getClientOrders);
router.get('/orders/active', getClientActiveOrders);
router.get('/orders/history', getClientOrderHistory);
router.get('/orders/:id', getClientOrderById);

// Invoices
router.get('/invoices', getClientInvoices);
router.get('/invoices/:invoiceNumber/pdf', downloadInvoicePDF);

// Notifications
router.get('/notifications', getClientNotifications);
router.put('/notifications/:id/read', markNotificationAsRead);

export default router;
