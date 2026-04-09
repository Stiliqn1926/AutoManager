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
  verifyEmailCode,
  registerAdminWithCompany,
  createAdminRegistrationCheckoutSession,
  getAdminRegistrationStatus,
  resendPasswordResetCode,
  resendEmailVerificationCode,
  deleteAccount,
} from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import {
  registerSchema,
  loginSchema,
  registerClientSchema,
  registerMechanicSchema,
  registerAdminWithCompanySchema,
  adminRegistrationCheckoutSessionSchema,
  addServiceCompanyToClientSchema,
} from '../validators/schemas';
import { loginLimiter } from '../middleware/rateLimiter.middleware';

const router = Router();

router.post('/register', validate(registerSchema), register);
router.post('/register-client', validate(registerClientSchema), register);
router.post('/register-admin', validate(registerAdminWithCompanySchema), registerAdminWithCompany);
router.post(
  '/register-admin/checkout-session',
  validate(adminRegistrationCheckoutSessionSchema),
  createAdminRegistrationCheckoutSession
);
router.get('/register-admin/status', getAdminRegistrationStatus);
router.post('/login', loginLimiter, validate(loginSchema), login);
router.post('/logout', authenticate, logout);
router.post('/refresh', refreshToken);
router.post('/register-mechanic', validate(registerMechanicSchema), registerMechanic);
router.post('/add-service-company', authenticate, validate(addServiceCompanyToClientSchema), addServiceCompanyToClient);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/resend-reset-code', resendPasswordResetCode);
router.post('/verify-email-code', verifyEmailCode);
router.post('/resend-email-verification-code', resendEmailVerificationCode);
router.delete('/delete-account', authenticate, deleteAccount);

export default router;
