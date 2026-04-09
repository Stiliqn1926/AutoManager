import { createTestAgent } from './setup';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Auth Endpoints', () => {
  beforeAll(async () => {
    await prisma.$executeRawUnsafe('TRUNCATE TABLE "users" CASCADE');
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new ADMIN user', async () => {
      const agent = createTestAgent();

      const response = await agent
        .post('/api/auth/register')
        .send({
          email: `admin${Date.now()}@test.com`,
          password: 'Password123!',
          role: 'ADMIN',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.role).toBe('ADMIN');


      const cookies = response.headers['set-cookie'] as unknown as string[] | undefined;
      expect(cookies).toBeDefined();
      expect(Array.isArray(cookies)).toBe(true);
      expect(cookies?.some((c: string) => c.startsWith('accessToken='))).toBe(true);
      expect(cookies?.some((c: string) => c.startsWith('refreshToken='))).toBe(true);
    });

    it('should fail with invalid email', async () => {
      const agent = createTestAgent();

      const response = await agent
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          password: 'Password123!',
          role: 'ADMIN',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('errors');
    });

    it('should fail with short password', async () => {
      const agent = createTestAgent();

      const response = await agent
        .post('/api/auth/register')
        .send({
          email: `admin-short-${Date.now()}@test.com`,
          password: '123',
          role: 'ADMIN',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('errors');
    });
  });

  describe('POST /api/auth/login', () => {
    let testEmail: string;
    const testPassword = 'Password123!';

    beforeAll(async () => {

      const agent = createTestAgent();
      testEmail = `login-${Date.now()}@test.com`;

      await agent.post('/api/auth/register').send({
        email: testEmail,
        password: testPassword,
        role: 'ADMIN',
      });
    });

    it('should login with valid credentials', async () => {
      const agent = createTestAgent();

      const response = await agent
        .post('/api/auth/login')
        .send({
          email: testEmail,
          password: testPassword,
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(testEmail);


      const cookies = response.headers['set-cookie'] as unknown as string[] | undefined;
      expect(cookies).toBeDefined();
      expect(Array.isArray(cookies)).toBe(true);
      expect(cookies?.some((c: string) => c.startsWith('accessToken='))).toBe(true);
      expect(cookies?.some((c: string) => c.startsWith('refreshToken='))).toBe(true);
    });

    it('should fail with wrong password', async () => {
      const agent = createTestAgent();

      const response = await agent
        .post('/api/auth/login')
        .send({
          email: testEmail,
          password: 'wrongpassword',
        });

      expect(response.status).toBe(401);
    });

    it('should fail with non-existent email', async () => {
      const agent = createTestAgent();

      const response = await agent
        .post('/api/auth/login')
        .send({
          email: `nonexistent-${Date.now()}@test.com`,
          password: 'Password123!',
        });

      expect(response.status).toBe(401);
    });
  });
});

