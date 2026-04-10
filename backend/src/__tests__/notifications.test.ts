import { resetIntegrationTestData } from './testDataCleanup';
import { createTestAgent } from './setup';
import prisma from '../config/database';

describe('Notifications Endpoints', () => {
  let adminAgent: any;
  let clientAgent: any;
  let clientId: string;
  let notificationId: string;
  let uniqueCode: string;
  let serviceCompanyId: string;

  beforeAll(async () => {
    await resetIntegrationTestData();
    const timestamp = Date.now();

    adminAgent = createTestAgent();
    const adminEmail = `admin-notif-${timestamp}@automanager-test.com`;

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

    const companyResp = await adminAgent.post('/api/service-company').send({
      name: `Test Garage Notifications ${timestamp}`,
      address: 'Test Street 123',
      phone: '0888123456',
      email: `garage-notif-${timestamp}@automanager-test.com`,
    });

    if (companyResp.status !== 201 || !companyResp.body.serviceCompany) {
      throw new Error(
        `Failed to create service company. Status: ${companyResp.status}, Body: ${JSON.stringify(companyResp.body)}`
      );
    }

    serviceCompanyId = companyResp.body.serviceCompany.id;
    uniqueCode = companyResp.body.serviceCompany.uniqueCode;

    const adminReloginResponse = await adminAgent.post('/api/auth/login').send({
      email: adminEmail,
      password: 'Password123!',
    });
    if (adminReloginResponse.status !== 200) {
      throw new Error(
        `Failed to relogin admin. Status: ${adminReloginResponse.status}, Body: ${JSON.stringify(adminReloginResponse.body)}`
      );
    }

    clientAgent = createTestAgent();
    const clientEmail = `client-notif-${timestamp}@automanager-test.com`;

    const clientRegisterResponse = await clientAgent.post('/api/auth/register-client').send({
      email: clientEmail,
      password: 'Password123!',
      firstName: 'Ivan',
      lastName: 'Ivanov',
      phone: '0888111222',
      uniqueCode,
      role: 'CLIENT',
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

    const pendingRequest = await prisma.pendingRequest.findFirst({
      where: {
        email: clientEmail,
        requestType: 'CLIENT',
        serviceCompanyId,
        status: 'PENDING',
      },
      select: { id: true },
    });
    if (!pendingRequest) {
      throw new Error('Client pending request not found');
    }

    const approveRequestResponse = await adminAgent
      .patch(`/api/pending-requests/${pendingRequest.id}/approve`)
      .send();
    if (approveRequestResponse.status !== 200) {
      throw new Error(
        `Failed to approve client request. Status: ${approveRequestResponse.status}, Body: ${JSON.stringify(approveRequestResponse.body)}`
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

    const clientProfile = await prisma.client.findFirst({
      where: {
        userId: clientUser.id,
        serviceCompanyId,
      },
      select: { id: true },
    });
    if (!clientProfile) {
      throw new Error('Client profile not found after approval');
    }

    clientId = clientProfile.id;
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



