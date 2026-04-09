import { createTestAgent } from './setup';
import prisma from '../config/database';

describe('Clients CRUD', () => {
  let agent: any;
  let serviceCompanyId: string;
  let clientId: string;

  beforeAll(async () => {
    await prisma.$executeRawUnsafe('TRUNCATE TABLE "users" CASCADE');
    agent = createTestAgent();
    const timestamp = Date.now();
    const adminEmail = `admin-clients-${timestamp}@test.com`;

    await agent.post('/api/auth/register').send({
      email: adminEmail,
      password: 'Password123!',
      role: 'ADMIN',
    });

    await agent.post('/api/auth/login').send({
      email: adminEmail,
      password: 'Password123!',
    });

    const companyResp = await agent.post('/api/service-company').send({
      name: `Test Garage Clients ${timestamp}`,
      address: 'Test Street 123',
      phone: '0888123456',
      email: `garage-clients-${timestamp}@test.com`,
    });

    if (companyResp.status !== 201 || !companyResp.body.serviceCompany) {
      throw new Error(
        `Failed to create service company. Status: ${companyResp.status}, Body: ${JSON.stringify(companyResp.body)}`
      );
    }

    serviceCompanyId = companyResp.body.serviceCompany.id;

    await agent.post('/api/auth/login').send({
      email: adminEmail,
      password: 'Password123!',
    });
  });

  it('should create a client', async () => {
    const timestamp = Date.now();
    const response = await agent.post('/api/clients').send({
      firstName: 'Ivan',
      lastName: 'Ivanov',
      phone: '0888111222',
      email: `ivan-${timestamp}@test.com`,
    });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('client');
    expect(response.body.client.serviceCompanyId).toBe(serviceCompanyId);

    clientId = response.body.client.id;
  });

  it('should list clients for the service company', async () => {
    const response = await agent.get('/api/clients');

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.clients)).toBe(true);
  });

  it('should get client by id', async () => {
    const response = await agent.get(`/api/clients/${clientId}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('client');
    expect(response.body.client.id).toBe(clientId);
  });

  it('should update client data', async () => {
    const response = await agent.put(`/api/clients/${clientId}`).send({
      firstName: 'Petar',
      lastName: 'Petrov',
      phone: '0888999888',
    });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('client');
    expect(response.body.client.firstName).toBe('Petar');
    expect(response.body.client.lastName).toBe('Petrov');
  });

  it('should delete (deactivate) client', async () => {
    const response = await agent.delete(`/api/clients/${clientId}`);

    expect(response.status).toBe(200);
  });
});

