import { PrismaClient } from '@prisma/client';
import request from 'supertest';
import app from '../app';

const prisma = new PrismaClient();

// 🆕 Export helper за създаване на test agent
// Agent запазва cookies между requests (критично за httpOnly cookie auth!)
export const createTestAgent = () => request.agent(app);

beforeAll(async () => {
  try {
    await prisma.$executeRawUnsafe('TRUNCATE TABLE "users" CASCADE');
  } catch (error) {
    // Ignore if tables don't exist
  }
});

afterAll(async () => {
  await prisma.$disconnect();
});

jest.setTimeout(30000);
