import { createTestAgent } from './setup';
import prisma from '../config/database';

describe('Invoices Endpoints', () => {
  let agent: any;
  let serviceCompanyId: string;
  let clientId: string;
  let vehicleId: string;
  let orderId: string;
  let invoiceId: string;

  beforeAll(async () => {
    await prisma.$executeRawUnsafe('TRUNCATE TABLE "users" CASCADE');
    agent = createTestAgent();
    const timestamp = Date.now();
    const adminEmail = `admin-invoice-${timestamp}@test.com`;

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
      name: `Test Garage Invoice ${timestamp}`,
      address: 'Test Street 123',
      phone: '0888123456',
      email: `garage-invoice-${timestamp}@test.com`,
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

    const clientResp = await agent.post('/api/clients').send({
      firstName: 'Ivan',
      lastName: 'Ivanov',
      phone: '0888111222',
      email: `ivan-invoice-${timestamp}@test.com`,
    });

    if (clientResp.status !== 201 || !clientResp.body.client) {
      throw new Error(
        `Failed to create client. Status: ${clientResp.status}, Body: ${JSON.stringify(clientResp.body)}`
      );
    }

    clientId = clientResp.body.client.id;

    const vehicleResp = await agent.post('/api/vehicles').send({
      clientId,
      brand: 'Toyota',
      model: 'Corolla',
      year: 2020,
      licensePlate: `CB${timestamp.toString().slice(-4)}AB`,
    });

    if (vehicleResp.status !== 201 || !vehicleResp.body.vehicle) {
      throw new Error(
        `Failed to create vehicle. Status: ${vehicleResp.status}, Body: ${JSON.stringify(vehicleResp.body)}`
      );
    }

    vehicleId = vehicleResp.body.vehicle.id;

    const orderResp = await agent.post('/api/orders').send({
      vehicleId,
      clientId,
      description: 'Invoice order',
    });

    if (orderResp.status !== 201 || !orderResp.body.order) {
      throw new Error(
        `Failed to create order. Status: ${orderResp.status}, Body: ${JSON.stringify(orderResp.body)}`
      );
    }

    orderId = orderResp.body.order.id;

    await prisma.orderItem.create({
      data: {
        orderId,
        serviceCompanyId,
        type: 'LABOR',
        name: 'Test service',
        description: 'Test service',
        quantity: 1,
        unitPrice: 50,
        totalPrice: 50,
      },
    });
  });

  it('should create invoice for order', async () => {
    const response = await agent.post(`/api/invoices/order/${orderId}`).send({
      notes: 'Initial invoice',
    });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('invoice');
    invoiceId = response.body.invoice.id;
  });

  it('should get invoice by order id', async () => {
    const response = await agent.get(`/api/invoices/order/${orderId}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('invoice');
    expect(response.body.invoice.orderId).toBe(orderId);
  });

  it('should get invoice by id', async () => {
    const response = await agent.get(`/api/invoices/${invoiceId}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('invoice');
    expect(response.body.invoice.id).toBe(invoiceId);
  });

  it('should update invoice', async () => {
    const response = await agent.put(`/api/invoices/${invoiceId}`).send({
      notes: 'Updated invoice',
    });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('invoice');
    expect(response.body.invoice.notes).toBe('Updated invoice');
  });

  it('should mark invoice as paid', async () => {
    const response = await agent.put(`/api/invoices/${invoiceId}/pay`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('invoice');
    expect(response.body.invoice.isPaid).toBe(true);
  });

  it('should delete invoice', async () => {
    const response = await agent.delete(`/api/invoices/${invoiceId}`);

    expect(response.status).toBe(200);
  });
});
