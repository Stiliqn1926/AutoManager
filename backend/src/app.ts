import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import path from 'path';
import cookieParser from 'cookie-parser';
import routes from './routes';
import { errorHandler } from './middleware/errorHandler.middleware';
import logger from './services/logger.service';
import { handleStripeWebhook } from './controllers/billing.controller';

dotenv.config();

const app = express();

// Required for correct client IP resolution behind Railway proxy
app.set('trust proxy', 1);

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  process.env.FRONTEND_URL,
].filter(Boolean);

const corsOptions: cors.CorsOptions = {
  origin: (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void
  ) => {
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    if (/\.vercel\.app$/.test(origin)) {
      return callback(null, true);
    }

    return callback(null, false);
  },
  credentials: true,
  optionsSuccessStatus: 200,
  allowedHeaders: ['Content-Type', 'Authorization'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  exposedHeaders: ['Content-Type'],
};

app.use(cors(corsOptions));

// Stripe webhook must receive raw body (before express.json)
app.post(
  '/api/billing/webhook',
  express.raw({ type: 'application/json' }),
  handleStripeWebhook
);

app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use((req, res, next) => {
  const startedAt = Date.now();

  res.on('finish', () => {
    const durationMs = Date.now() - startedAt;
    const pathName = req.originalUrl || req.url;

    if (pathName === '/api/health' || pathName === '/') {
      return;
    }

    if (process.env.NODE_ENV !== 'production') {
      logger.debug(
        `HTTP ${req.method} ${pathName} ${res.statusCode} ${durationMs}ms`
      );
      return;
    }

    if (res.statusCode >= 500) {
      logger.error('HTTP request failed', {
        method: req.method,
        path: pathName,
        statusCode: res.statusCode,
        durationMs,
      });
      return;
    }

    if (durationMs >= 2000) {
      logger.warn('Slow HTTP request', {
        method: req.method,
        path: pathName,
        statusCode: res.statusCode,
        durationMs,
      });
    }
  });

  next();
});

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message:
    'Ð¢Ð²ÑŠÑ€Ð´Ðµ Ð¼Ð½Ð¾Ð³Ð¾ Ð·Ð°ÑÐ²ÐºÐ¸ Ð¾Ñ‚ Ñ‚Ð¾Ð·Ð¸ IP, Ð¼Ð¾Ð»Ñ Ð¾Ð¿Ð¸Ñ‚Ð°Ð¹Ñ‚Ðµ Ð¾Ñ‚Ð½Ð¾Ð²Ð¾ ÑÐ»ÐµÐ´ 15 Ð¼Ð¸Ð½ÑƒÑ‚Ð¸.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.get('/', (_req, res) => {
  res.json({ message: 'AutoManager API is running!' });
});

app.use('/api', limiter);
app.use('/api', routes);

app.use((req, res) => {
  logger.warn(`404 - Route not found: ${req.method} ${req.url}`);
  res.status(404).json({
    status: 'error',
    message: 'Route not found',
  });
});

app.use(errorHandler);

export default app;

