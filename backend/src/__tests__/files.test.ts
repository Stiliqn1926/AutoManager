import { createTestAgent } from './setup';
import prisma from '../config/database';

describe('File upload/delete', () => {
  let agent: any;
  let clientId: string;
  let vehicleId: string;

  beforeAll(async () => {
    await prisma.$executeRawUnsafe('TRUNCATE TABLE "users" CASCADE');
    agent = createTestAgent();
    const timestamp = Date.now();
    const adminEmail = `admin-files-${timestamp}@test.com`;

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
      name: `Test Garage Files ${timestamp}`,
      address: 'Test Street 123',
      phone: '0888123456',
      email: `garage-files-${timestamp}@test.com`,
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

    const clientResp = await agent.post('/api/clients').send({
      firstName: 'Ivan',
      lastName: 'Ivanov',
      phone: '0888111222',
      email: `ivan-files-${timestamp}@test.com`,
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
  });

  it('should upload vehicle image (missing file -> 400)', async () => {
    const response = await agent.post(`/api/vehicles/${vehicleId}/upload-image`);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('message');
  });

  it('should delete vehicle image (not supported)', async () => {
    const response = await agent.delete(`/api/vehicles/${vehicleId}/image`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message');
  });
});
