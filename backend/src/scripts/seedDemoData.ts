import {
  FinanceCategory,
  FinanceType,
  MembershipStatus,
  OrderStatus,
  PrismaClient,
  RequestStatus,
  RequestType,
  SchedulePriority,
  ScheduleStatus,
  SubscriptionStatus,
  SupplierType,
  UserRole,
} from '@prisma/client';
import bcrypt from 'bcryptjs';
import {
  clientFirstNames,
  clientLastNames,
  mechanicSeeds,
  pendingClients,
  pendingMechanics,
  repairTemplates,
  serviceSeeds,
  vehicleBrands,
  vehicleModels,
} from './demoSeedData';

const prisma = new PrismaClient();
const DEMO_PASSWORD = 'Demo12345!';
const SEED_YEAR = 2026;

const toDate = (month: number, day: number, hour = 9): Date =>
  new Date(Date.UTC(SEED_YEAR, month - 1, day, hour, 0, 0));
const addDays = (date: Date, days: number): Date =>
  new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
const cents = (value: number): number => Math.round(value * 100);
const fromCents = (value: number): number => Number((value / 100).toFixed(2));
const formatSeedDate = (value: Date): string => {
  const day = String(value.getUTCDate()).padStart(2, '0');
  const month = String(value.getUTCMonth() + 1).padStart(2, '0');
  const year = value.getUTCFullYear();
  return `${day}.${month}.${year}`;
};

const scheduleStatusByOrder: Record<OrderStatus, ScheduleStatus> = {
  WAITING: ScheduleStatus.SCHEDULED,
  IN_PROGRESS: ScheduleStatus.IN_PROGRESS,
  READY: ScheduleStatus.READY,
  COMPLETED: ScheduleStatus.COMPLETED,
  CANCELLED: ScheduleStatus.CANCELLED,
};

const priorities: SchedulePriority[] = [
  SchedulePriority.NORMAL,
  SchedulePriority.HIGH,
  SchedulePriority.LOW,
  SchedulePriority.URGENT,
];

const allDemoEmails = (): string[] => [
  ...serviceSeeds.map((s) => `admin${s.index}@automanager.bg`),
  ...mechanicSeeds.map((s) => s.email),
  ...Array.from({ length: 30 }, (_, i) => `client${i + 1}@automanager.bg`),
  ...pendingMechanics.map((s) => s.email),
  ...pendingClients.map((s) => s.email),
];

const membershipsForClient = (clientIndex: number): number[] => {
  if (clientIndex <= 12) return [((clientIndex - 1) % 3) + 1];
  if (clientIndex <= 22) return [((clientIndex + 1) % 3) + 1, ((clientIndex + 2) % 3) + 1];
  return [1, 2, 3];
};

const vehicleCountForClient = (clientIndex: number): number => {
  if (clientIndex % 10 === 0 || clientIndex % 7 === 0) return 3;
  if (clientIndex % 2 === 0) return 2;
  return 1;
};

const orderStatusForMonth = (month: number, seed: number): OrderStatus => {
  if (month < 4) return seed % 8 === 0 ? OrderStatus.CANCELLED : OrderStatus.COMPLETED;
  return [OrderStatus.WAITING, OrderStatus.IN_PROGRESS, OrderStatus.READY, OrderStatus.COMPLETED][
    seed % 4
  ];
};

