import { Router } from 'express';
import {
  getAllWorkers,
  getWorkerById,
  updateWorker,
  deleteWorker,
  toggleWorkerActive,
  removeWorkerFromService,
  deleteWorkerPermanently,
  reassignWorkerAndDelete,
  getWorkersAvailability,
  getMechanicProfile,
  updateMechanicProfile,
  getMechanicStatistics,
  getMechanicServiceCompanies,
  getActiveServiceCompany,
  requestServiceCompany,
  switchServiceCompany,
  cancelPendingRequest,
  leaveServiceCompany,
} from '../controllers/worker.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';
import { requireActiveAdminSubscription } from '../middleware/subscription.middleware';
import { requireActiveService } from '../middleware/mechanicServiceCheck.middleware';

const router = Router();

router.use(authenticate);
router.use(requireActiveAdminSubscription);


router.get('/profile', authorize('MECHANIC'), getMechanicProfile);
router.put('/profile', authorize('MECHANIC'), updateMechanicProfile);
router.get('/statistics', authorize('MECHANIC'), getMechanicStatistics);


router.get('/service-companies', authorize('MECHANIC'), getMechanicServiceCompanies);
router.get('/service-companies/active', authorize('MECHANIC'), getActiveServiceCompany);
router.post('/service-companies/request', authorize('MECHANIC'), requestServiceCompany);
router.put('/service-companies/switch', authorize('MECHANIC'), switchServiceCompany);
router.post('/service-companies/:membershipId/cancel', authorize('MECHANIC'), cancelPendingRequest);
router.delete('/service-companies/:membershipId', authorize('MECHANIC'), leaveServiceCompany);

// ========== ADMIN ROUTES ==========
router.use(authorize('ADMIN'));


router.get('/', getAllWorkers);


router.get('/availability', getWorkersAvailability);


router.get('/:id', getWorkerById);


router.put('/:id', updateWorker);



router.put('/:id/toggle-active', toggleWorkerActive);


router.put('/:id/reassign', reassignWorkerAndDelete);


router.post('/:id/remove-from-service', removeWorkerFromService);


router.delete('/:id/permanent', deleteWorkerPermanently);


router.delete('/:id', deleteWorker);

export default router;

