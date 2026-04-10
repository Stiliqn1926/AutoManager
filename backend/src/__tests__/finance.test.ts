import { resetIntegrationTestData } from './testDataCleanup';
import { createTestAgent } from './setup';
import prisma from '../config/database';

describe('Finance Endpoints', () => {
  let agent: any;
  let financeId: string;

  beforeAll(async () => {
    await resetIntegrationTestData();
    agent = createTestAgent();
    const timestamp = Date.now();
    const adminEmail = `admin-finance-${timestamp}@automanager-test.com`;

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
      name: `Test Garage Finance ${timestamp}`,
      address: 'Test Street 123',
      phone: '0888123456',
      email: `garage-finance-${timestamp}@automanager-test.com`,
    });

    if (companyResp.status !== 201 || !companyResp.body.serviceCompany) {
      throw new Error(
        `Failed to create service company. Status: ${companyResp.status}, Body: ${JSON.stringify(companyResp.body)}`
      );
    }

    await agent.post('/api/auth/login').send({
      email: adminEmail,
      password: 'Password123!',
    });
  });

  it('should create a finance transaction', async () => {
    const response = await agent.post('/api/finances').send({
      type: 'EXPENSE',
      category: 'PARTS',
      amount: 120.5,
      description: 'Test expense',
      date: new Date().toISOString(),
    });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('finance');
    financeId = response.body.finance.id;
  });

  it('should list finance transactions', async () => {
    const response = await agent.get('/api/finances');

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.finances)).toBe(true);
  });

  it('should get finance summary', async () => {
    const response = await agent.get('/api/finances/summary');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('summary');
  });

  it('should get finance by id', async () => {
    const response = await agent.get(`/api/finances/${financeId}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('finance');
    expect(response.body.finance.id).toBe(financeId);
  });

  it('should update finance transaction', async () => {
    const response = await agent.put(`/api/finances/${financeId}`).send({
      type: 'EXPENSE',
      category: 'LABOR',
      amount: 200,
      description: 'Updated expense',
      date: new Date().toISOString(),
    });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('finance');
    expect(response.body.finance.description).toBe('Updated expense');
  });

  it('should delete finance transaction', async () => {
    const response = await agent.delete(`/api/finances/${financeId}`);

    expect(response.status).toBe(200);
  });
});



