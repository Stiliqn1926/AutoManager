import request from 'supertest';
import app from '../app';

describe('Order Endpoints', () => {
  let adminToken: string;
  let serviceCompanyId: string;
  let clientId: string;
  let vehicleId: string;

  // Setup - създай ADMIN, клиент и автомобил преди тестовете
  beforeAll(async () => {
    const timestamp = Date.now();
    
    // 1. Регистрирай ADMIN
    const adminEmail = `admin-order-${timestamp}@test.com`;
    await request(app)
      .post('/api/auth/register')
      .send({
        email: adminEmail,
        password: 'password123',
        role: 'ADMIN',
      });

    // 2. Първи login (без serviceCompanyId)
    let loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: adminEmail,
        password: 'password123',
      });

    let tempToken = loginResponse.body.token;

    // 3. Създай Service Company
    const companyResponse = await request(app)
      .post('/api/service-company')
      .set('Authorization', `Bearer ${tempToken}`)
      .send({
        name: `Test Garage ${timestamp}`,
        address: 'Test Street 123',
        phone: '0888123456',
        email: `garage-order-${timestamp}@test.com`,
      });

    serviceCompanyId = companyResponse.body.serviceCompany.id;

    // 4. Втори login (СЪС serviceCompanyId в токена)
    loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: adminEmail,
        password: 'password123',
      });

    adminToken = loginResponse.body.token;

    // 5. Създай клиент
    const clientResponse = await request(app)
      .post('/api/clients')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        firstName: 'Иван',
        lastName: 'Иванов',
        phone: '0888111222',
        email: `ivan-${timestamp}@test.com`,
      });

    clientId = clientResponse.body.client.id;

    // 6. Създай автомобил
    const vehicleResponse = await request(app)
      .post('/api/vehicles')
      .set('Authorization', `Bearer ${adminToken}`)
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
      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${adminToken}`)
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
      const response = await request(app)
        .post('/api/orders')
        .send({
          vehicleId,
          clientId,
          description: 'Test order',
        });

      expect(response.status).toBe(401);
    });

    it('should fail with short description', async () => {
      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          vehicleId,
          clientId,
          description: 'Short',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('errors');
    });
  });

  describe('GET /api/orders', () => {
    it('should get all orders with pagination', async () => {
      const response = await request(app)
        .get('/api/orders?page=1&limit=10')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('orders');
      expect(response.body).toHaveProperty('pagination');
      expect(Array.isArray(response.body.orders)).toBe(true);
    });

    it('should fail without authentication', async () => {
      const response = await request(app).get('/api/orders');

      expect(response.status).toBe(401);
    });
  });

  describe('PUT /api/orders/:id/status', () => {
    let orderId: string;

    beforeAll(async () => {
      // Създай order за update теста
      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          vehicleId,
          clientId,
          description: 'Тест поръчка за статус',
        });

      orderId = response.body.order.id;
    });

    it('should update order status', async () => {
      const response = await request(app)
        .put(`/api/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'IN_PROGRESS',
        });

      expect(response.status).toBe(200);
      expect(response.body.order.status).toBe('IN_PROGRESS');
    });

    it('should fail with invalid status', async () => {
      const response = await request(app)
        .put(`/api/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'INVALID_STATUS',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/orders/:id', () => {
    let orderId: string;

    beforeAll(async () => {
      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          vehicleId,
          clientId,
          description: 'Тест поръчка за GET',
        });

      orderId = response.body.order.id;
    });

    it('should get order by ID', async () => {
      const response = await request(app)
        .get(`/api/orders/${orderId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('order');
      expect(response.body.order.id).toBe(orderId);
    });

    it('should return 404 for non-existent order', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await request(app)
        .get(`/api/orders/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });
  });
});