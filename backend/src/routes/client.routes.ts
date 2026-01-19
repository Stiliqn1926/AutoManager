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
import { validate } from '../middleware/validation.middleware';
import { requireActiveService } from '../middleware/mechanicServiceCheck.middleware';
import { createClientSchema } from '../validators/schemas';

const router = Router();

// CLIENT endpoint (за добавяне към сервиз)
router.post('/add-to-service', authenticate, authorize('CLIENT'), addToService);

// ========== ADMIN/MECHANIC GENERAL ROUTES ==========
router.use(authenticate);
router.use(authorize('ADMIN', 'MECHANIC'));

// POST /api/clients - Създай клиент с валидация
router.post('/', validate(createClientSchema), createClient);

// GET /api/clients - Всички клиенти
router.get('/', getAllClients);
router.get('/mechanic', authorize('MECHANIC'), getAllClients);
router.get('/mechanic/:id', authorize('MECHANIC'), getClientById);

// PATCH /api/clients/:id/toggle-active - Toggle active status (ADMIN only)
// ⚠️ ВАЖНО: Този route трябва да е ПРЕДИ /:id routes
router.patch('/:id/toggle-active', authorize('ADMIN'), toggleClientActive);

// GET /api/clients/:id - Клиент по ID
router.get('/:id', getClientById);

// PUT /api/clients/:id - Обнови клиент с валидация
router.put('/:id', validate(createClientSchema), updateClient);

// DELETE /api/clients/:id - Изтрий клиент
router.delete('/:id', deleteClient);

export default router;
