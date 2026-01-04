import { Router } from 'express';
import {
  getAllWorkers,
  getWorkerById,
  updateWorker,
  deleteWorker,
  getWorkersAvailability,
} from '../controllers/worker.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';

const router = Router();

// Всички routes изискват authentication и ADMIN роля
router.use(authenticate);
router.use(authorize('ADMIN'));

// GET /api/workers - Вземи всички механици
router.get('/', getAllWorkers);

// GET /api/workers/availability - Провери наличността на механиците
router.get('/availability', getWorkersAvailability);

// GET /api/workers/:id - Вземи механик по ID
router.get('/:id', getWorkerById);

// PUT /api/workers/:id - Обнови механик
router.put('/:id', updateWorker);

// DELETE /api/workers/:id - Деактивирай механик
router.delete('/:id', deleteWorker);

export default router;