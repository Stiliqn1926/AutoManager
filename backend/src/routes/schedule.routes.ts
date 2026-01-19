import { Router } from 'express';
import {
  createSchedule,
  getAllSchedules,
  getWeeklySchedule,
  getDailySchedule,
  getMonthlySchedule,
  getScheduleById,
  updateSchedule,
  deleteSchedule,
  completeSchedule,
  checkConflicts,
} from '../controllers/schedule.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';
import { validate } from '../middleware/validation.middleware';
import { requireActiveService } from '../middleware/mechanicServiceCheck.middleware';
import {
  createScheduleSchema,
  updateScheduleSchema,
} from '../validators/schemas';

const router = Router();

router.use(authenticate);

router.post(
  '/',
  authorize('ADMIN'),
  validate(createScheduleSchema),
  createSchedule
);

router.post(
  '/check-conflicts',
  authorize('ADMIN'),
  checkConflicts
);

router.get(
  '/',
  authorize('ADMIN', 'MECHANIC'),
  getAllSchedules
);

router.get('/weekly', authorize('ADMIN', 'MECHANIC'), getWeeklySchedule);
router.get('/daily', authorize('ADMIN', 'MECHANIC'), getDailySchedule);
router.get('/monthly', authorize('ADMIN', 'MECHANIC'), getMonthlySchedule);

router.get('/:id', authorize('ADMIN', 'MECHANIC'), getScheduleById);

router.patch('/:id/complete', authorize('ADMIN'), completeSchedule);

router.put(
  '/:id',
  authorize('ADMIN'),
  validate(updateScheduleSchema), // 🔥 ТУК Е КЛЮЧОВОТО
  updateSchedule
);

router.delete('/:id', authorize('ADMIN'), deleteSchedule);

export default router;
