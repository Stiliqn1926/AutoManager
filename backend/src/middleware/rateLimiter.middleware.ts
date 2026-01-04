import rateLimit from 'express-rate-limit';

// Strict rate limiting за login endpoints - защита срещу brute force
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минути
  max: 5, // Максимум 5 опита
  message: 'Твърде много неуспешни опити за вход. Моля опитайте отново след 15 минути.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Не брои успешните requests
});
