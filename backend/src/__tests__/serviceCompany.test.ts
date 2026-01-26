import { createTestAgent } from './setup';
import prisma from '../config/database';

describe('Service Company Operations', () => {
  let adminAgent: any;
  let clientAgent: any;
  let serviceCompanyId: string;
  let uniqueCode: string;
  let clientProfileId: string;
  let pendingRequestId: string;

  beforeAll(async () => {
    await prisma.$executeRawUnsafe('TRUNCATE TABLE "users" CASCADE');
    const timestamp = Date.now();

    adminAgent = createTestAgent();
    const adminEmail = `admin-sc-${timestamp}@test.com`;

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
      name: `Test Garage SC ${timestamp}`,
      address: 'Test Street 123',
      phone: '0888123456',
      email: `garage-sc-${timestamp}@test.com`,
    });

    if (companyResp.status !== 201 || !companyResp.body.serviceCompany) {
      throw new Error(
        `Failed to create service company. Status: ${companyResp.status}, Body: ${JSON.stringify(companyResp.body)}`
      );
    }

    serviceCompanyId = companyResp.body.serviceCompany.id;
    uniqueCode = companyResp.body.serviceCompany.uniqueCode;

    await adminAgent.post('/api/auth/login').send({
      email: adminEmail,
      password: 'Password123!',
    });

    clientAgent = createTestAgent();
    const clientEmail = `client-sc-${timestamp}@test.com`;

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

  it('should get service company details for admin', async () => {
    const response = await adminAgent.get('/api/service-company');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('serviceCompany');
    expect(response.body.serviceCompany.id).toBe(serviceCompanyId);
  });

  it('should update service company details', async () => {
    const response = await adminAgent.put('/api/service-company').send({
      name: 'Updated Garage Name',
      address: 'Updated Address 456',
      phone: '0888123456',
      email: 'updated-garage@test.com',
    });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('serviceCompany');
    expect(response.body.serviceCompany.name).toBe('Updated Garage Name');
  });

  it('should create client join request using unique code', async () => {
    const response = await clientAgent.post('/api/client/service-companies/add').send({
      uniqueCode,
    });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('request');
    pendingRequestId = response.body.request.id;
  });

  it('admin should approve client pending request', async () => {
    const response = await adminAgent.patch(`/api/pending-requests/${pendingRequestId}/approve`);

    expect(response.status).toBe(200);
  });

  it('client should see service company and be able to leave', async () => {
    const listResp = await clientAgent.get('/api/client/service-companies');

    expect(listResp.status).toBe(200);
    const company = listResp.body.serviceCompanies.find(
      (entry: any) => entry.serviceCompany.id === serviceCompanyId
    );

    expect(company).toBeDefined();
    clientProfileId = company.clientId;

    const leaveResp = await clientAgent.delete(
      `/api/client/service-companies/${clientProfileId}/leave`
    );

    expect(leaveResp.status).toBe(200);
  });
});
