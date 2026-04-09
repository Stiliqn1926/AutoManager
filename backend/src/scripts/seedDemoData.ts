import {
  FinanceCategory,
  FinanceType,
  MembershipStatus,
  OrderStatus,
  PrismaClient,
  SchedulePriority,
  ScheduleStatus,
  SubscriptionStatus,
  SupplierType,
  UserRole,
} from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const DEMO_PASSWORD = 'Demo12345!';
const ORDERS_PER_SERVICE = 12;

type ServiceSeed = {
  index: number;
  name: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  bulstat: string;
  vatNumber: string;
  description: string;
};

type MechanicSeed = {
  index: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  specialization: string;
  skills: string;
  memberships: number[];
};

const serviceSeeds: ServiceSeed[] = [
  {
    index: 1,
    name: 'AutoPoint Център',
    address: 'бул. България 101',
    city: 'София',
    phone: '+359 2 910 1001',
    email: 'autopoint.center@automanager.demo',
    bulstat: '206000001',
    vatNumber: 'BG206000001',
    description: 'Сервиз за диагностика, годишно обслужване и комплексни ремонти.',
  },
  {
    index: 2,
    name: 'МоторЛаб Младост',
    address: 'бул. Александър Малинов 68',
    city: 'София',
    phone: '+359 32 910 1002',
    email: 'motorlab.mladost@automanager.demo',
    bulstat: '206000002',
    vatNumber: 'BG206000002',
    description: 'Специализиран сервиз за електроника, окачване и автопаркове.',
  },
  {
    index: 3,
    name: 'Prime Garage Люлин',
    address: 'бул. Панчо Владигеров 21',
    city: 'София',
    phone: '+359 52 910 1003',
    email: 'primegarage.lyulin@automanager.demo',
    bulstat: '206000003',
    vatNumber: 'BG206000003',
    description: 'Сервиз с фокус върху климатични системи, спирачки и гуми.',
  },
  {
    index: 4,
    name: 'Трак Кар Сървис',
    address: 'бул. Освобождение 97',
    city: 'Пловдив',
    phone: '+359 56 910 1004',
    email: 'trackcar.plovdiv@automanager.demo',
    bulstat: '206000004',
    vatNumber: 'BG206000004',
    description: 'Комплексно обслужване, бързи ремонти и партньорство с корпоративни клиенти.',
  },
  {
    index: 5,
    name: 'Авто Хъб Кършияка',
    address: 'бул. Дунав 5',
    city: 'Пловдив',
    phone: '+359 82 910 1005',
    email: 'autohub.karshiyaka@automanager.demo',
    bulstat: '206000005',
    vatNumber: 'BG206000005',
    description: 'Сервиз за поддръжка, дизелови системи и сезонни кампании.',
  },
];

