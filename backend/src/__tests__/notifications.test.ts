import { createTestAgent } from './setup';
import prisma from '../config/database';

describe('Notifications Endpoints', () => {
  let adminAgent: any;
  let clientAgent: any;
  let clientId: string;
  let notificationId: string;
  let uniqueCode: string;

  beforeAll(async () => {
    await prisma.$executeRawUnsafe('TRUNCATE TABLE "users" CASCADE');
    const timestamp = Date.now();

    adminAgent = createTestAgent();
    const adminEmail = `admin-notif-${timestamp}@test.com`;

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
      name: `Test Garage Notifications ${timestamp}`,
      address: 'Test Street 123',
      phone: '0888123456',
      email: `garage-notif-${timestamp}@test.com`,
    });

    if (companyResp.status !== 201 || !companyResp.body.serviceCompany) {
      throw new Error(
        `Failed to create service company. Status: ${companyResp.status}, Body: ${JSON.stringify(companyResp.body)}`
      );
    }

    uniqueCode = companyResp.body.serviceCompany.uniqueCode;

    await adminAgent.post('/api/auth/login').send({
      email: adminEmail,
      password: 'Password123!',
    });

    clientAgent = createTestAgent();
    const clientEmail = `client-notif-${timestamp}@test.com`;

    await clientAgent.post('/api/auth/register').send({
      email: clientEmail,
      password: 'Password123!',
      role: 'CLIENT',
    });

    await clientAgent.post('/api/auth/login').send({
      email: clientEmail,
      password: 'Password123!',
    });

    const addResp = await clientAgent.post('/api/clients/add-to-service').send({
      uniqueCode,
      firstName: 'Ivan',
      lastName: 'Ivanov',
      phone: '0888111222',
    });

    if (addResp.status !== 201 || !addResp.body.client) {
      throw new Error(
        `Failed to add client to service. Status: ${addResp.status}, Body: ${JSON.stringify(addResp.body)}`
      );
    }

    clientId = addResp.body.client.id;
  });

  it('admin should create notification for client', async () => {
    const response = await adminAgent.post('/api/notifications').send({
      clientId,
      title: 'Test notification',
      message: 'Notification message',
    });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('notification');
    notificationId = response.body.notification.id;
  });

  it('client should list notifications', async () => {
    const response = await clientAgent.get('/api/notifications');

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.notifications)).toBe(true);
  });

  it('client should get unread count', async () => {
    const response = await clientAgent.get('/api/notifications/unread-count');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('unreadCount');
  });

  it('client should mark notification as read', async () => {
    const response = await clientAgent.put(`/api/notifications/${notificationId}/read`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('notification');
  });

  it('client should mark all as read', async () => {
    const response = await clientAgent.put('/api/notifications/mark-all-read');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('count');
  });

  it('client should delete notification', async () => {
    const response = await clientAgent.delete(`/api/notifications/${notificationId}`);

    expect(response.status).toBe(200);
  });
});

