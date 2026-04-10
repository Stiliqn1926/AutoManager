import { resetIntegrationTestData } from './testDataCleanup';
import { createTestAgent } from './setup';
import prisma from '../config/database';

describe('Schedule Endpoints', () => {
  let adminAgent: any;
  let workerId: string;
  let scheduleId: string;

  beforeAll(async () => {
    await resetIntegrationTestData();
    const timestamp = Date.now();

    adminAgent = createTestAgent();
    const adminEmail = `admin-schedule-${timestamp}@automanager-test.com`;

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
      name: `Test Garage Schedule ${timestamp}`,
      address: 'Test Street 123',
      phone: '0888123456',
      email: `garage-schedule-${timestamp}@automanager-test.com`,
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

    const mechanicEmail = `mechanic-schedule-${timestamp}@automanager-test.com`;
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
      where: { email: mechanicEmail, requestType: 'MECHANIC', status: 'PENDING' },
    });

    if (!pendingRequest) {
      throw new Error('Pending mechanic request not found');
    }

    await adminAgent.patch(`/api/pending-requests/${pendingRequest.id}/approve`);

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

  it('should create a schedule', async () => {
    const start = new Date(Date.now() + 24 * 60 * 60 * 1000);
    start.setMinutes(0, 0, 0);
    const end = new Date(start.getTime() + 60 * 60 * 1000);

    const response = await adminAgent.post('/api/schedules').send({
      title: 'Test schedule',
      description: 'Schedule description',
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      workerId,
    });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('schedule');
    scheduleId = response.body.schedule.id;
  });

  it('should check conflicts for worker', async () => {
    const start = new Date(Date.now() + 24 * 60 * 60 * 1000);
    start.setMinutes(0, 0, 0);
    const end = new Date(start.getTime() + 60 * 60 * 1000);

    const response = await adminAgent.post('/api/schedules/check-conflicts').send({
      workerId,
      startTime: start.toISOString(),
      endTime: end.toISOString(),
    });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('hasConflict');
    expect(response.body.hasConflict).toBe(true);
  });

  it('should list schedules', async () => {
    const response = await adminAgent.get('/api/schedules');

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.schedules)).toBe(true);
  });

  it('should get schedule by id', async () => {
    const response = await adminAgent.get(`/api/schedules/${scheduleId}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('schedule');
    expect(response.body.schedule.id).toBe(scheduleId);
  });

  it('should update schedule', async () => {
    const newEnd = new Date(Date.now() + 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000);

    const response = await adminAgent.put(`/api/schedules/${scheduleId}`).send({
      title: 'Updated schedule',
      endTime: newEnd.toISOString(),
    });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('schedule');
    expect(response.body.schedule.title).toBe('Updated schedule');
  });

  it('should complete schedule', async () => {
    const response = await adminAgent.patch(`/api/schedules/${scheduleId}/complete`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('schedule');
    expect(response.body.schedule.status).toBe('COMPLETED');
  });

  it('should delete schedule', async () => {
    const response = await adminAgent.delete(`/api/schedules/${scheduleId}`);

    expect(response.status).toBe(200);
  });
});



