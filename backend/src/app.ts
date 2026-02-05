import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import path from 'path';
import cookieParser from 'cookie-parser'; // 🆕 За httpOnly cookies
import routes from './routes';
import { errorHandler } from './middleware/errorHandler.middleware';
import logger from './services/logger.service';

dotenv.config();

const app = express();

// CORS configuration - ограничи достъпа само до frontend
// Разрешаваме multiple ports за development (Vite понякога използва различни портове)
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  process.env.FRONTEND_URL,
].filter(Boolean);

const corsOptions: any = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
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

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
// 🆕 Cookie parser middleware - позволява четене и писане на cookies
// Важно: Трябва да бъде ПРЕДИ routes!
app.use(cookieParser());

// Статични файлове - сървира снимките от /uploads (🆕)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Логвай всяка заявка
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});

// Rate limiting - максимум 1000 заявки на 15 минути (увеличен лимит за нормална употреба)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минути
  max: 1000, // Максимум 1000 заявки
  message: 'Твърде много заявки от този IP, моля опитайте отново след 15 минути.',
  standardHeaders: true,
  legacyHeaders: false,
});


// Root route
app.get('/', (req, res) => {
  res.json({ message: 'AutoManager API is running!' });
});

// Приложи rate limiting на всички API routes
app.use('/api', limiter);

// All API routes
app.use('/api', routes);

// 404 Handler - ако няма намерен route
app.use((req, res) => {
  logger.warn(`404 - Route not found: ${req.method} ${req.url}`);
  res.status(404).json({
    status: 'error',
    message: 'Route not found',
  });
});

// Global Error Handler (ВИНАГИ накрая!)
app.use(errorHandler);

export default app;
