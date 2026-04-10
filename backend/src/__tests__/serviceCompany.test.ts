import { resetIntegrationTestData } from './testDataCleanup';
import { createTestAgent } from './setup';
import prisma from '../config/database';

describe('Service Company Operations', () => {
  let adminAgent: any;
  let secondAdminAgent: any;
  let clientAgent: any;
  let primaryServiceCompanyId: string;
  let secondaryServiceCompanyId: string;
  let primaryUniqueCode: string;
  let secondaryUniqueCode: string;
  let clientProfileId: string;
  let pendingRequestId: string;

  beforeAll(async () => {
    await resetIntegrationTestData();
    const timestamp = Date.now();

    adminAgent = createTestAgent();
    const adminEmail = `admin-sc-main-${timestamp}@automanager-test.com`;

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
        `Failed to login primary admin. Status: ${adminLoginResponse.status}, Body: ${JSON.stringify(adminLoginResponse.body)}`
      );
    }

    const companyResp = await adminAgent.post('/api/service-company').send({
      name: `Test Garage SC Main ${timestamp}`,
      address: 'Test Street 123',
      phone: '0888123456',
      email: `garage-sc-main-${timestamp}@automanager-test.com`,
    });

    if (companyResp.status !== 201 || !companyResp.body.serviceCompany) {
      throw new Error(
        `Failed to create primary service company. Status: ${companyResp.status}, Body: ${JSON.stringify(companyResp.body)}`
      );
    }

    primaryServiceCompanyId = companyResp.body.serviceCompany.id;
    primaryUniqueCode = companyResp.body.serviceCompany.uniqueCode;

    secondAdminAgent = createTestAgent();
    const secondAdminEmail = `admin-sc-second-${timestamp}@automanager-test.com`;

    await secondAdminAgent.post('/api/auth/register').send({
      email: secondAdminEmail,
      password: 'Password123!',
      role: 'ADMIN',
    });

    const secondAdminLoginResponse = await secondAdminAgent.post('/api/auth/login').send({
      email: secondAdminEmail,
      password: 'Password123!',
    });
    if (secondAdminLoginResponse.status !== 200) {
      throw new Error(
        `Failed to login secondary admin. Status: ${secondAdminLoginResponse.status}, Body: ${JSON.stringify(secondAdminLoginResponse.body)}`
      );
    }

    const secondCompanyResp = await secondAdminAgent.post('/api/service-company').send({
      name: `Test Garage SC Secondary ${timestamp}`,
      address: 'Second Street 456',
      phone: '0888000111',
      email: `garage-sc-second-${timestamp}@automanager-test.com`,
    });
    if (secondCompanyResp.status !== 201 || !secondCompanyResp.body.serviceCompany) {
      throw new Error(
        `Failed to create secondary service company. Status: ${secondCompanyResp.status}, Body: ${JSON.stringify(secondCompanyResp.body)}`
      );
    }

    secondaryServiceCompanyId = secondCompanyResp.body.serviceCompany.id;
    secondaryUniqueCode = secondCompanyResp.body.serviceCompany.uniqueCode;

    const adminReloginResponse = await adminAgent.post('/api/auth/login').send({
      email: adminEmail,
      password: 'Password123!',
    });
    if (adminReloginResponse.status !== 200) {
      throw new Error(
        `Failed to relogin primary admin. Status: ${adminReloginResponse.status}, Body: ${JSON.stringify(adminReloginResponse.body)}`
      );
    }

    const secondAdminReloginResponse = await secondAdminAgent.post('/api/auth/login').send({
      email: secondAdminEmail,
      password: 'Password123!',
    });
    if (secondAdminReloginResponse.status !== 200) {
      throw new Error(
        `Failed to relogin secondary admin. Status: ${secondAdminReloginResponse.status}, Body: ${JSON.stringify(secondAdminReloginResponse.body)}`
      );
    }

    clientAgent = createTestAgent();
    const clientEmail = `client-sc-${timestamp}@automanager-test.com`;

    const registerClientResponse = await clientAgent.post('/api/auth/register-client').send({
      email: clientEmail,
      password: 'Password123!',
      firstName: 'Maria',
      lastName: 'Georgieva',
      phone: '0888999777',
      uniqueCode: primaryUniqueCode,
      role: 'CLIENT'
    });
    if (registerClientResponse.status !== 201) {
      throw new Error(
        `Failed to register client. Status: ${registerClientResponse.status}, Body: ${JSON.stringify(registerClientResponse.body)}`
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

    const initialPendingRequest = await prisma.pendingRequest.findFirst({
      where: {
        email: clientEmail,
        requestType: 'CLIENT',
        serviceCompanyId: primaryServiceCompanyId,
        status: 'PENDING',
      },
      select: { id: true },
    });
    if (!initialPendingRequest) {
      throw new Error('Initial client pending request not found');
    }

    const approveInitialRequestResponse = await adminAgent
      .patch(`/api/pending-requests/${initialPendingRequest.id}/approve`)
      .send();
    if (approveInitialRequestResponse.status !== 200) {
      throw new Error(
        `Failed to approve initial client request. Status: ${approveInitialRequestResponse.status}, Body: ${JSON.stringify(approveInitialRequestResponse.body)}`
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

  it('should get service company details for admin', async () => {
    const response = await adminAgent.get('/api/service-company');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('serviceCompany');
    expect(response.body.serviceCompany.id).toBe(primaryServiceCompanyId);
  });

  it('should update service company details', async () => {
    const response = await adminAgent.put('/api/service-company').send({
      name: 'Updated Garage Name',
      address: 'Updated Address 456',
      phone: '0888123456',
      email: 'updated-garage@automanager-test.com',
    });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('serviceCompany');
    expect(response.body.serviceCompany.name).toBe('Updated Garage Name');
  });

  it('should create client join request using unique code', async () => {
    const response = await clientAgent.post('/api/client/service-companies/add').send({
      uniqueCode: secondaryUniqueCode,
    });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('request');
    pendingRequestId = response.body.request.id;
  });

  it('admin should approve client pending request', async () => {
    const response = await secondAdminAgent.patch(`/api/pending-requests/${pendingRequestId}/approve`);

    expect(response.status).toBe(200);
  });

  it('client should see service company and be able to leave', async () => {
    const listResp = await clientAgent.get('/api/client/service-companies');

    expect(listResp.status).toBe(200);
    const company = listResp.body.serviceCompanies.find(
      (entry: any) => entry.serviceCompany.id === secondaryServiceCompanyId
    );

    expect(company).toBeDefined();
    clientProfileId = company.clientId;

    const leaveResp = await clientAgent.delete(
      `/api/client/service-companies/${clientProfileId}/leave`
    );

    expect(leaveResp.status).toBe(200);
  });
});



