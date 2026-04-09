import { Router } from 'express';
import authRoutes from './auth.routes';
import serviceCompanyRoutes from './serviceCompany.routes';
import workerRoutes from './worker.routes';
import clientRoutes from './client.routes';
import pendingRequestRoutes from './pendingRequest.routes';
import vehicleRoutes from './vehicle.routes';
import orderRoutes from './order.routes';
import orderItemRoutes from './orderItem.routes';
import invoiceRoutes from './invoice.routes';
import notificationRoutes from './notification.routes';
import scheduleRoutes from './schedule.routes';
import clientDashboardRoutes from './clientDashboard.routes';
import supplierRoutes from './supplier.routes';
import financeRoutes from './finance.routes';
import dashboardRoutes from './dashboard.routes';
import billingRoutes from './billing.routes';

const router = Router();

// Auth routes
router.use('/auth', authRoutes);

// Service Company routes
router.use('/service-company', serviceCompanyRoutes);

// Worker routes (Mechanic operations)
router.use('/worker', workerRoutes);

// Workers routes (Admin operations)
router.use('/workers', workerRoutes);

// Client routes
router.use('/clients', clientRoutes);

// Pending Request routes
router.use('/pending-requests', pendingRequestRoutes);

// Vehicle routes
router.use('/vehicles', vehicleRoutes);

// Order routes
router.use('/orders', orderRoutes);

// Order Item routes
router.use('/order-items', orderItemRoutes);

// Invoice routes
router.use('/invoices', invoiceRoutes);

// Notification routes
router.use('/notifications', notificationRoutes);

// Schedule routes
router.use('/schedules', scheduleRoutes);

// Client Dashboard routes
router.use('/client', clientDashboardRoutes);

// Supplier routes
router.use('/suppliers', supplierRoutes);

// Finance routes
router.use('/finances', financeRoutes);

// Dashboard routes (ADMIN & MECHANIC)
router.use('/dashboard', dashboardRoutes);

// Billing routes (Stripe subscription)
router.use('/billing', billingRoutes);

// Health check
router.get('/health', (req, res) => {
  res.status(200).json({ message: 'API is running!' });
});

export default router;

