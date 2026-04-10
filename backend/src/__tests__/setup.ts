import request from 'supertest';
import prisma from '../config/database';

process.env.NODE_ENV = 'test';
process.env.RESEND_API_KEY = process.env.RESEND_API_KEY || 're_test';
process.env.SUPABASE_URL =
  process.env.SUPABASE_URL || 'https://example.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'test_service_role_key';

jest.mock('../middleware/rateLimiter.middleware', () => ({
  loginLimiter: (_req: any, _res: any, next: any) => next(),
}));

import app from '../app';

export const createTestAgent = () => request.agent(app);

afterAll(async () => {
  await prisma.$disconnect();
});

jest.setTimeout(30000);

