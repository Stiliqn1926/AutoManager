import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DEMO_EMAIL_DOMAIN = '@automanager.demo';
const DEMO_UNIQUE_CODES = ['SRV001', 'SRV002', 'SRV003', 'SRV004', 'SRV005'];

async function main() {
  console.log('Започвам изтриване на demo данни...');

  const demoServices = await prisma.serviceCompany.findMany({
    where: {
      OR: [
        { uniqueCode: { in: DEMO_UNIQUE_CODES } },
        { email: { endsWith: DEMO_EMAIL_DOMAIN } },
        { name: { in: ['AutoPoint Център', 'МоторЛаб Младост', 'Prime Garage Люлин', 'Трак Кар Сървис', 'Авто Хъб Кършияка'] } },
      ],
    },
    select: { id: true },
  });

  const demoServiceIds = demoServices.map((service) => service.id);

  const demoUsers = await prisma.user.findMany({
    where: {
      email: { endsWith: DEMO_EMAIL_DOMAIN },
    },
    select: { id: true },
  });

  const demoUserIds = demoUsers.map((user) => user.id);

  const deletedNotifications = await prisma.notification.deleteMany({
    where: {
      OR: [
        { order: { serviceCompanyId: { in: demoServiceIds } } },
        { client: { serviceCompanyId: { in: demoServiceIds } } },
      ],
    },
  });

  const deletedSchedules = await prisma.schedule.deleteMany({
    where: {
      OR: [
        { serviceCompanyId: { in: demoServiceIds } },
        { title: { startsWith: 'Демо задача' } },
      ],
    },
  });

  const deletedInvoices = await prisma.invoice.deleteMany({
    where: {
      OR: [
        { serviceCompanyId: { in: demoServiceIds } },
        { invoiceNumber: { startsWith: 'INV-DEMO-' } },
      ],
    },
  });

  const deletedOrderItems = await prisma.orderItem.deleteMany({
    where: {
      OR: [
        { serviceCompanyId: { in: demoServiceIds } },
        { order: { orderNumber: { startsWith: 'DEMO-' } } },
      ],
    },
  });

  const deletedOrders = await prisma.order.deleteMany({
    where: {
      OR: [
        { serviceCompanyId: { in: demoServiceIds } },
        { orderNumber: { startsWith: 'DEMO-' } },
      ],
    },
  });

  const deletedFinances = await prisma.finance.deleteMany({
    where: {
      OR: [
        { serviceCompanyId: { in: demoServiceIds } },
        { description: { contains: '[DEMO]' } },
      ],
    },
  });

  const deletedSuppliers = await prisma.supplier.deleteMany({
    where: {
      OR: [
        { serviceCompanyId: { in: demoServiceIds } },
        { notes: { contains: '[DEMO]' } },
      ],
    },
  });

  const deletedVehicles = await prisma.vehicle.deleteMany({
    where: {
      OR: [
        { serviceCompanyId: { in: demoServiceIds } },
        { licensePlate: { startsWith: 'DE' } },
      ],
    },
  });

  const deletedPendingRequests = await prisma.pendingRequest.deleteMany({
    where: {
      OR: [
        { serviceCompanyId: { in: demoServiceIds } },
        { email: { endsWith: DEMO_EMAIL_DOMAIN } },
      ],
    },
  });

  const deletedMechanicMemberships = await prisma.mechanicServiceCompany.deleteMany({
    where: {
      OR: [
        { serviceCompanyId: { in: demoServiceIds } },
        { worker: { email: { endsWith: DEMO_EMAIL_DOMAIN } } },
      ],
    },
  });

  const deletedClients = await prisma.client.deleteMany({
    where: {
      OR: [
        { serviceCompanyId: { in: demoServiceIds } },
        { userId: { in: demoUserIds } },
        { email: { endsWith: DEMO_EMAIL_DOMAIN } },
      ],
    },
  });

  const deletedWorkers = await prisma.worker.deleteMany({
    where: {
      OR: [
        { serviceCompanyId: { in: demoServiceIds } },
        { userId: { in: demoUserIds } },
        { email: { endsWith: DEMO_EMAIL_DOMAIN } },
      ],
    },
  });

  const deletedPendingRegistrations = await prisma.pendingAdminRegistration.deleteMany({
    where: {
      email: { endsWith: DEMO_EMAIL_DOMAIN },
    },
  });

  const deletedServices = await prisma.serviceCompany.deleteMany({
    where: {
      id: { in: demoServiceIds },
    },
  });

  const deletedUsers = await prisma.user.deleteMany({
    where: {
      id: { in: demoUserIds },
    },
  });

  console.log('Demo cleanup е завършен.');
  console.log({
    deletedNotifications: deletedNotifications.count,
    deletedSchedules: deletedSchedules.count,
    deletedInvoices: deletedInvoices.count,
    deletedOrderItems: deletedOrderItems.count,
    deletedOrders: deletedOrders.count,
    deletedFinances: deletedFinances.count,
    deletedSuppliers: deletedSuppliers.count,
    deletedVehicles: deletedVehicles.count,
    deletedPendingRequests: deletedPendingRequests.count,
    deletedMechanicMemberships: deletedMechanicMemberships.count,
    deletedClients: deletedClients.count,
    deletedWorkers: deletedWorkers.count,
    deletedPendingRegistrations: deletedPendingRegistrations.count,
    deletedServices: deletedServices.count,
    deletedUsers: deletedUsers.count,
  });
}

main()
  .catch((error) => {
    console.error('Cleanup error:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

