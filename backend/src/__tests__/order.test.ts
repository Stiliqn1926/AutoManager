import { createTestAgent } from './setup';
import prisma from '../config/database';

describe('Order Endpoints', () => {
  let agent: any;
  let serviceCompanyId: string;
  let clientId: string;
  let vehicleId: string;

  // ✅ Setup - създай ADMIN, клиент и автомобил преди тестовете (С AGENT!)
  beforeAll(async () => {
    agent = createTestAgent();  // ✅ Agent пази cookies!
    const timestamp = Date.now();

    // 1. Регистрирай ADMIN (cookies saved automatically)
    const adminEmail = `admin-order-${timestamp}@test.com`;
    await agent
      .post('/api/auth/register')
      .send({
        email: adminEmail,
        password: 'Password123!',
        role: 'ADMIN',
      });

    // 2. Login (cookies saved automatically)
    await agent
      .post('/api/auth/login')
      .send({
        email: adminEmail,
        password: 'Password123!',
      });

    const companyResp = await agent
      .post('/api/service-company')
      .send({
        name: `Test Garage ${timestamp}`,
        address: 'Test Street 123',
        phone: '0888123456',
        email: `garage-order-${timestamp}@test.com`,
      });

    if (companyResp.status !== 201 || !companyResp.body.serviceCompany) {
      throw new Error(`Failed to create service company. Status: ${companyResp.status}, Body: ${JSON.stringify(companyResp.body)}`);
    }

    serviceCompanyId = companyResp.body.serviceCompany.id;

    await agent
      .post('/api/auth/login')
      .send({
        email: adminEmail,
        password: 'Password123!',
      });

    const clientResponse = await agent
      .post('/api/clients')
      .send({
        firstName: 'Иван',
        lastName: 'Иванов',
        phone: '0888111222',
        email: `ivan-${timestamp}@test.com`,
      });

    clientId = clientResponse.body.client.id;

    const vehicleResponse = await agent
      .post('/api/vehicles')
      .send({
        clientId,
        brand: 'Toyota',
        model: 'Corolla',
        year: 2020,
        licensePlate: `CB${timestamp.toString().slice(-4)}AB`,
      });

    vehicleId = vehicleResponse.body.vehicle.id;
  });

  describe('POST /api/orders', () => {
    it('should create a new order', async () => {
      const response = await agent 
        .post('/api/orders')
        .send({
          vehicleId,
          clientId,
          description: 'Смяна на масло и филтри',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('order');
      expect(response.body.order.description).toBe('Смяна на масло и филтри');
      expect(response.body.order.status).toBe('WAITING');
    });

    it('should fail without authentication', async () => {
      const unauthAgent = createTestAgent(); 

      const response = await unauthAgent
        .post('/api/orders')
        .send({
          vehicleId,
          clientId,
          description: 'Test order',
        });

      expect(response.status).toBe(401);
    });

    it('should fail with short description', async () => {
      const response = await agent
        .post('/api/orders')
        .send({
          vehicleId,
          clientId,
          description: 'AB',  
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/orders', () => {
    it('should get all orders with pagination', async () => {
      const response = await agent.get('/api/orders?page=1&limit=10');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('orders');
      expect(response.body).toHaveProperty('pagination');
      expect(Array.isArray(response.body.orders)).toBe(true);
    });

    it('should fail without authentication', async () => {
      const unauthAgent = createTestAgent();

      const response = await unauthAgent.get('/api/orders');

      expect(response.status).toBe(401);
    });
  });

  describe('PUT /api/orders/:id/status', () => {
    let orderId: string;

    beforeAll(async () => {
      const response = await agent
        .post('/api/orders')
        .send({
          vehicleId,
          clientId,
          description: 'Test order for status update',
        });

      orderId = response.body.order.id;
    });

    it('should update order status', async () => {
      const response = await agent
        .put(`/api/orders/${orderId}/status`)
        .send({
          status: 'IN_PROGRESS',
        });

      expect(response.status).toBe(200);
      expect(response.body.order.status).toBe('IN_PROGRESS');
    });

    it('should fail with invalid status', async () => {
      const response = await agent
        .put(`/api/orders/${orderId}/status`)
        .send({
          status: 'INVALID_STATUS',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/orders/:id', () => {
    let orderId: string;

    beforeAll(async () => {     
      const response = await agent
        .post('/api/orders')
        .send({
          vehicleId,
          clientId,
          description: 'Test order for GET',
        });

      orderId = response.body.order.id;
    });

    it('should get order by ID', async () => {
      const response = await agent.get(`/api/orders/${orderId}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('order');
      expect(response.body.order.id).toBe(orderId);
    });

    it('should return 404 for non-existent order', async () => {
      const response = await agent.get('/api/orders/00000000-0000-0000-0000-000000000000');

      expect(response.status).toBe(404);
    });
  });
});