async function cleanupDemoData() {
  const demoEmails = allDemoEmails();
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
          { email: { startsWith: 'admin', endsWith: '@automanager.bg' } },
          { email: { startsWith: 'mechanic', endsWith: '@automanager.bg' } },
          { email: { startsWith: 'client', endsWith: '@automanager.bg' } },
          { email: { startsWith: 'pending.', endsWith: '@automanager.bg' } },
        ],
      },
      select: { id: true },
    })
  ).map((u) => u.id);

  await prisma.notification.deleteMany({ where: { OR: [{ order: { serviceCompanyId: { in: serviceIds } } }, { client: { serviceCompanyId: { in: serviceIds } } }] } });
  await prisma.schedule.deleteMany({ where: { OR: [{ serviceCompanyId: { in: serviceIds } }, { title: { startsWith: 'Демо задача' } }] } });
  await prisma.invoice.deleteMany({ where: { OR: [{ serviceCompanyId: { in: serviceIds } }, { invoiceNumber: { startsWith: 'INV-DEMO-' } }] } });
  await prisma.orderItem.deleteMany({ where: { OR: [{ serviceCompanyId: { in: serviceIds } }, { order: { orderNumber: { startsWith: 'DEMO-' } } }] } });
  await prisma.order.deleteMany({ where: { OR: [{ serviceCompanyId: { in: serviceIds } }, { orderNumber: { startsWith: 'DEMO-' } }] } });
  await prisma.finance.deleteMany({ where: { OR: [{ serviceCompanyId: { in: serviceIds } }, { description: { contains: '[DEMO]' } }] } });
  await prisma.supplier.deleteMany({ where: { OR: [{ serviceCompanyId: { in: serviceIds } }, { notes: { contains: '[DEMO]' } }] } });
  await prisma.vehicle.deleteMany({ where: { OR: [{ serviceCompanyId: { in: serviceIds } }, { licensePlate: { startsWith: 'PB' } }] } });
  await prisma.pendingRequest.deleteMany({ where: { OR: [{ serviceCompanyId: { in: serviceIds } }, { email: { in: demoEmails } }] } });
  await prisma.mechanicServiceCompany.deleteMany({ where: { OR: [{ serviceCompanyId: { in: serviceIds } }, { worker: { userId: { in: userIds } } }] } });
  await prisma.client.deleteMany({ where: { OR: [{ serviceCompanyId: { in: serviceIds } }, { userId: { in: userIds } }] } });
  await prisma.worker.deleteMany({ where: { OR: [{ serviceCompanyId: { in: serviceIds } }, { userId: { in: userIds } }] } });
  await prisma.pendingAdminRegistration.deleteMany({ where: { email: { in: demoEmails } } });
  await prisma.serviceCompany.deleteMany({ where: { id: { in: serviceIds } } });
  await prisma.user.deleteMany({ where: { id: { in: userIds } } });
}

