import { Router } from 'express';
import {
  createClient,
  getAllClients,
  getClientById,
  updateClient,
  deleteClient,
  toggleClientActive,
  addToService,
} from '../controllers/client.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';
import { requireActiveAdminSubscription } from '../middleware/subscription.middleware';
import { validate } from '../middleware/validation.middleware';
import { requireActiveService } from '../middleware/mechanicServiceCheck.middleware';
import { createClientSchema } from '../validators/schemas';

const router = Router();


router.post('/add-to-service', authenticate, authorize('CLIENT'), addToService);

// ========== ADMIN/MECHANIC GENERAL ROUTES ==========
router.use(authenticate);
router.use(requireActiveAdminSubscription);
router.use(authorize('ADMIN', 'MECHANIC'));


router.post('/', validate(createClientSchema), createClient);


router.get('/', getAllClients);
router.get('/mechanic', authorize('MECHANIC'), getAllClients);
router.get('/mechanic/:id', authorize('MECHANIC'), getClientById);

// PATCH /api/clients/:id/toggle-active - Toggle active status (ADMIN only)

router.patch('/:id/toggle-active', authorize('ADMIN'), toggleClientActive);


router.get('/:id', getClientById);


router.put('/:id', validate(createClientSchema), updateClient);


router.delete('/:id', deleteClient);

export default router;

