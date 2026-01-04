import { Router } from 'express';
import {
  register,
  login,
  logout,
  refreshToken,
  registerMechanic,
  addServiceCompanyToClient,
  forgotPassword,
  resetPassword,
  registerAdminWithCompany,
  resendPasswordResetCode,
} from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import {
  registerSchema,
  loginSchema,
  registerMechanicSchema,
  registerAdminWithCompanySchema,
  addServiceCompanyToClientSchema,
} from '../validators/schemas';
import { loginLimiter } from '../middleware/rateLimiter.middleware';

const router = Router();

// POST /api/auth/register - Общ register (ADMIN, CLIENT) с валидация
router.post('/register', validate(registerSchema), register);

// POST /api/auth/register-admin - Register Admin + Service Company
router.post(
  '/register-admin',
  validate(registerAdminWithCompanySchema),
  registerAdminWithCompany
);

// POST /api/auth/login - Login с валидация и brute force protection
router.post('/login', loginLimiter, validate(loginSchema), login);

// POST /api/auth/logout - Logout (изисква authentication)
// Добавя access token в blacklist и изтрива refresh token
router.post('/logout', authenticate, logout);

// POST /api/auth/refresh - Refresh access token
// Взима refresh token и връща нов access token
router.post('/refresh', refreshToken);

// POST /api/auth/register-mechanic - Register за механици с код и валидация
router.post(
  '/register-mechanic',
  validate(registerMechanicSchema),
  registerMechanic
);

// POST /api/auth/add-service-company - Клиент добавя сервиз с код (изисква auth)
router.post(
  '/add-service-company',
  authenticate,
  validate(addServiceCompanyToClientSchema),
  addServiceCompanyToClient
);

// POST /api/auth/forgot-password
router.post('/forgot-password', forgotPassword);

// POST /api/auth/reset-password
router.post('/reset-password', resetPassword);

// POST /api/auth/resend-reset-code
router.post('/resend-reset-code', resendPasswordResetCode);

export default router;
