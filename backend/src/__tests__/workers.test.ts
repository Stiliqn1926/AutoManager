import { createTestAgent } from './setup';
import prisma from '../config/database';

describe('Workers Management', () => {
  let adminAgent: any;
  let workerId: string;
  let pendingRequestId: string;

  beforeAll(async () => {
    await prisma.$executeRawUnsafe('TRUNCATE TABLE "users" CASCADE');
    const timestamp = Date.now();

    adminAgent = createTestAgent();
    const adminEmail = `admin-workers-${timestamp}@test.com`;

    await adminAgent.post('/api/auth/register').send({
      email: adminEmail,
      password: 'Password123!',
      role: 'ADMIN',
    });

    await adminAgent.post('/api/auth/login').send({
      email: adminEmail,
      password: 'Password123!',
    });

    const companyResp = await adminAgent.post('/api/service-company').send({
      name: `Test Garage Workers ${timestamp}`,
      address: 'Test Street 123',
      phone: '0888123456',
      email: `garage-workers-${timestamp}@test.com`,
    });

    if (companyResp.status !== 201 || !companyResp.body.serviceCompany) {
      throw new Error(
        `Failed to create service company. Status: ${companyResp.status}, Body: ${JSON.stringify(companyResp.body)}`
      );
    }

    const uniqueCode = companyResp.body.serviceCompany.uniqueCode;

    await adminAgent.post('/api/auth/login').send({
      email: adminEmail,
      password: 'Password123!',
    });

    const mechanicEmail = `mechanic-workers-${timestamp}@test.com`;

    const mechanicAgent = createTestAgent();
    await mechanicAgent.post('/api/auth/register-mechanic').send({
      email: mechanicEmail,
      password: 'Password123!',
      firstName: 'Georgi',
      lastName: 'Mehanik',
      phone: '0888222333',
      uniqueCode,
    });

    const pendingRequest = await prisma.pendingRequest.findFirst({
      where: {
        email: mechanicEmail,
        requestType: 'MECHANIC',
        status: 'PENDING',
      },
    });

    if (!pendingRequest) {
      throw new Error('Pending mechanic request not found');
    }

    pendingRequestId = pendingRequest.id;

    await adminAgent.patch(`/api/pending-requests/${pendingRequestId}/approve`);

    const user = await prisma.user.findUnique({ where: { email: mechanicEmail } });
    if (!user) {
      throw new Error('Mechanic user not found');
    }

    const worker = await prisma.worker.findUnique({ where: { userId: user.id } });
    if (!worker) {
      throw new Error('Worker profile not found');
    }

    workerId = worker.id;
  });

  it('should list workers for service company', async () => {
    const response = await adminAgent.get('/api/workers');

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.workers)).toBe(true);
  });

  it('should get worker by id', async () => {
    const response = await adminAgent.get(`/api/workers/${workerId}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('worker');
    expect(response.body.worker.id).toBe(workerId);
  });

  it('should update worker data', async () => {
    const response = await adminAgent.put(`/api/workers/${workerId}`).send({
      firstName: 'Petar',
      lastName: 'Petrov',
      phone: '0888333444',
      specialization: 'Engine',
      skills: 'Diagnostics, Suspension',
    });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('worker');
    expect(response.body.worker.firstName).toBe('Petar');
  });

  it('should toggle worker active status', async () => {
    const response = await adminAgent.put(`/api/workers/${workerId}/toggle-active`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('worker');
  });
});
