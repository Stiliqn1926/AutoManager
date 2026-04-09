import rateLimit from 'express-rate-limit';

// Brute force protection for login endpoint
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Ð¢Ð²ÑŠÑ€Ð´Ðµ Ð¼Ð½Ð¾Ð³Ð¾ Ð½ÐµÑƒÑÐ¿ÐµÑˆÐ½Ð¸ Ð¾Ð¿Ð¸Ñ‚Ð¸ Ð·Ð° Ð²Ñ…Ð¾Ð´. ÐœÐ¾Ð»Ñ Ð¾Ð¿Ð¸Ñ‚Ð°Ð¹Ñ‚Ðµ Ð¾Ñ‚Ð½Ð¾Ð²Ð¾ ÑÐ»ÐµÐ´ 15 Ð¼Ð¸Ð½ÑƒÑ‚Ð¸.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  keyGenerator: (req) => {
    const email = typeof req.body?.email === 'string' ? req.body.email.toLowerCase().trim() : '';
    const ip = req.ip || '';
    return email ? `${ip}:${email}` : ip;
  },
});

