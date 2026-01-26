import { createTestAgent } from './setup';
import prisma from '../config/database';

describe('Suppliers Endpoints', () => {
  let agent: any;
  let supplierId: string;

  beforeAll(async () => {
    await prisma.$executeRawUnsafe('TRUNCATE TABLE "users" CASCADE');
    agent = createTestAgent();
    const timestamp = Date.now();
    const adminEmail = `admin-suppliers-${timestamp}@test.com`;

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
      name: `Test Garage Suppliers ${timestamp}`,
      address: 'Test Street 123',
      phone: '0888123456',
      email: `garage-suppliers-${timestamp}@test.com`,
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

  it('should create a supplier', async () => {
    const response = await agent.post('/api/suppliers').send({
      name: 'Test Supplier',
      type: 'PARTS',
      phonePrimary: '0888123456',
      contactPerson: 'John Doe',
      email: 'supplier@test.com',
      city: 'Sofia',
    });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('supplier');
    supplierId = response.body.supplier.id;
  });

  it('should list suppliers', async () => {
    const response = await agent.get('/api/suppliers');

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.suppliers)).toBe(true);
  });

  it('should get supplier by id', async () => {
    const response = await agent.get(`/api/suppliers/${supplierId}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('supplier');
    expect(response.body.supplier.id).toBe(supplierId);
  });

  it('should update supplier', async () => {
    const response = await agent.put(`/api/suppliers/${supplierId}`).send({
      name: 'Updated Supplier',
      contactPerson: 'Jane Doe',
    });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('supplier');
    expect(response.body.supplier.name).toBe('Updated Supplier');
  });

  it('should toggle supplier status', async () => {
    const response = await agent.patch(`/api/suppliers/${supplierId}/toggle-status`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('supplier');
  });

  it('should toggle supplier preferred', async () => {
    const response = await agent.patch(`/api/suppliers/${supplierId}/toggle-preferred`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('supplier');
  });

  it('should delete supplier', async () => {
    const response = await agent.delete(`/api/suppliers/${supplierId}`);

    expect(response.status).toBe(200);
  });
});