const mechanicSeeds: MechanicSeed[] = [
  {
    index: 1,
    firstName: 'Иван',
    lastName: 'Петров',
    email: 'mechanic1@automanager.demo',
    phone: '+359 88 100 0001',
    specialization: 'Двигатели',
    skills: 'Диагностика, смяна ангренаж, турбини',
    memberships: [1, 2, 3],
  },
  {
    index: 2,
    firstName: 'Георги',
    lastName: 'Илиев',
    email: 'mechanic2@automanager.demo',
    phone: '+359 88 100 0002',
    specialization: 'Окачване',
    skills: 'Ходова част, амортисьори, реглаж',
    memberships: [1, 2],
  },
  {
    index: 3,
    firstName: 'Димитър',
    lastName: 'Стоянов',
    email: 'mechanic3@automanager.demo',
    phone: '+359 88 100 0003',
    specialization: 'Електроника',
    skills: 'Диагностика, инсталации, акумулатори',
    memberships: [2, 3],
  },
  {
    index: 4,
    firstName: 'Пламен',
    lastName: 'Григоров',
    email: 'mechanic4@automanager.demo',
    phone: '+359 88 100 0004',
    specialization: 'Скоростни кутии',
    skills: 'Автоматични кутии, съединители',
    memberships: [3, 1],
  },
  {
    index: 5,
    firstName: 'Николай',
    lastName: 'Тодоров',
    email: 'mechanic5@automanager.demo',
    phone: '+359 88 100 0005',
    specialization: 'Климатични системи',
    skills: 'Зареждане, компресори, течове',
    memberships: [1, 3],
  },
  {
    index: 6,
    firstName: 'Станислав',
    lastName: 'Маринов',
    email: 'mechanic6@automanager.demo',
    phone: '+359 88 100 0006',
    specialization: 'Спирачни системи',
    skills: 'ABS, накладки, дискове',
    memberships: [2],
  },
  {
    index: 7,
    firstName: 'Теодор',
    lastName: 'Василев',
    email: 'mechanic7@automanager.demo',
    phone: '+359 88 100 0007',
    specialization: 'Диагностика',
    skills: 'OBD, живи данни, софтуерни адаптации',
    memberships: [4, 5],
  },
  {
    index: 8,
    firstName: 'Алекс',
    lastName: 'Попов',
    email: 'mechanic8@automanager.demo',
    phone: '+359 88 100 0008',
    specialization: 'Гуми и джанти',
    skills: 'Баланс, монтаж, TPMS',
    memberships: [4, 5],
  },
  {
    index: 9,
    firstName: 'Борис',
    lastName: 'Колев',
    email: 'mechanic9@automanager.demo',
    phone: '+359 88 100 0009',
    specialization: 'Общо обслужване',
    skills: 'Масла, филтри, ремъци',
    memberships: [5, 4],
  },
  {
    index: 10,
    firstName: 'Мартин',
    lastName: 'Димов',
    email: 'mechanic10@automanager.demo',
    phone: '+359 88 100 0010',
    specialization: 'Дизелови системи',
    skills: 'Дюзи, EGR, DPF',
    memberships: [4],
  },
];

const clientFirstNames = [
  'Антон',
  'Виктория',
  'Мария',
  'Петър',
  'Елица',
  'Христо',
  'Ралица',
  'Йордан',
  'Надежда',
  'Калин',
  'Силвия',
  'Тодор',
  'Габриела',
  'Илия',
  'Кристина',
  'Радослав',
  'Михаела',
  'Даниел',
  'Вероника',
  'Симеон',
];

const clientLastNames = [
  'Ангелов',
  'Борисова',
  'Георгиева',
  'Димитров',
  'Евтимова',
  'Желязков',
  'Захариева',
  'Иванов',
  'Караиванова',
  'Лазаров',
  'Милева',
  'Николов',
  'Орлинска',
  'Павлов',
  'Радева',
  'Стефанов',
  'Тонева',
  'Узунов',
  'Филипова',
  'Хаджиев',
];

const carBrands = ['VW', 'BMW', 'Audi', 'Toyota', 'Skoda', 'Ford', 'Mercedes', 'Opel'];
const carModels = ['Golf', 'Passat', 'A4', 'Corolla', 'Octavia', 'Focus', 'C-Class', 'Astra'];

const expenseCategories: FinanceCategory[] = [
  FinanceCategory.PARTS,
  FinanceCategory.CONSUMABLES,
  FinanceCategory.RENT,
  FinanceCategory.UTILITIES,
  FinanceCategory.SALARIES,
  FinanceCategory.MAINTENANCE,
  FinanceCategory.SUPPLIES,
];

const incomeCategories: FinanceCategory[] = [
  FinanceCategory.LABOR,
  FinanceCategory.PARTS,
  FinanceCategory.OTHER,
];

const orderStatusCycle: OrderStatus[] = [
  OrderStatus.WAITING,
  OrderStatus.IN_PROGRESS,
  OrderStatus.READY,
  OrderStatus.COMPLETED,
  OrderStatus.CANCELLED,
];

const orderPriorityCycle: SchedulePriority[] = [
  SchedulePriority.NORMAL,
  SchedulePriority.HIGH,
  SchedulePriority.NORMAL,
  SchedulePriority.URGENT,
  SchedulePriority.LOW,
];

const scheduleStatusMap: Record<OrderStatus, ScheduleStatus> = {
  WAITING: ScheduleStatus.SCHEDULED,
  IN_PROGRESS: ScheduleStatus.IN_PROGRESS,
  READY: ScheduleStatus.READY,
  COMPLETED: ScheduleStatus.COMPLETED,
  CANCELLED: ScheduleStatus.CANCELLED,
};

const toServiceCode = (index: number): string => `SRV${String(index).padStart(3, '0')}`;
const daysAgo = (days: number): Date => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
};

