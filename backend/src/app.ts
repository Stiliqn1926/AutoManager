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
  logger.info(`${req.method} ${req.url}`);
  next();
});

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message:
    'Твърде много заявки от този IP, моля опитайте отново след 15 минути.',
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