async function main() {
  console.log('Започва зареждане на демо данни...');
  await cleanupDemoData();

  const hash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const serviceMap = new Map<number, string>();
  const workersByService = new Map<number, string[]>();
  const suppliersByService = new Map<number, Array<{ id: string; type: SupplierType }>>();
  const clientsByService = new Map<number, Array<{ clientId: string; vehicles: string[]; seed: number }>>();
  const monthly = new Map<string, { income: number; parts: number; cons: number }>();

  for (const s of serviceSeeds) {
    const admin = await prisma.user.create({
      data: { email: `admin${s.index}@automanager.bg`, password: hash, role: UserRole.ADMIN, isActive: true, emailVerified: true },
    });
    const company = await prisma.serviceCompany.create({
      data: {
        userId: admin.id,
        name: s.name,
        address: `${s.address}, ${s.city}`,
        phone: s.phone,
        email: s.email,
        uniqueCode: s.uniqueCode,
        bulstat: s.bulstat,
        vatNumber: s.vatNumber,
        description: s.description,
        subscriptionStatus: SubscriptionStatus.ACTIVE,
        subscriptionCurrentPeriodEnd: addDays(new Date(), 365),
      },
    });
    serviceMap.set(s.index, company.id);
    const supplierRows = [
      {
        type: SupplierType.PARTS,
        name: `${s.district} Партс Логистик`,
        contactPerson: 'Ивайло Николов',
        email: `parts.${s.uniqueCode.toLowerCase()}@automanager.bg`,
        website: `https://parts-${s.uniqueCode.toLowerCase()}.bg`,
        deliveryNotes: 'Доставка до 24 часа за налични части. Минимална поръчка 40 €.',
      },
      {
        type: SupplierType.CONSUMABLES,
        name: `${s.district} Флуид Център`,
        contactPerson: 'Петя Маринова',
        email: `fluids.${s.uniqueCode.toLowerCase()}@automanager.bg`,
        website: `https://fluids-${s.uniqueCode.toLowerCase()}.bg`,
        deliveryNotes: 'Доставка в рамките на работния ден за масла и течности.',
      },
      {
        type: SupplierType.TIRES,
        name: `${s.district} Тайър Маркет`,
        contactPerson: 'Христо Георгиев',
        email: `tires.${s.uniqueCode.toLowerCase()}@automanager.bg`,
        website: `https://tires-${s.uniqueCode.toLowerCase()}.bg`,
        deliveryNotes: 'Сезонни гуми и джанти с доставка до 48 часа.',
      },
      {
        type: SupplierType.SERVICES,
        name: `${s.district} Диагно Лаб`,
        contactPerson: 'Мария Симеонова',
        email: `services.${s.uniqueCode.toLowerCase()}@automanager.bg`,
        website: `https://diagno-${s.uniqueCode.toLowerCase()}.bg`,
        deliveryNotes:
          'Външни диагностични услуги и специализирани тестове с предварителна заявка.',
      },
    ];
    const refs: Array<{ id: string; type: SupplierType }> = [];
    for (let i = 0; i < supplierRows.length; i += 1) {
      const sr = supplierRows[i];
      const created = await prisma.supplier.create({
        data: {
          serviceCompanyId: company.id,
          name: sr.name,
          type: sr.type,
          contactPerson: sr.contactPerson,
          phonePrimary: `+359 88 5${s.index}${i} 100`,
          phoneSecondary: `+359 32 6${s.index}${i} 200`,
          email: sr.email,
          website: sr.website,
          addressLine: `${s.address}, кв. ${s.district}`,
          city: s.city,
          eik: `20${s.index}${i}4567${i}`,
          vatNumber: `BG20${s.index}${i}4567${i}`,
          deliveryNotes: sr.deliveryNotes,
          notes: '[DEMO] Доставчик за демонстрационни данни с пълно попълнени полета.',
          isPreferred: i === 0,
        },
      });
      refs.push({ id: created.id, type: created.type });
    }
    suppliersByService.set(s.index, refs);
  }

  for (const m of mechanicSeeds) {
    const user = await prisma.user.create({
      data: { email: m.email, password: hash, role: UserRole.MECHANIC, isActive: true, emailVerified: true },
    });
    const worker = await prisma.worker.create({
      data: {
        userId: user.id,
        firstName: m.firstName,
        lastName: m.lastName,
        email: m.email,
        phone: m.phone,
        specialization: m.specialization,
        skills: m.skills,
        serviceCompanyId: serviceMap.get(m.primaryService),
      },
    });
    for (const serviceIndex of m.memberships) {
      const serviceId = serviceMap.get(serviceIndex);
      if (!serviceId) continue;
      await prisma.mechanicServiceCompany.create({
        data: {
          workerId: worker.id,
          serviceCompanyId: serviceId,
          status: MembershipStatus.ACTIVE,
          joinedAt: toDate(2, 1 + ((m.index + serviceIndex) % 20), 9),
        },
      });
      const rows = workersByService.get(serviceIndex) ?? [];
      rows.push(worker.id);
      workersByService.set(serviceIndex, rows);
    }
  }

  for (const p of pendingMechanics) {
    const user = await prisma.user.create({ data: { email: p.email, password: hash, role: UserRole.MECHANIC, isActive: true, emailVerified: true } });
    const worker = await prisma.worker.create({
      data: {
        userId: user.id,
        firstName: p.firstName,
        lastName: p.lastName,
        email: p.email,
        phone: p.phone,
        specialization: 'Обща механика',
        skills: 'Чака одобрение',
        serviceCompanyId: null,
      },
    });
    const serviceId = serviceMap.get(p.targetService)!;
    await prisma.mechanicServiceCompany.create({ data: { workerId: worker.id, serviceCompanyId: serviceId, status: MembershipStatus.PENDING } });
    await prisma.pendingRequest.create({
      data: { requestType: RequestType.MECHANIC, email: p.email, firstName: p.firstName, lastName: p.lastName, phone: p.phone, status: RequestStatus.PENDING, serviceCompanyId: serviceId },
    });
  }

  for (let i = 1; i <= 30; i += 1) {
    const user = await prisma.user.create({
      data: {
        email: `client${i}@automanager.bg`,
        password: hash,
        role: UserRole.CLIENT,
        isActive: true,
        emailVerified: true,
      },
    });
    const memberships = membershipsForClient(i);
    const vehicleCount = vehicleCountForClient(i);
    const baseVehicles = Array.from({ length: vehicleCount }, (_, v) => {
      const seed = i * 100 + v * 7;
      return {
        brand: vehicleBrands[(i + v) % vehicleBrands.length],
        model: vehicleModels[(i + v) % vehicleModels.length],
        plate: `PB${String(1200 + (seed % 7600)).padStart(4, '0')}AB`,
        vin: `VINPLD${String(90000000000 + seed).slice(-11)}`,
        year: 2009 + (seed % 16),
        mileage: 78000 + (seed % 90000),
      };
    });
    for (let m = 0; m < memberships.length; m += 1) {
      const serviceIndex = memberships[m];
      const serviceId = serviceMap.get(serviceIndex);
      if (!serviceId) continue;
      const client = await prisma.client.create({
        data: {
          userId: user.id,
          serviceCompanyId: serviceId,
          firstName: clientFirstNames[i - 1],
          lastName: clientLastNames[i - 1],
          phone: `+359 88 2${String(i).padStart(6, '0')}`,
          email: `client${i}@automanager.bg`,
          address: `ул. Клиентска ${i + 10}, Пловдив`,
          isActive: true,
        },
      });
      const selected = baseVehicles.filter((_, idx) => m === 0 || (i + idx + serviceIndex) % 3 !== 0);
      const actual = selected.length > 0 ? selected : [baseVehicles[0]];
      const vehicleIds: string[] = [];
      for (const row of actual) {
        const vehicle = await prisma.vehicle.create({
          data: {
            clientId: client.id,
            serviceCompanyId: serviceId,
            brand: row.brand,
            model: row.model,
            year: row.year,
            licensePlate: row.plate,
            vin: row.vin,
            mileage: row.mileage,
          },
        });
        vehicleIds.push(vehicle.id);
      }
      const rows = clientsByService.get(serviceIndex) ?? [];
      rows.push({ clientId: client.id, vehicles: vehicleIds, seed: i * 10 + m });
      clientsByService.set(serviceIndex, rows);
    }
  }

  for (const p of pendingClients) {
    await prisma.user.create({ data: { email: p.email, password: hash, role: UserRole.CLIENT, isActive: true, emailVerified: true } });
    await prisma.pendingRequest.create({
      data: { requestType: RequestType.CLIENT, email: p.email, firstName: p.firstName, lastName: p.lastName, phone: p.phone, status: RequestStatus.PENDING, serviceCompanyId: serviceMap.get(p.targetService)! },
    });
  }

  let orderCounter = 0;
  let invoiceCounter = 0;

  for (const s of serviceSeeds) {
    const serviceId = serviceMap.get(s.index)!;
    const workers = workersByService.get(s.index) ?? [];
    const suppliers = suppliersByService.get(s.index) ?? [];
    const clients = clientsByService.get(s.index) ?? [];
    let serviceOrderCounter = 0;
    for (const profile of clients) {
      for (let v = 0; v < profile.vehicles.length; v += 1) {
        const repairs = (profile.seed + v) % 11 === 0 ? 5 : (profile.seed + v) % 7 === 0 ? 4 : 1 + ((profile.seed + v) % 3);
        for (let r = 0; r < repairs; r += 1) {
          orderCounter += 1;
          serviceOrderCounter += 1;
          const tpl = repairTemplates[(orderCounter + r + s.index) % repairTemplates.length];
          const month = ((orderCounter + profile.seed + r) % 4) + 1;
          const day = 1 + ((orderCounter * 3 + profile.seed + v) % 26);
          const startDate = toDate(month, day, 8 + ((orderCounter + v) % 7));
          const status = orderStatusForMonth(month, orderCounter + s.index + r);
          const priority = priorities[(orderCounter + r) % priorities.length];
          const endDate = status === OrderStatus.WAITING ? null : addDays(startDate, 1);
          const completedDate = status === OrderStatus.COMPLETED ? addDays(startDate, 2) : null;
          const workerId = workers.length ? workers[(orderCounter + v) % workers.length] : null;
          const supplierOptions = suppliers.filter((x) => x.type === tpl.supplierType);
          const supplierId = supplierOptions.length ? supplierOptions[(orderCounter + r) % supplierOptions.length].id : null;

          const order = await prisma.order.create({
            data: {
              orderNumber: `DEMO-${s.index}-${String(serviceOrderCounter).padStart(4, '0')}`,
              displayOrderNumber: `#${s.index}${String(1000 + serviceOrderCounter)}`,
              description: tpl.description,
              diagnosis: tpl.diagnosis,
              notes: `[DEMO] ${tpl.title}`,
              status,
              priority,
              startDate,
              endDate,
              completedDate,
              clientId: profile.clientId,
              vehicleId: profile.vehicles[v],
              workerId,
              serviceCompanyId: serviceId,
              supplierId,
            },
          });

          const items = [
            { type: 'LABOR' as const, name: tpl.labor.name, quantity: tpl.labor.quantity, unitPrice: tpl.labor.unitPrice },
            ...tpl.parts.map((p) => ({ type: 'PART' as const, name: p.name, quantity: p.quantity, unitPrice: p.unitPrice })),
            ...tpl.consumables.map((c) => ({ type: 'CONSUMABLE' as const, name: c.name, quantity: c.quantity, unitPrice: c.unitPrice })),
          ];
          const buildItemDescription = (itemType: 'LABOR' | 'PART' | 'CONSUMABLE', itemName: string): string => {
            if (itemType === 'LABOR') {
              return `${tpl.title} - сервизна дейност`;
            }

            if (itemType === 'PART') {
              return `Подменена част: ${itemName}`;
            }

            return `Използван консуматив: ${itemName}`;
          };
          await prisma.orderItem.createMany({
            data: items.map((i) => ({
              orderId: order.id,
              serviceCompanyId: serviceId,
              type: i.type,
              name: i.name,
              quantity: i.quantity,
              unitPrice: i.unitPrice,
              totalPrice: i.quantity * i.unitPrice,
              description: buildItemDescription(i.type, i.name),
            })),
          });
          const total = Number(items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0).toFixed(2));
          await prisma.order.update({ where: { id: order.id }, data: { totalPrice: total } });

          const key = `${s.index}-${month}`;
          const bucket = monthly.get(key) ?? { income: 0, parts: 0, cons: 0 };
          const partsCost = items.filter((i) => i.type === 'PART').reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
          const consCost = items.filter((i) => i.type === 'CONSUMABLE').reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
          if (status !== OrderStatus.CANCELLED) {
            bucket.income += cents(total);
            bucket.parts += Math.round(cents(partsCost) * 0.58);
            bucket.cons += Math.round(cents(consCost) * 0.67);
          }
          monthly.set(key, bucket);

          if (month === 4) {
            await prisma.schedule.create({
              data: {
                title: `Демо задача #${s.index}${String(1000 + serviceOrderCounter)}`,
                description: `Планирана дейност: ${tpl.title}`,
                date: toDate(4, day, 8),
                startTime: startDate,
                endTime: addDays(startDate, 0),
                status: scheduleStatusByOrder[status],
                priority,
                workerId,
                orderId: order.id,
                serviceCompanyId: serviceId,
                isCompleted: status === OrderStatus.COMPLETED,
              },
            });
          }

          const shouldInvoice = status === OrderStatus.COMPLETED || (status === OrderStatus.READY && orderCounter % 2 === 0);
          if (shouldInvoice) {
            invoiceCounter += 1;
            const issue = endDate ?? addDays(startDate, 1);
            const paid = status === OrderStatus.COMPLETED && (month <= 3 || orderCounter % 3 === 0);
            await prisma.invoice.create({
              data: {
                invoiceNumber: `INV-DEMO-${s.index}-${String(invoiceCounter).padStart(4, '0')}`,
                subtotal: total,
                tax: 0,
                total,
                issueDate: issue,
                dueDate: addDays(issue, 7),
                isPaid: paid,
                paidDate: paid ? addDays(issue, 1) : null,
                paymentMethod: paid ? (orderCounter % 2 === 0 ? 'Карта' : 'Банков превод') : null,
                notes: '[DEMO] Автоматично генерирана фактура',
                orderId: order.id,
                serviceCompanyId: serviceId,
              },
            });
          }

          await prisma.notification.create({
            data: {
              clientId: profile.clientId,
              orderId: order.id,
              title: 'Статус на поръчка',
              message: `${tpl.title} — ${order.displayOrderNumber ?? order.orderNumber}`,
              isRead: orderCounter % 3 === 0,
            },
          });
        }
      }
    }
  }

  for (const s of serviceSeeds) {
    const serviceId = serviceMap.get(s.index)!;
    for (let month = 1; month <= 4; month += 1) {
      const key = `${s.index}-${month}`;
      const bucket = monthly.get(key) ?? { income: cents(2400), parts: cents(760), cons: cents(240) };
      const firstIncomeDate = toDate(month, 8, 10);
      const secondIncomeDate = toDate(month, 22, 10);
      const expenseDate = toDate(month, 25, 11);
      const periodLabel = `${String(month).padStart(2, '0')}.${SEED_YEAR}`;

      const normalizedPartsExpense = Math.min(
        920,
        Math.max(260, fromCents(Math.round(bucket.parts * 0.36)))
      );
      const normalizedConsumablesExpense = Math.min(
        320,
        Math.max(90, fromCents(Math.round(bucket.cons * 0.58)))
      );

      const adminFeeIncome = 65 + month * 7 + s.index * 9;
      const diagnosticIncome = 95 + month * 10 + s.index * 11;

      await prisma.finance.createMany({
        data: [
          {
            serviceCompanyId: serviceId,
            type: FinanceType.INCOME,
            category: FinanceCategory.OTHER,
            amount: adminFeeIncome,
            description: `[DEMO] Административна такса за прием на автомобили (${formatSeedDate(firstIncomeDate)})`,
            date: firstIncomeDate,
          },
          {
            serviceCompanyId: serviceId,
            type: FinanceType.INCOME,
            category: FinanceCategory.LABOR,
            amount: diagnosticIncome,
            description: `[DEMO] Платена външна диагностика (${formatSeedDate(secondIncomeDate)})`,
            date: secondIncomeDate,
          },
          {
            serviceCompanyId: serviceId,
            type: FinanceType.EXPENSE,
            category: FinanceCategory.PARTS,
            amount: normalizedPartsExpense,
            description: `[DEMO] Разход за резервни части (${periodLabel})`,
            date: expenseDate,
          },
          {
            serviceCompanyId: serviceId,
            type: FinanceType.EXPENSE,
            category: FinanceCategory.CONSUMABLES,
            amount: normalizedConsumablesExpense,
            description: `[DEMO] Разход за консумативи (${periodLabel})`,
            date: expenseDate,
          },
          {
            serviceCompanyId: serviceId,
            type: FinanceType.EXPENSE,
            category: FinanceCategory.SALARIES,
            amount: 1180 + s.index * 130 + month * 25,
            description: `[DEMO] Разход за възнаграждения (${periodLabel})`,
            date: expenseDate,
          },
          {
            serviceCompanyId: serviceId,
            type: FinanceType.EXPENSE,
            category: FinanceCategory.UTILITIES,
            amount: 170 + month * 12 + s.index * 9,
            description: `[DEMO] Разход за комунални услуги (${periodLabel})`,
            date: expenseDate,
          },
          {
            serviceCompanyId: serviceId,
            type: FinanceType.EXPENSE,
            category: FinanceCategory.RENT,
            amount: 620 + s.index * 70,
            description: `[DEMO] Разход за наем (${periodLabel})`,
            date: expenseDate,
          },
        ],
      });
    }
  }

  console.log('Demo seed завърши успешно.');
  console.log({ loginPassword: DEMO_PASSWORD });
}

main()
  .catch((error) => {
    console.error('Seed error:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

