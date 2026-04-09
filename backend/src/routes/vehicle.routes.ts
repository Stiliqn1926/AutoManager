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


router.post('/', validate(createVehicleSchema), createVehicle);


router.get('/', getAllVehicles);


router.get('/:id', getVehicleById);


router.put('/:id', validate(updateVehicleSchema), updateVehicle);


router.delete('/:id', deleteVehicle);

export default router;

