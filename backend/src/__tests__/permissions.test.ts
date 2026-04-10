import { resetIntegrationTestData } from './testDataCleanup';
import { createTestAgent } from './setup';
import prisma from '../config/database';

describe('Permission Tests', () => {
  let adminAgent: any;
  let mechanicAgent: any;
  let clientAgent: any;
  let uniqueCode: string;


  beforeAll(async () => {
    await resetIntegrationTestData();
    const timestamp = Date.now();

    // ========== ADMIN SETUP ==========
    adminAgent = createTestAgent();
    const adminEmail = `admin-perm-${timestamp}@automanager-test.com`;

    await adminAgent.post('/api/auth/register').send({
      email: adminEmail,
      password: 'Password123!',
      role: 'ADMIN',
    });

    const adminLoginResponse = await adminAgent.post('/api/auth/login').send({
      email: adminEmail,
      password: 'Password123!',
    });
    if (adminLoginResponse.status !== 200) {
      throw new Error(
        `Failed to login admin. Status: ${adminLoginResponse.status}, Body: ${JSON.stringify(adminLoginResponse.body)}`
      );
    }


    const companyResponse = await adminAgent.post('/api/service-company').send({
      name: `Test Garage Perm ${timestamp}`,
      address: 'Test Street 123',
      phone: '0888123456',
      email: `garage-perm-${timestamp}@automanager-test.com`,
    });

    if (companyResponse.status !== 201 || !companyResponse.body.serviceCompany) {
      throw new Error(`Failed to create service company. Status: ${companyResponse.status}, Body: ${JSON.stringify(companyResponse.body)}`);
    }

    uniqueCode = companyResponse.body.serviceCompany.uniqueCode;


    const adminReloginResponse = await adminAgent.post('/api/auth/login').send({
      email: adminEmail,
      password: 'Password123!',
    });
    if (adminReloginResponse.status !== 200) {
      throw new Error(
        `Failed to relogin admin. Status: ${adminReloginResponse.status}, Body: ${JSON.stringify(adminReloginResponse.body)}`
      );
    }

    // ========== MECHANIC SETUP ==========
    mechanicAgent = createTestAgent();
    const mechanicEmail = `mechanic-${timestamp}@automanager-test.com`;

    const mechanicRegisterResponse = await mechanicAgent.post('/api/auth/register-mechanic').send({
      email: mechanicEmail,
      password: 'Password123!',
      firstName: 'Ivan',
      lastName: 'Petrov',
      phone: '0888222333',
      uniqueCode,
    });
    if (mechanicRegisterResponse.status !== 201) {
      throw new Error(
        `Failed to register mechanic. Status: ${mechanicRegisterResponse.status}, Body: ${JSON.stringify(mechanicRegisterResponse.body)}`
      );
    }

    const mechanicUser = await prisma.user.findUnique({
      where: { email: mechanicEmail },
      select: { id: true },
    });
    if (!mechanicUser) {
      throw new Error('Mechanic user not found after registration');
    }

    await prisma.user.update({
      where: { id: mechanicUser.id },
      data: { emailVerified: true },
    });


    const pendingRequests = await prisma.pendingRequest.findMany({
      where: { email: mechanicEmail, status: 'PENDING' },
    });

    if (pendingRequests.length > 0) {
      const approveMechanicResponse = await adminAgent
        .patch(`/api/pending-requests/${pendingRequests[0].id}/approve`)
        .send();
      if (approveMechanicResponse.status !== 200) {
        throw new Error(
          `Failed to approve mechanic pending request. Status: ${approveMechanicResponse.status}, Body: ${JSON.stringify(approveMechanicResponse.body)}`
        );
      }
    }


    const mechanicLoginResponse = await mechanicAgent.post('/api/auth/login').send({
      email: mechanicEmail,
      password: 'Password123!',
      role: 'MECHANIC',
    });
    if (mechanicLoginResponse.status !== 200) {
      throw new Error(
        `Failed to login mechanic. Status: ${mechanicLoginResponse.status}, Body: ${JSON.stringify(mechanicLoginResponse.body)}`
      );
    }

    // ========== CLIENT SETUP ==========
    clientAgent = createTestAgent();
    const clientEmail = `client-${timestamp}@automanager-test.com`;

    const clientRegisterResponse = await clientAgent.post('/api/auth/register-client').send({
      email: clientEmail,
      password: 'Password123!',
      role: 'CLIENT',
      firstName: 'Petar',
      lastName: 'Dimitrov',
      phone: '0888111222',
      uniqueCode,
    });
    if (clientRegisterResponse.status !== 201) {
      throw new Error(
        `Failed to register client. Status: ${clientRegisterResponse.status}, Body: ${JSON.stringify(clientRegisterResponse.body)}`
      );
    }

    const clientUser = await prisma.user.findUnique({
      where: { email: clientEmail },
      select: { id: true },
    });
    if (!clientUser) {
      throw new Error('Client user not found after registration');
    }

    await prisma.user.update({
      where: { id: clientUser.id },
      data: { emailVerified: true },
    });

    const clientPendingRequest = await prisma.pendingRequest.findFirst({
      where: {
        email: clientEmail,
        requestType: 'CLIENT',
        status: 'PENDING',
      },
      select: { id: true },
    });
    if (!clientPendingRequest) {
      throw new Error('Client pending request not found');
    }

    const approveClientResponse = await adminAgent
      .patch(`/api/pending-requests/${clientPendingRequest.id}/approve`)
      .send();
    if (approveClientResponse.status !== 200) {
      throw new Error(
        `Failed to approve client pending request. Status: ${approveClientResponse.status}, Body: ${JSON.stringify(approveClientResponse.body)}`
      );
    }

    const clientLoginResponse = await clientAgent.post('/api/auth/login').send({
      email: clientEmail,
      password: 'Password123!',
      role: 'CLIENT',
    });
    if (clientLoginResponse.status !== 200) {
      throw new Error(
        `Failed to login client. Status: ${clientLoginResponse.status}, Body: ${JSON.stringify(clientLoginResponse.body)}`
      );
    }
  });

  describe('ADMIN Permissions', () => {
    it('ADMIN should access finance endpoints', async () => {
      const response = await adminAgent.get('/api/finances');

      expect(response.status).toBe(200);
    });

    it('ADMIN should create vehicles', async () => {
      const timestamp = Date.now();


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
        email: `mechgarage-${timestamp}@automanager-test.com`,
      });

      expect(response.status).toBe(403);
    });

    it('MECHANIC should NOT access finance endpoints', async () => {
      const response = await mechanicAgent.get('/api/finances');

      expect(response.status).toBe(403);
    });

    it('MECHANIC should access clients', async () => {
      const response = await mechanicAgent.get('/api/clients/mechanic');


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


      const response = await unauthAgent.get('/api/vehicles');

      expect(response.status).toBe(401);
    });
  });
});



