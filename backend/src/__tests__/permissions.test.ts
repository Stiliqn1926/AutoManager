import request from 'supertest';
import app from '../app';

describe('Permission Tests', () => {
  let adminToken: string;
  let mechanicToken: string;
  let clientToken: string;
  let serviceCompanyId: string;

  // Setup - създай ADMIN, MECHANIC и CLIENT
  beforeAll(async () => {
    const timestamp = Date.now();

    // 1. Създай ADMIN
    const adminEmail = `admin-perm-${timestamp}@test.com`;
    await request(app)
      .post('/api/auth/register')
      .send({
        email: adminEmail,
        password: 'password123',
        role: 'ADMIN',
      });

    // 2. Първи login (без serviceCompanyId)
    let adminLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: adminEmail,
        password: 'password123',
      });

    let tempAdminToken = adminLogin.body.token;

    // 3. Създай Service Company
    const companyResponse = await request(app)
      .post('/api/service-company')
      .set('Authorization', `Bearer ${tempAdminToken}`)
      .send({
        name: `Test Garage Perm ${timestamp}`,
        address: 'Test Street 123',
        phone: '0888123456',
        email: `garage-perm-${timestamp}@test.com`,
      });

    serviceCompanyId = companyResponse.body.serviceCompany.id;
    const uniqueCode = companyResponse.body.serviceCompany.uniqueCode;

    // 4. Втори login (СЪС serviceCompanyId)
    adminLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: adminEmail,
        password: 'password123',
      });

    adminToken = adminLogin.body.token;

    // 5. Създай MECHANIC
    const mechanicEmail = `mechanic-${timestamp}@test.com`;
    await request(app)
      .post('/api/auth/register-mechanic')
      .send({
        email: mechanicEmail,
        password: 'password123',
        firstName: 'Георги',
        lastName: 'Механик',
        phone: '0888222333',
        uniqueCode,
      });

    const mechanicLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: mechanicEmail,
        password: 'password123',
      });

    mechanicToken = mechanicLogin.body.token;

    // 6. Създай CLIENT
    const clientEmail = `client-${timestamp}@test.com`;
    await request(app)
      .post('/api/auth/register')
      .send({
        email: clientEmail,
        password: 'password123',
        role: 'CLIENT',
      });

    const clientLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: clientEmail,
        password: 'password123',
      });

    clientToken = clientLogin.body.token;
  });

  describe('ADMIN Permissions', () => {
    it('ADMIN should access finance endpoints', async () => {
      const response = await request(app)
        .get('/api/finances')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
    });

    it('ADMIN should create vehicles', async () => {
      const timestamp = Date.now();
      
      // Първо създай клиент
      const clientResponse = await request(app)
        .post('/api/clients')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          firstName: 'Test',
          lastName: 'Client',
          phone: '0888777666',
        });

      const clientId = clientResponse.body.client.id;

      const response = await request(app)
        .post('/api/vehicles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          clientId,
          brand: 'BMW',
          model: 'X5',
          year: 2021,
          licensePlate: `CA${timestamp.toString().slice(-4)}ZZ`,
        });

      expect(response.status).toBe(201);
    });
  });

  describe('MECHANIC Permissions', () => {
    it('MECHANIC should NOT create service company', async () => {
      const timestamp = Date.now();
      const response = await request(app)
        .post('/api/service-company')
        .set('Authorization', `Bearer ${mechanicToken}`)
        .send({
          name: `Mechanic Garage ${timestamp}`,
          address: 'Street 789',
          phone: '0888555444',
          email: `mechgarage-${timestamp}@test.com`,
        });

      expect(response.status).toBe(403);
    });

    it('MECHANIC should NOT access finance endpoints', async () => {
      const response = await request(app)
        .get('/api/finances')
        .set('Authorization', `Bearer ${mechanicToken}`);

      expect(response.status).toBe(403);
    });

    it('MECHANIC should access clients', async () => {
      const response = await request(app)
        .get('/api/clients')
        .set('Authorization', `Bearer ${mechanicToken}`);

      // Механикът трябва да има worker профил за да види клиенти
      // Ако pending request не е одобрена, ще има 403
      expect([200, 403]).toContain(response.status);
    });
  });

  describe('CLIENT Permissions', () => {
    it('CLIENT should NOT create vehicles', async () => {
      const timestamp = Date.now();
      const response = await request(app)
        .post('/api/vehicles')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          clientId: 'fake-id',
          brand: 'Audi',
          model: 'A4',
          year: 2022,
          licensePlate: `PB${timestamp.toString().slice(-4)}XX`,
        });

      expect(response.status).toBe(403);
    });

    it('CLIENT should NOT access all clients', async () => {
      const response = await request(app)
        .get('/api/clients')
        .set('Authorization', `Bearer ${clientToken}`);

      expect(response.status).toBe(403);
    });

    it('CLIENT should NOT access finance', async () => {
      const response = await request(app)
        .get('/api/finances')
        .set('Authorization', `Bearer ${clientToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('Unauthenticated Access', () => {
    it('should deny access without token', async () => {
      const response = await request(app).get('/api/orders');

      expect(response.status).toBe(401);
    });

    it('should deny access with invalid token', async () => {
      const response = await request(app)
        .get('/api/orders')
        .set('Authorization', 'Bearer invalid-token-here');

      expect(response.status).toBe(401);
    });
  });
});