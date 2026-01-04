import request from 'supertest';
import app from '../app';

describe('Auth Endpoints', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new ADMIN user', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: `admin${Date.now()}@test.com`,
          password: 'password123',
          role: 'ADMIN',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.role).toBe('ADMIN');
    });

    it('should fail with invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          password: 'password123',
          role: 'ADMIN',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('errors');
    });

    it('should fail with short password', async () => {
      const response = await request(app)
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
    const testPassword = 'password123';

    beforeAll(async () => {
      // Създай test user преди login тестовете
      testEmail = `login-${Date.now()}@test.com`;
      await request(app).post('/api/auth/register').send({
        email: testEmail,
        password: testPassword,
        role: 'ADMIN',
      });
    });

    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testEmail,
          password: testPassword,
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(testEmail);
    });

    it('should fail with wrong password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testEmail,
          password: 'wrongpassword',
        });

      expect(response.status).toBe(401);
    });

    it('should fail with non-existent email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: `nonexistent-${Date.now()}@test.com`,
          password: 'password123',
        });

      expect(response.status).toBe(401);
    });
  });
});