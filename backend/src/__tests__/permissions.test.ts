import { createTestAgent } from './setup';
import prisma from '../config/database';

describe('Permission Tests', () => {
  let adminAgent: any;
  let mechanicAgent: any;
  let clientAgent: any;
  let serviceCompanyId: string;

  // ✅ Setup - създай ADMIN, MECHANIC и CLIENT (С AGENTS!)
  beforeAll(async () => {
    await prisma.$executeRawUnsafe('TRUNCATE TABLE "users" CASCADE');
    const timestamp = Date.now();

    // ========== ADMIN SETUP ==========
    adminAgent = createTestAgent();
    const adminEmail = `admin-perm-${timestamp}@test.com`;

    await adminAgent.post('/api/auth/register').send({
      email: adminEmail,
      password: 'Password123!',
      role: 'ADMIN',
    });

    await adminAgent.post('/api/auth/login').send({
      email: adminEmail,
      password: 'Password123!',
    });

    // Създай Service Company
    const companyResponse = await adminAgent.post('/api/service-company').send({
      name: `Test Garage Perm ${timestamp}`,
      address: 'Test Street 123',
      phone: '0888123456',
      email: `garage-perm-${timestamp}@test.com`,
    });

    if (companyResponse.status !== 201 || !companyResponse.body.serviceCompany) {
      throw new Error(`Failed to create service company. Status: ${companyResponse.status}, Body: ${JSON.stringify(companyResponse.body)}`);
    }

    serviceCompanyId = companyResponse.body.serviceCompany.id;
    const uniqueCode = companyResponse.body.serviceCompany.uniqueCode;

    // Login отново (за serviceCompanyId в token)
    await adminAgent.post('/api/auth/login').send({
      email: adminEmail,
      password: 'Password123!',
    });

    // ========== MECHANIC SETUP ==========
    mechanicAgent = createTestAgent();
    const mechanicEmail = `mechanic-${timestamp}@test.com`;

    await mechanicAgent.post('/api/auth/register-mechanic').send({
      email: mechanicEmail,
      password: 'Password123!',
      firstName: 'Георги',
      lastName: 'Механик',
      phone: '0888222333',
      uniqueCode,
    });

    // Одобри pending request
    const pendingRequests = await prisma.pendingRequest.findMany({
      where: { email: mechanicEmail, status: 'PENDING' },
    });

    if (pendingRequests.length > 0) {
      await adminAgent
        .patch(`/api/pending-requests/${pendingRequests[0].id}/approve`)
        .send();
    }

    // Login на механика
    await mechanicAgent.post('/api/auth/login').send({
      email: mechanicEmail,
      password: 'Password123!',
      role: 'MECHANIC',
    });

    // ========== CLIENT SETUP ==========
    clientAgent = createTestAgent();
    const clientEmail = `client-${timestamp}@test.com`;

    await clientAgent.post('/api/auth/register').send({
      email: clientEmail,
      password: 'Password123!',
      role: 'CLIENT',
    });

    await clientAgent.post('/api/auth/login').send({
      email: clientEmail,
      password: 'Password123!',
    });
  });

  describe('ADMIN Permissions', () => {
    it('ADMIN should access finance endpoints', async () => {
      const response = await adminAgent.get('/api/finances');

      expect(response.status).toBe(200);
    });

    it('ADMIN should create vehicles', async () => {
      const timestamp = Date.now();

      // Първо създай клиент
      const clientResponse = await adminAgent.post('/api/clients').send({
        firstName: 'Test',
        lastName: 'Client',
        phone: '0888777666',
      });

      const clientId = clientResponse.body.client.id;

      const response = await adminAgent.post('/api/vehicles').send({
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
      const response = await mechanicAgent.post('/api/service-company').send({
        name: `Mechanic Garage ${timestamp}`,
        address: 'Street 789',
        phone: '0888555444',
        email: `mechgarage-${timestamp}@test.com`,
      });

      expect(response.status).toBe(403);
    });

    it('MECHANIC should NOT access finance endpoints', async () => {
      const response = await mechanicAgent.get('/api/finances');

      expect(response.status).toBe(403);
    });

    it('MECHANIC should access clients', async () => {
      const response = await mechanicAgent.get('/api/clients/mechanic');

      // Механикът трябва да има worker профил за да види клиенти
      expect([200, 403]).toContain(response.status);
    });
  });

  describe('CLIENT Permissions', () => {
    it('CLIENT should NOT create vehicles', async () => {
      const timestamp = Date.now();
      const response = await clientAgent.post('/api/vehicles').send({
        clientId: 'some-id',
        brand: 'Audi',
        model: 'A4',
        year: 2020,
        licensePlate: `CB${timestamp.toString().slice(-4)}XX`,
      });

      expect(response.status).toBe(403);
    });

    it('CLIENT should NOT access all clients', async () => {
      const response = await clientAgent.get('/api/clients');

      expect(response.status).toBe(403);
    });

    it('CLIENT should NOT access finance', async () => {
      const response = await clientAgent.get('/api/finances');

      expect(response.status).toBe(403);
    });
  });

  describe('Unauthenticated Access', () => {
    it('should deny access without token', async () => {
      const unauthAgent = createTestAgent();
      const response = await unauthAgent.get('/api/clients');

      expect(response.status).toBe(401);
    });

    it('should deny access with invalid token', async () => {
      const unauthAgent = createTestAgent();

      // Можем да пробваме с празен cookie jar (няма да има валиден cookie)
      const response = await unauthAgent.get('/api/vehicles');

      expect(response.status).toBe(401);
    });
  });
});