const addHours = (date: Date, hours: number): Date => {
  const d = new Date(date);
  d.setHours(d.getHours() + hours);
  return d;
};

const addDays = (date: Date, days: number): Date => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

const getClientMemberships = (clientIndex: number): number[] => {
  const serviceCount = serviceSeeds.length;
  const membershipCount = clientIndex <= 6 ? 4 : clientIndex <= 14 ? 3 : 2;
  const start = (clientIndex - 1) % serviceCount;
  const result: number[] = [];
  for (let i = 0; i < membershipCount; i += 1) {
    result.push(((start + i) % serviceCount) + 1);
  }
  return result;
};

async function main() {
  console.log('Започвам зареждане на demo данни...');

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const now = new Date();
  const nextYear = addDays(now, 365);

  const serviceByIndex = new Map<number, { id: string; name: string }>();

  for (const serviceSeed of serviceSeeds) {
    const adminEmail = `admin${serviceSeed.index}@automanager.demo`;

    const adminUser = await prisma.user.upsert({
      where: { email: adminEmail },
      update: {
        password: passwordHash,
        role: UserRole.ADMIN,
        isActive: true,
        emailVerified: true,
      },
      create: {
        email: adminEmail,
        password: passwordHash,
        role: UserRole.ADMIN,
        isActive: true,
        emailVerified: true,
      },
    });

    const serviceCompany = await prisma.serviceCompany.upsert({
      where: { userId: adminUser.id },
      update: {
        name: serviceSeed.name,
        address: `${serviceSeed.address}, ${serviceSeed.city}`,
        phone: serviceSeed.phone,
        email: serviceSeed.email,
        uniqueCode: toServiceCode(serviceSeed.index),
        bulstat: serviceSeed.bulstat,
        vatNumber: serviceSeed.vatNumber,
        description: serviceSeed.description,
        subscriptionStatus: SubscriptionStatus.ACTIVE,
        subscriptionCurrentPeriodEnd: nextYear,
        subscriptionCancelAtPeriodEnd: false,
        isActive: true,
      },
      create: {
        userId: adminUser.id,
        name: serviceSeed.name,
        address: `${serviceSeed.address}, ${serviceSeed.city}`,
        phone: serviceSeed.phone,
        email: serviceSeed.email,
        uniqueCode: toServiceCode(serviceSeed.index),
        bulstat: serviceSeed.bulstat,
        vatNumber: serviceSeed.vatNumber,
        description: serviceSeed.description,
        subscriptionStatus: SubscriptionStatus.ACTIVE,
        subscriptionCurrentPeriodEnd: nextYear,
        subscriptionCancelAtPeriodEnd: false,
        isActive: true,
      },
    });

    serviceByIndex.set(serviceSeed.index, {
      id: serviceCompany.id,
      name: serviceCompany.name,
    });
  }

  const workersByService = new Map<number, string[]>();

  for (const mechanicSeed of mechanicSeeds) {
    const mechanicUser = await prisma.user.upsert({
      where: { email: mechanicSeed.email },
      update: {
        password: passwordHash,
        role: UserRole.MECHANIC,
        isActive: true,
        emailVerified: true,
      },
      create: {
        email: mechanicSeed.email,
        password: passwordHash,
        role: UserRole.MECHANIC,
        isActive: true,
        emailVerified: true,
      },
    });

    const primaryService = serviceByIndex.get(mechanicSeed.memberships[0]);
    if (!primaryService) {
      throw new Error(`Missing primary service for mechanic ${mechanicSeed.email}`);
    }

    const worker = await prisma.worker.upsert({
      where: { userId: mechanicUser.id },
      update: {
        firstName: mechanicSeed.firstName,
        lastName: mechanicSeed.lastName,
        email: mechanicSeed.email,
        phone: mechanicSeed.phone,
        specialization: mechanicSeed.specialization,
        skills: mechanicSeed.skills,
        isActive: true,
        serviceCompanyId: primaryService.id,
        deletedAt: null,
      },
      create: {
        userId: mechanicUser.id,
        firstName: mechanicSeed.firstName,
        lastName: mechanicSeed.lastName,
        email: mechanicSeed.email,
        phone: mechanicSeed.phone,
        specialization: mechanicSeed.specialization,
        skills: mechanicSeed.skills,
        isActive: true,
        serviceCompanyId: primaryService.id,
      },
    });

    for (const serviceIndex of mechanicSeed.memberships) {
      const service = serviceByIndex.get(serviceIndex);
      if (!service) continue;

      await prisma.mechanicServiceCompany.upsert({
        where: {
          workerId_serviceCompanyId: {
            workerId: worker.id,
            serviceCompanyId: service.id,
          },
        },
        update: {
          status: MembershipStatus.ACTIVE,
          leftAt: null,
        },
        create: {
          workerId: worker.id,
          serviceCompanyId: service.id,
          status: MembershipStatus.ACTIVE,
          joinedAt: daysAgo(90 - mechanicSeed.index * 3),
        },
      });

      const workerList = workersByService.get(serviceIndex) || [];
      if (!workerList.includes(worker.id)) {
        workerList.push(worker.id);
      }
      workersByService.set(serviceIndex, workerList);
    }
  }

  const clientsByService = new Map<
    number,
    Array<{ id: string; firstName: string; lastName: string }>
  >();
  const vehiclesByClient = new Map<string, string[]>();

  for (let i = 1; i <= 20; i += 1) {
    const firstName = clientFirstNames[i - 1];
    const lastName = clientLastNames[i - 1];
    const email = `client${i}@automanager.demo`;
    const phone = `+359 88 200 ${String(i).padStart(4, '0')}`;

    const clientUser = await prisma.user.upsert({
      where: { email },
      update: {
        password: passwordHash,
        role: UserRole.CLIENT,
        isActive: true,
        emailVerified: true,
      },
      create: {
        email,
        password: passwordHash,
        role: UserRole.CLIENT,
        isActive: true,
        emailVerified: true,
      },
    });

    const memberships = getClientMemberships(i);

    for (let membershipPosition = 0; membershipPosition < memberships.length; membershipPosition += 1) {
      const serviceIndex = memberships[membershipPosition];
      const service = serviceByIndex.get(serviceIndex);
      if (!service) continue;

      const client = await prisma.client.upsert({
        where: {
          userId_serviceCompanyId: {
            userId: clientUser.id,
            serviceCompanyId: service.id,
          },
        },
        update: {
          firstName,
          lastName,
          phone,
          email,
          address: `ул. Клиент ${i}, №${membershipPosition + 1}, ${serviceSeedByIndex(serviceIndex).city}`,
          isActive: true,
          deletedAt: null,
        },
        create: {
          userId: clientUser.id,
          serviceCompanyId: service.id,
          firstName,
          lastName,
          phone,
          email,
          address: `ул. Клиент ${i}, №${membershipPosition + 1}, ${serviceSeedByIndex(serviceIndex).city}`,
          isActive: true,
        },
      });

      const clientList = clientsByService.get(serviceIndex) || [];
      if (!clientList.find((c) => c.id === client.id)) {
        clientList.push({
          id: client.id,
          firstName: client.firstName,
          lastName: client.lastName,
        });
      }
      clientsByService.set(serviceIndex, clientList);

      const vehiclePlate = `DE${serviceIndex}${String(i).padStart(3, '0')}${membershipPosition + 1}`;
      const vehicle = await prisma.vehicle.upsert({
        where: {
          licensePlate_serviceCompanyId: {
            licensePlate: vehiclePlate,
            serviceCompanyId: service.id,
          },
        },
        update: {
          clientId: client.id,
          brand: carBrands[(i + membershipPosition) % carBrands.length],
          model: carModels[(i + membershipPosition) % carModels.length],
          year: 2011 + ((i + membershipPosition) % 12),
          color: ['Черен', 'Сив', 'Бял', 'Син', 'Червен'][(i + membershipPosition) % 5],
          mileage: 65000 + i * 3700 + membershipPosition * 900,
          vin: `WDEMOS${serviceIndex}${String(i).padStart(6, '0')}${membershipPosition + 1}`,
        },
        create: {
          clientId: client.id,
          serviceCompanyId: service.id,
          licensePlate: vehiclePlate,
          brand: carBrands[(i + membershipPosition) % carBrands.length],
          model: carModels[(i + membershipPosition) % carModels.length],
          year: 2011 + ((i + membershipPosition) % 12),
          color: ['Черен', 'Сив', 'Бял', 'Син', 'Червен'][(i + membershipPosition) % 5],
          mileage: 65000 + i * 3700 + membershipPosition * 900,
          vin: `WDEMOS${serviceIndex}${String(i).padStart(6, '0')}${membershipPosition + 1}`,
        },
      });

      const clientVehicles = vehiclesByClient.get(client.id) || [];
      if (!clientVehicles.includes(vehicle.id)) {
        clientVehicles.push(vehicle.id);
      }
      vehiclesByClient.set(client.id, clientVehicles);
    }
  }

  for (const serviceSeed of serviceSeeds) {
    const service = serviceByIndex.get(serviceSeed.index);
    if (!service) continue;

    await prisma.supplier.deleteMany({
      where: {
        serviceCompanyId: service.id,
        notes: { contains: '[DEMO]' },
      },
    });

    const cityPrefix = serviceSeed.city === 'София' ? 'София' : 'Пловдив';

    await prisma.supplier.createMany({
      data: [
        {
          serviceCompanyId: service.id,
          name: `${cityPrefix} Партс Логистик ${serviceSeed.index}`,
          type: SupplierType.PARTS,
          contactPerson: 'Иван Партсов',
          phonePrimary: `+359 88 500 ${String(serviceSeed.index).padStart(4, '0')}`,
          email: `supplier.parts.${serviceSeed.index}@automanager.demo`,
          city: serviceSeed.city,
          addressLine: `Индустриална зона, ${serviceSeed.city}`,
          eik: `2071${String(serviceSeed.index).padStart(5, '0')}`,
          isActive: true,
          isPreferred: true,
          notes: '[DEMO] Основен доставчик на резервни части.',
        },
        {
          serviceCompanyId: service.id,
          name: `${cityPrefix} Тайър Маркет ${serviceSeed.index}`,
          type: SupplierType.TIRES,
          contactPerson: 'Мария Николова',
          phonePrimary: `+359 88 510 ${String(serviceSeed.index).padStart(4, '0')}`,
          email: `supplier.tires.${serviceSeed.index}@automanager.demo`,
          city: serviceSeed.city,
          addressLine: `Логистичен парк, ${serviceSeed.city}`,
          eik: `2072${String(serviceSeed.index).padStart(5, '0')}`,
          isActive: true,
          isPreferred: false,
          notes: '[DEMO] Доставчик на гуми и джанти.',
        },
        {
          serviceCompanyId: service.id,
          name: `${cityPrefix} Тех Консуматив ${serviceSeed.index}`,
          type: SupplierType.CONSUMABLES,
          contactPerson: 'Петър Стойчев',
          phonePrimary: `+359 88 520 ${String(serviceSeed.index).padStart(4, '0')}`,
          email: `supplier.consumables.${serviceSeed.index}@automanager.demo`,
          city: serviceSeed.city,
          addressLine: `ул. Складова 5, ${serviceSeed.city}`,
          eik: `2073${String(serviceSeed.index).padStart(5, '0')}`,
          isActive: true,
          isPreferred: false,
          notes: '[DEMO] Масла, филтри, препарати.',
        },
      ],
    });

    await prisma.finance.deleteMany({
      where: {
        serviceCompanyId: service.id,
        description: { contains: '[DEMO]' },
      },
    });

    const financeRows: Array<{
      serviceCompanyId: string;
      type: FinanceType;
      category: FinanceCategory;
      amount: number;
      description: string;
      date: Date;
    }> = [];

    for (let idx = 0; idx < 14; idx += 1) {
      financeRows.push({
        serviceCompanyId: service.id,
        type: FinanceType.INCOME,
        category: incomeCategories[idx % incomeCategories.length],
        amount: 180 + idx * 22 + serviceSeed.index * 15,
        description: `[DEMO] Приход от поръчка #${serviceSeed.index}${String(idx + 1).padStart(2, '0')}`,
        date: daysAgo(30 - idx),
      });

      financeRows.push({
        serviceCompanyId: service.id,
        type: FinanceType.EXPENSE,
        category: expenseCategories[idx % expenseCategories.length],
        amount: 70 + idx * 13 + serviceSeed.index * 9,
        description: `[DEMO] Разход за дейност ${idx + 1}`,
        date: daysAgo(30 - idx),
      });
    }

    await prisma.finance.createMany({ data: financeRows });

    const clientsInService = clientsByService.get(serviceSeed.index) || [];
    const workersInService = workersByService.get(serviceSeed.index) || [];

    if (clientsInService.length === 0) continue;

    for (let orderIdx = 1; orderIdx <= ORDERS_PER_SERVICE; orderIdx += 1) {
      const client = clientsInService[(orderIdx - 1) % clientsInService.length];
      const clientVehicleIds = vehiclesByClient.get(client.id) || [];
      if (clientVehicleIds.length === 0) continue;

      const orderStatus = orderStatusCycle[(orderIdx - 1) % orderStatusCycle.length];
      const priority = orderPriorityCycle[(orderIdx - 1) % orderPriorityCycle.length];
      const workerId =
        workersInService.length > 0 ? workersInService[(orderIdx - 1) % workersInService.length] : null;

      const startDate = daysAgo(35 - orderIdx);
      const endDate = addDays(startDate, 1 + (orderIdx % 3));
      const completedDate = orderStatus === OrderStatus.COMPLETED ? addHours(endDate, 2) : null;
      const vehicleId = clientVehicleIds[(orderIdx - 1) % clientVehicleIds.length];

      const orderNumber = `DEMO-${serviceSeed.index}-${String(orderIdx).padStart(3, '0')}`;

      const order = await prisma.order.upsert({
        where: { orderNumber },
        update: {
          serviceCompanyId: service.id,
          clientId: client.id,
          vehicleId,
          workerId,
          description: `Проверка и ремонт по сигнал от клиент ${client.firstName} ${client.lastName}.`,
          diagnosis: orderIdx % 2 === 0 ? 'Установено износване на консумативи.' : null,
          notes: `Демо задача [${serviceSeed.name}]`,
          status: orderStatus,
          priority,
          startDate,
          endDate,
          completedDate,
          displayOrderNumber: `#${serviceSeed.index}${String(100 + orderIdx)}`,
        },
        create: {
          serviceCompanyId: service.id,
          clientId: client.id,
          vehicleId,
          workerId,
          orderNumber,
          displayOrderNumber: `#${serviceSeed.index}${String(100 + orderIdx)}`,
          description: `Проверка и ремонт по сигнал от клиент ${client.firstName} ${client.lastName}.`,
          diagnosis: orderIdx % 2 === 0 ? 'Установено износване на консумативи.' : null,
          notes: `Демо задача [${serviceSeed.name}]`,
          status: orderStatus,
          priority,
          startDate,
          endDate,
          completedDate,
        },
      });

      const orderItems = [
        {
          type: 'LABOR' as const,
          name: 'Диагностика и труд',
          description: 'Пълна диагностика и сервизна дейност',
          quantity: 1,
          unitPrice: 65 + orderIdx * 3,
        },
        {
          type: 'PART' as const,
          name: 'Резервна част',
          description: 'Смяна на основна част',
          quantity: 1 + (orderIdx % 2),
          unitPrice: 48 + serviceSeed.index * 6 + orderIdx,
        },
        {
          type: 'CONSUMABLE' as const,
          name: 'Консумативи',
          description: 'Масла, филтри и препарати',
          quantity: 1,
          unitPrice: 22 + (orderIdx % 5) * 4,
        },
      ];

      await prisma.orderItem.deleteMany({
        where: { orderId: order.id },
      });

      await prisma.orderItem.createMany({
        data: orderItems.map((item) => ({
          orderId: order.id,
          serviceCompanyId: service.id,
          type: item.type,
          name: item.name,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.quantity * item.unitPrice,
        })),
      });

      const totalPrice = orderItems.reduce(
        (sum, item) => sum + item.quantity * item.unitPrice,
        0
      );

      await prisma.order.update({
        where: { id: order.id },
        data: { totalPrice },
      });

      const scheduleStart = new Date(startDate);
      scheduleStart.setHours(8 + (orderIdx % 7), 0, 0, 0);
      const scheduleEnd = addHours(scheduleStart, 2 + (orderIdx % 2));

      const existingSchedule = await prisma.schedule.findFirst({
        where: { orderId: order.id },
        select: { id: true },
      });

      if (existingSchedule) {
        await prisma.schedule.update({
          where: { id: existingSchedule.id },
          data: {
            title: `Демо задача ${order.displayOrderNumber || order.orderNumber}`,
            description: `График за поръчка ${order.displayOrderNumber || order.orderNumber}`,
            date: startDate,
            startTime: scheduleStart,
            endTime: scheduleEnd,
            status: scheduleStatusMap[orderStatus],
            priority,
            workerId,
            serviceCompanyId: service.id,
            isCompleted: orderStatus === OrderStatus.COMPLETED,
          },
        });
      } else {
        await prisma.schedule.create({
          data: {
            title: `Демо задача ${order.displayOrderNumber || order.orderNumber}`,
            description: `График за поръчка ${order.displayOrderNumber || order.orderNumber}`,
            date: startDate,
            startTime: scheduleStart,
            endTime: scheduleEnd,
            status: scheduleStatusMap[orderStatus],
            priority,
            workerId,
            orderId: order.id,
            serviceCompanyId: service.id,
            isCompleted: orderStatus === OrderStatus.COMPLETED,
          },
        });
      }

      if (orderStatus === OrderStatus.READY || orderStatus === OrderStatus.COMPLETED) {
        const invoiceNumber = `INV-DEMO-${serviceSeed.index}-${String(orderIdx).padStart(3, '0')}`;
        await prisma.invoice.upsert({
          where: { invoiceNumber },
          update: {
            orderId: order.id,
            serviceCompanyId: service.id,
            subtotal: totalPrice,
            tax: 0,
            total: totalPrice,
            issueDate: endDate,
            dueDate: addDays(endDate, 7),
            isPaid: orderStatus === OrderStatus.COMPLETED,
            paidDate: orderStatus === OrderStatus.COMPLETED ? addDays(endDate, 1) : null,
            paymentMethod: orderStatus === OrderStatus.COMPLETED ? 'Карта' : null,
            notes: '[DEMO] Автоматично създадена фактура',
          },
          create: {
            invoiceNumber,
            orderId: order.id,
            serviceCompanyId: service.id,
            subtotal: totalPrice,
            tax: 0,
            total: totalPrice,
            issueDate: endDate,
            dueDate: addDays(endDate, 7),
            isPaid: orderStatus === OrderStatus.COMPLETED,
            paidDate: orderStatus === OrderStatus.COMPLETED ? addDays(endDate, 1) : null,
            paymentMethod: orderStatus === OrderStatus.COMPLETED ? 'Карта' : null,
            notes: '[DEMO] Автоматично създадена фактура',
          },
        });
      } else {
        await prisma.invoice.deleteMany({
          where: { orderId: order.id },
        });
      }
    }
  }

  const [servicesCount, workersCount, clientsCount, vehiclesCount, ordersCount, schedulesCount, financesCount, suppliersCount] =
    await Promise.all([
      prisma.serviceCompany.count({
        where: { uniqueCode: { in: serviceSeeds.map((s) => toServiceCode(s.index)) } },
      }),
      prisma.worker.count({
        where: { email: { endsWith: '@automanager.demo' } },
      }),
      prisma.client.count({
        where: { email: { endsWith: '@automanager.demo' } },
      }),
      prisma.vehicle.count({
        where: { licensePlate: { startsWith: 'DE' } },
      }),
      prisma.order.count({
        where: { orderNumber: { startsWith: 'DEMO-' } },
      }),
      prisma.schedule.count({
        where: { title: { startsWith: 'Демо задача' } },
      }),
      prisma.finance.count({
        where: { description: { contains: '[DEMO]' } },
      }),
      prisma.supplier.count({
        where: { notes: { contains: '[DEMO]' } },
      }),
    ]);

  console.log('Demo seed е завършен успешно.');
  console.log({
    loginPassword: DEMO_PASSWORD,
    services: servicesCount,
    workers: workersCount,
    clientProfiles: clientsCount,
    vehicles: vehiclesCount,
    orders: ordersCount,
    schedules: schedulesCount,
    finances: financesCount,
    suppliers: suppliersCount,
  });
}

function serviceSeedByIndex(index: number): ServiceSeed {
  const seed = serviceSeeds.find((s) => s.index === index);
  if (!seed) {
    throw new Error(`Missing service seed for index ${index}`);
  }
  return seed;
}

main()
  .catch((error) => {
    console.error('Seed error:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
