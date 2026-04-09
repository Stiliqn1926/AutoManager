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

// ========== MECHANIC SPECIFIC ROUTES (не изискват активен сервиз) ==========
router.get('/profile', authorize('MECHANIC'), getMechanicProfile);
router.put('/profile', authorize('MECHANIC'), updateMechanicProfile);
router.get('/statistics', authorize('MECHANIC'), getMechanicStatistics);

// ========== MECHANIC SERVICE COMPANY ROUTES (не изискват активен сервиз) ==========
router.get('/service-companies', authorize('MECHANIC'), getMechanicServiceCompanies);
router.get('/service-companies/active', authorize('MECHANIC'), getActiveServiceCompany);
router.post('/service-companies/request', authorize('MECHANIC'), requestServiceCompany);
router.put('/service-companies/switch', authorize('MECHANIC'), switchServiceCompany);
router.post('/service-companies/:membershipId/cancel', authorize('MECHANIC'), cancelPendingRequest);
router.delete('/service-companies/:membershipId', authorize('MECHANIC'), leaveServiceCompany);

// ========== ADMIN ROUTES ==========
router.use(authorize('ADMIN'));

// GET /api/workers - Вземи всички механици
router.get('/', getAllWorkers);

// GET /api/workers/availability - Провери наличността на механиците
router.get('/availability', getWorkersAvailability);

// GET /api/workers/:id - Вземи механик по ID
router.get('/:id', getWorkerById);

// PUT /api/workers/:id - Обнови механик
router.put('/:id', updateWorker);

// ✅ Нови endpoints за управление на работници
// PUT /api/workers/:id/toggle-active - Toggle active/inactive (отпуска)
router.put('/:id/toggle-active', toggleWorkerActive);

// PUT /api/workers/:id/reassign - Преназначи активни задачи и изтрий механика
router.put('/:id/reassign', reassignWorkerAndDelete);

// POST /api/workers/:id/remove-from-service - Премахни от сервиза (INACTIVE)
router.post('/:id/remove-from-service', removeWorkerFromService);

// DELETE /api/workers/:id/permanent - Изтрий напълно от системата
router.delete('/:id/permanent', deleteWorkerPermanently);

// DELETE /api/workers/:id - Изтрий от списъка (с проверка за активни задачи)
router.delete('/:id', deleteWorker);

export default router;
