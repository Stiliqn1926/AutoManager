import { Router } from 'express';
import {
  createServiceCompany,
  getMyServiceCompany,
  updateServiceCompany,
} from '../controllers/serviceCompany.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';
import { validate } from '../middleware/validation.middleware';
import { createServiceCompanySchema } from '../validators/schemas';

const router = Router();

// Всички routes изискват authentication и ADMIN роля
router.use(authenticate);
router.use(authorize('ADMIN'));

// POST /api/service-company
router.post('/', validate(createServiceCompanySchema), createServiceCompany);

// GET /api/service-company
router.get('/', getMyServiceCompany);

// PUT /api/service-company
router.put('/', validate(createServiceCompanySchema), updateServiceCompany);

export default router;
