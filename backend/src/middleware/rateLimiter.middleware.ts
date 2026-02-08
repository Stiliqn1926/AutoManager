import rateLimit from 'express-rate-limit';

// Brute force protection for login endpoint
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Твърде много неуспешни опити за вход. Моля опитайте отново след 15 минути.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  keyGenerator: (req) => {
    const email = typeof req.body?.email === 'string' ? req.body.email.toLowerCase().trim() : '';
    const ip = req.ip || '';
    return email ? `${ip}:${email}` : ip;
  },
});
