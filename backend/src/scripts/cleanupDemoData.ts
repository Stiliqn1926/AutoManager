import { PrismaClient } from '@prisma/client';
import { serviceSeeds } from './demoSeedData';

const prisma = new PrismaClient();

const DEMO_DOMAIN = '@automanager.bg';

const buildDemoEmails = (): string[] => [
  ...serviceSeeds.map((s) => `admin${s.index}${DEMO_DOMAIN}`),
  ...Array.from({ length: 8 }, (_, i) => `mechanic${i + 1}${DEMO_DOMAIN}`),
  ...Array.from({ length: 30 }, (_, i) => `client${i + 1}${DEMO_DOMAIN}`),
  ...Array.from({ length: 3 }, (_, i) => `pending.mechanic${i + 1}${DEMO_DOMAIN}`),
  ...Array.from({ length: 3 }, (_, i) => `pending.client${i + 1}${DEMO_DOMAIN}`),
];

async function main() {
  console.log('Започва изтриване на demo данни...');

  const demoEmails = buildDemoEmails();
  const serviceIds = (
    await prisma.serviceCompany.findMany({
      where: { uniqueCode: { in: serviceSeeds.map((s) => s.uniqueCode) } },
      select: { id: true },
    })
  ).map((s) => s.id);

  const userIds = (
    await prisma.user.findMany({
      where: {
        OR: [
          { email: { in: demoEmails } },
          { email: { startsWith: 'admin', endsWith: DEMO_DOMAIN } },
          { email: { startsWith: 'mechanic', endsWith: DEMO_DOMAIN } },
          { email: { startsWith: 'client', endsWith: DEMO_DOMAIN } },
          { email: { startsWith: 'pending.', endsWith: DEMO_DOMAIN } },
        ],
      },
      select: { id: true },
    })
  ).map((u) => u.id);

  const deletedNotifications = await prisma.notification.deleteMany({
    where: {
      OR: [
        { order: { serviceCompanyId: { in: serviceIds } } },
        { client: { serviceCompanyId: { in: serviceIds } } },
      ],
    },
  });

  const deletedSchedules = await prisma.schedule.deleteMany({
    where: {
      OR: [
        { serviceCompanyId: { in: serviceIds } },
        { title: { startsWith: 'Демо задача' } },
      ],
    },
  });

  const deletedInvoices = await prisma.invoice.deleteMany({
    where: {
      OR: [
        { serviceCompanyId: { in: serviceIds } },
        { invoiceNumber: { startsWith: 'INV-DEMO-' } },
      ],
    },
  });

  const deletedOrderItems = await prisma.orderItem.deleteMany({
    where: {
      OR: [
        { serviceCompanyId: { in: serviceIds } },
        { order: { orderNumber: { startsWith: 'DEMO-' } } },
      ],
    },
  });

  const deletedOrders = await prisma.order.deleteMany({
    where: {
      OR: [
        { serviceCompanyId: { in: serviceIds } },
        { orderNumber: { startsWith: 'DEMO-' } },
      ],
    },
  });

  const deletedFinances = await prisma.finance.deleteMany({
    where: {
      OR: [
        { serviceCompanyId: { in: serviceIds } },
        { description: { contains: '[DEMO]' } },
      ],
    },
  });

  const deletedSuppliers = await prisma.supplier.deleteMany({
    where: {
      OR: [
        { serviceCompanyId: { in: serviceIds } },
        { notes: { contains: '[DEMO]' } },
      ],
    },
  });

  const deletedVehicles = await prisma.vehicle.deleteMany({
    where: {
      OR: [
        { serviceCompanyId: { in: serviceIds } },
        { licensePlate: { startsWith: 'PB' } },
      ],
    },
  });

  const deletedPendingRequests = await prisma.pendingRequest.deleteMany({
    where: {
      OR: [
        { serviceCompanyId: { in: serviceIds } },
        { email: { in: demoEmails } },
      ],
    },
  });

  const deletedMechanicMemberships = await prisma.mechanicServiceCompany.deleteMany({
    where: {
      OR: [
        { serviceCompanyId: { in: serviceIds } },
        { worker: { userId: { in: userIds } } },
      ],
    },
  });

  const deletedClients = await prisma.client.deleteMany({
    where: {
      OR: [
        { serviceCompanyId: { in: serviceIds } },
        { userId: { in: userIds } },
      ],
    },
  });

  const deletedWorkers = await prisma.worker.deleteMany({
    where: {
      OR: [
        { serviceCompanyId: { in: serviceIds } },
        { userId: { in: userIds } },
      ],
    },
  });

  const deletedPendingRegistrations = await prisma.pendingAdminRegistration.deleteMany({
    where: {
      email: { in: demoEmails },
    },
  });

  const deletedServices = await prisma.serviceCompany.deleteMany({
    where: { id: { in: serviceIds } },
  });

  const deletedUsers = await prisma.user.deleteMany({
    where: { id: { in: userIds } },
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

