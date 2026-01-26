import { createTestAgent } from './setup';
import prisma from '../config/database';

describe('Vehicles CRUD', () => {
  let agent: any;
  let serviceCompanyId: string;
  let clientId: string;
  let vehicleId: string;

  beforeAll(async () => {
    await prisma.$executeRawUnsafe('TRUNCATE TABLE "users" CASCADE');
    agent = createTestAgent();
    const timestamp = Date.now();
    const adminEmail = `admin-vehicles-${timestamp}@test.com`;

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
      name: `Test Garage Vehicles ${timestamp}`,
      address: 'Test Street 123',
      phone: '0888123456',
      email: `garage-vehicles-${timestamp}@test.com`,
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
      firstName: 'Test',
      lastName: 'Client',
      phone: '0888000111',
      email: `client-vehicles-${timestamp}@test.com`,
    });

    if (clientResp.status !== 201 || !clientResp.body.client) {
      throw new Error(
        `Failed to create client. Status: ${clientResp.status}, Body: ${JSON.stringify(clientResp.body)}`
      );
    }

    clientId = clientResp.body.client.id;
  });

  it('should create a vehicle', async () => {
    const timestamp = Date.now();
    const response = await agent.post('/api/vehicles').send({
      clientId,
      brand: 'Toyota',
      model: 'Corolla',
      year: 2020,
      licensePlate: `CA${timestamp.toString().slice(-4)}AA`,
    });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('vehicle');
    expect(response.body.vehicle.clientId).toBe(clientId);

    vehicleId = response.body.vehicle.id;
  });

  it('should list vehicles for the service company', async () => {
    const response = await agent.get('/api/vehicles');

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.vehicles)).toBe(true);
  });

  it('should get vehicle by id', async () => {
    const response = await agent.get(`/api/vehicles/${vehicleId}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('vehicle');
    expect(response.body.vehicle.id).toBe(vehicleId);
  });

  it('should update vehicle data', async () => {
    const response = await agent.put(`/api/vehicles/${vehicleId}`).send({
      brand: 'Honda',
      model: 'Civic',
      year: 2021,
      licensePlate: 'CB1234AB',
      color: 'Blue',
      mileage: 12345,
    });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('vehicle');
    expect(response.body.vehicle.brand).toBe('Honda');
    expect(response.body.vehicle.model).toBe('Civic');
  });

  it('should delete vehicle without orders', async () => {
    const timestamp = Date.now();
    const createResp = await agent.post('/api/vehicles').send({
      clientId,
      brand: 'Ford',
      model: 'Focus',
      year: 2018,
      licensePlate: `CB${timestamp.toString().slice(-4)}ZZ`,
    });

    expect(createResp.status).toBe(201);
    const deleteId = createResp.body.vehicle.id;

    const deleteResp = await agent.delete(`/api/vehicles/${deleteId}`);

    expect(deleteResp.status).toBe(200);
  });
});
