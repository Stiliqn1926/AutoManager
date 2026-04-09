import { Router } from 'express';
import {
  createVehicle,
  getAllVehicles,
  getVehicleById,
  updateVehicle,
  deleteVehicle,
  getMechanicVehicles,
  getMechanicVehicleById,
} from '../controllers/vehicle.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';
import { requireActiveAdminSubscription } from '../middleware/subscription.middleware';
import { validate } from '../middleware/validation.middleware';
import { requireActiveService } from '../middleware/mechanicServiceCheck.middleware';
import { createVehicleSchema, updateVehicleSchema } from '../validators/schemas';

const router = Router();

// ========== MECHANIC SPECIFIC ROUTES (преди общите) ==========
router.get(
  '/mechanic',
  authenticate,
  authorize('MECHANIC'),
  getMechanicVehicles
);
router.get(
  '/mechanic/:id',
  authenticate,
  authorize('MECHANIC'),
  getMechanicVehicleById
);

// ========== ADMIN ROUTES ==========
router.use(authenticate);
router.use(authorize('ADMIN'));
router.use(requireActiveAdminSubscription);

// POST /api/vehicles - Създай автомобил с валидация
router.post('/', validate(createVehicleSchema), createVehicle);

// GET /api/vehicles - Всички автомобили
router.get('/', getAllVehicles);

// GET /api/vehicles/:id - Автомобил по ID
router.get('/:id', getVehicleById);

// PUT /api/vehicles/:id - Обнови автомобил с валидация
router.put('/:id', validate(updateVehicleSchema), updateVehicle);

// DELETE /api/vehicles/:id - Деактивирай автомобил
router.delete('/:id', deleteVehicle);

export default router;
