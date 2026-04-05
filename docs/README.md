# AutoManager

**Система за управление на автосервизи**

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-blue.svg)](https://www.postgresql.org/)
[![License](https://img.shields.io/badge/License-Private-red.svg)]()

---

## Съдържание

- [Описание](#описание)
- [Основни функционалности](#основни-функционалности)
- [Технологичен стек](#технологичен-стек)
- [Архитектура](#архитектура)
- [Инсталация](#инсталация)
- [Конфигурация](#конфигурация)
- [Стартиране](#стартиране)
- [API документация](#api-документация)
- [База данни](#база-данни)
- [Сигурност](#сигурност)
- [Тестване](#тестване)
- [Структура на проекта](#структура-на-проекта)

---

## Описание

**AutoManager** е цялостна уеб платформа за управление на автосервизи, която предоставя инструменти за:

- Управление на клиенти и техните превозни средства
- Проследяване на поръчки и ремонти
- Планиране на график за механици
- Издаване на фактури с PDF експорт
- Финансов отчет и анализ
- Управление на доставчици

Системата поддържа **три потребителски роли** с различни нива на достъп:

| Роля | Описание |
|------|----------|
| **ADMIN** | Собственик на сервиз - пълен достъп до всички функции |
| **MECHANIC** | Механик - достъп до възложени задачи и график |
| **CLIENT** | Клиент - преглед на поръчки, фактури и известия |

---

## Основни функционалности

### Управление на клиенти
- Регистрация и профил на клиенти
- Свързване с множество сервизи
- История на поръчките
- Система за известия

### Управление на превозни средства
- Регистрация на автомобили (марка, модел, година, рег. номер, VIN)
- Проследяване на километраж
- История на ремонтите

### Поръчки и ремонти
- Създаване на поръчки с детайлно описание
- Статуси: WAITING → IN_PROGRESS → READY → COMPLETED
- Приоритети: LOW, NORMAL, HIGH, URGENT
- Артикули: части, труд, консумативи
- Автоматично изчисление на цени

### График и планиране
- Календарен изглед: дневен, седмичен, месечен
- Възлагане на задачи към механици
- Проследяване на статус и продължителност
- Приоритизиране на задачи

### Фактуриране
- Автоматично генериране от завършени поръчки
- PDF експорт с българска поддръжка (кирилица)
- Проследяване на плащания
- Номерация на фактури

### Финансов модул
- Приходи и разходи по категории
- Категории: Части, Труд, Консумативи, Наем, Заплати, Данъци и др.
- Графики и статистики
- Финансово табло

### Доставчици
- База данни с доставчици
- Типове: PARTS, CONSUMABLES, SERVICES, TIRES
- Предпочитани доставчици
- Контактна информация

---

## Технологичен стек

### Backend

| Технология | Версия | Предназначение |
|------------|--------|----------------|
| Node.js | 18+ | Runtime среда |
| Express.js | 5.2.1 | Web framework |
| TypeScript | 5.9 | Типизация |
| Prisma | 5.21.1 | ORM |
| PostgreSQL | 15+ | База данни |
| JWT | - | Автентикация |
| Winston | 3.19.0 | Логване |
| PDFKit | 0.17.2 | PDF генериране |
| Nodemailer | 7.0.12 | Email изпращане |
| Jest | 30.2.0 | Тестване |

### Frontend

| Технология | Версия | Предназначение |
|------------|--------|----------------|
| React | 19.2.0 | UI библиотека |
| Vite | 7.2.4 | Build tool |
| TypeScript | 5.9 | Типизация |
| Tailwind CSS | 3.4.19 | Стилизиране |
| Axios | 1.13.2 | HTTP клиент |
| React Router | 7.11.0 | Маршрутизация |
| Recharts | 3.6.0 | Графики |
| Lucide React | 0.562.0 | Икони |

---

## Архитектура

### Обща структура

```
AutoManager/
├── .vscode/                          # VS Code настройки
│   └── settings.json
├── backend/                          # REST API сървър
├── frontend/                         # React SPA клиент
└── docs/                             # Документация
    └── README.md

```

### Backend структура

```
backend/
├── fonts/                            # Шрифтове за PDF
│   ├── DejaVuSans.ttf
│   └── DejaVuSans-Bold.ttf
├── logs/                             # Лог файлове
│   ├── combined.log
│   └── error.log
├── prisma/                           # Prisma ORM
│   ├── migrations/                   # Database миграции
│   └── schema.prisma                 # Database схема
├── src/
│   ├── __tests__/                    # Unit тестове
│   │   ├── auth.test.ts
│   │   ├── clients.test.ts
│   │   ├── finance.test.ts
│   │   ├── invoices.test.ts
│   │   ├── notifications.test.ts
│   │   ├── order.test.ts
│   │   ├── permissions.test.ts
│   │   ├── schedule.test.ts
│   │   ├── serviceCompany.test.ts
│   │   ├── suppliers.test.ts
│   │   ├── vehicles.test.ts
│   │   └── workers.test.ts
│   ├── config/                       # Конфигурации
│   │   ├── database.ts
│   ├── controllers/                  # Request handlers
│   │   ├── auth.controller.ts
│   │   ├── client.controller.ts
│   │   ├── clientDashboard.controller.ts
│   │   ├── dashboard.controller.ts
│   │   ├── finance.controller.ts
│   │   ├── invoice.controller.ts
│   │   ├── notification.controller.ts
│   │   ├── order.controller.ts
│   │   ├── orderItem.controller.ts
│   │   ├── pendingRequest.controller.ts
│   │   ├── schedule.controller.ts
│   │   ├── serviceCompany.controller.ts
│   │   ├── supplier.controller.ts
│   │   ├── vehicle.controller.ts
│   │   └── worker.controller.ts
│   ├── jobs/                         # Cron задачи
│   │   └── tokenCleanup.job.ts
│   ├── logs/                         # Лог директория (runtime)
│   ├── middleware/                   # Express middleware
│   │   ├── auth.middleware.ts
│   │   ├── errorHandler.middleware.ts
│   │   ├── mechanicServiceCheck.middleware.ts
│   │   ├── rateLimiter.middleware.ts
│   │   ├── role.middleware.ts
│   │   └── validation.middleware.ts
│   ├── routes/                       # API endpoints
│   │   ├── auth.routes.ts
│   │   ├── client.routes.ts
│   │   ├── clientDashboard.routes.ts
│   │   ├── dashboard.routes.ts
│   │   ├── finance.routes.ts
│   │   ├── index.ts
│   │   ├── invoice.routes.ts
│   │   ├── notification.routes.ts
│   │   ├── order.routes.ts
│   │   ├── orderItem.routes.ts
│   │   ├── pendingRequest.routes.ts
│   │   ├── schedule.routes.ts
│   │   ├── serviceCompany.routes.ts
│   │   ├── supplier.routes.ts
│   │   ├── vehicle.routes.ts
│   │   └── worker.routes.ts
│   ├── services/                     # Бизнес логика
│   │   ├── email.service.ts
│   │   ├── logger.service.ts
│   │   └── pdf.service.ts
│   ├── types/                        # TypeScript типове
│   │   ├── express.d.ts
│   │   └── index.ts
│   ├── utils/                        # Помощни функции
│   │   ├── emailDnsValidation.ts
│   │   ├── emailValidator.ts
│   │   ├── generateToken.ts
│   │   ├── generateUniqueCode.ts
│   │   ├── generateVerificationToken.ts
│   │   ├── hashPassword.ts
│   │   ├── pagination.ts
│   │   └── tokenUtils.ts
│   ├── validators/                   # Joi валидации
│   │   └── schemas.ts
│   ├── app.ts                        # Express app setup
│   └── server.ts                     # Server entry point
├── uploads/                          # Качени файлове
├── .env                              # Environment variables
├── .env.example                      # Environment template
├── check-db.js
├── fix-enum.js
├── jest.config.js
├── package.json
├── prisma.config.js
├── prisma.config.ts
├── test-orders.js
├── tsconfig.json
└── tsconfig.test.json

```

### Frontend структура

```
frontend/
├── dist/                             # Production build
├── src/
│   ├── assets/                       # Статични ресурси
│   │   └── react.svg
│   ├── components/                   # React компоненти
│   │   ├── admin/                    # Admin компоненти
│   │   │   ├── CreateTaskModal.tsx
│   │   │   ├── EditTaskModal.tsx
│   │   │   ├── FinanceChart.tsx
│   │   │   ├── OrdersCalendar.tsx
│   │   │   ├── ReassignWorkerModal.tsx
│   │   │   ├── RecentClients.tsx
│   │   │   ├── RecentOrders.tsx
│   │   │   ├── SetupWizard.tsx
│   │   │   ├── StatsCard.tsx
│   │   │   ├── StatsDashboard.tsx
│   │   │   ├── UpcomingSchedule.tsx
│   │   │   └── WorkersList.tsx
│   │   ├── common/                   # Общи компоненти
│   │   │   ├── Button.tsx
│   │   │   ├── Checkbox.tsx
│   │   │   ├── CountdownTimer.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── PasswordInput.tsx
│   │   │   └── PasswordStrengthBar.tsx
│   │   ├── layout/                   # Layout компоненти
│   │   │   ├── Header.tsx
│   │   │   ├── MainLayout.tsx
│   │   │   └── Sidebar.tsx
│   │   └── mechanic/                 # Mechanic компоненти
│   │       └── ScheduleDetailsModal.tsx
│   ├── context/                      # React Context
│   │   ├── ActiveServiceContext.ts
│   │   ├── ActiveServiceProvider.tsx
│   │   ├── AuthContext.tsx
│   │   ├── AuthProvider.tsx
│   │   ├── ServiceCompanyContext.tsx
│   │   └── ServiceCompanyProvider.tsx
│   ├── hooks/                        # Custom hooks
│   │   ├── useActiveService.ts
│   │   ├── useAuth.ts
│   │   ├── useMechanicService.ts
│   │   └── useServiceCompany.ts
│   ├── pages/                        # Страници
│   │   ├── admin/                    # Admin страници
│   │   ├── auth/                     # Auth страници
│   │   ├── client/                   # Client страници
│   │   ├── mechanic/                 # Mechanic страници
│   │   ├── NotFound.tsx
│   │   ├── TermsAndConditions.tsx
│   │   └── Unauthorized.tsx
│   ├── routes/                       # Маршрутизация
│   │   ├── AppRoutes.tsx
│   │   └── ProtectedRoute.tsx
│   ├── services/                     # API услуги
│   │   ├── api.ts
│   │   ├── authService.ts
│   │   ├── dashboardService.ts
│   │   └── mechanicService.ts
│   ├── styles/                       # CSS стилове
│   │   └── schedule.css
│   ├── types/                        # TypeScript типове
│   │   ├── client.ts
│   │   ├── index.ts
│   │   └── mechanic.ts
│   ├── utils/                        # Помощни функции
│   │   └── validation.ts
│   ├── App.css
│   ├── App.tsx
│   ├── index.css
│   ├── main.tsx
│   └── vite-env.d.ts
├── .env
├── eslint.config.js
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── tsconfig.app.json
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.ts

```

---

## Инсталация

### Изисквания

- Node.js 18+
- PostgreSQL 15+
- npm или yarn

### Стъпки

1. **Клониране на репозиторито**
```bash
git clone <repository-url>
cd AutoManager
```

2. **Инсталиране на backend зависимости**
```bash
cd backend
npm install
```

3. **Инсталиране на frontend зависимости**
```bash
cd ../frontend
npm install
```

4. **Настройка на база данни**
```bash
cd ../backend
npx prisma migrate dev
npx prisma generate
```

---

## Конфигурация

### Backend (.env)

Копирайте `.env.example` в `.env` и попълнете стойностите:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/automanager"

# Server
PORT=5000

# JWT
JWT_SECRET="your-jwt-secret-key"
REFRESH_TOKEN_SECRET="your-refresh-token-secret"

# Frontend URL (for CORS)
FRONTEND_URL="http://localhost:5173"

# Email (optional)
SMTP_HOST="smtp.example.com"
SMTP_PORT=587
SMTP_USER="your-email@example.com"
SMTP_PASS="your-password"
```

### Frontend (.env)

```env
VITE_API_URL=http://localhost:5000/api
```

---

## Стартиране

### Development режим

**Backend:**
```bash
cd backend
npm run dev
```
Сървърът стартира на `http://localhost:5000`

**Frontend:**
```bash
cd frontend
npm run dev
```
Приложението е достъпно на `http://localhost:5173`

### Production build

**Frontend:**
```bash
cd frontend
npm run build
```

---

## API документация

### Автентикация

| Метод | Endpoint | Описание |
|-------|----------|----------|
| POST | `/api/auth/register` | Регистрация |
| POST | `/api/auth/login` | Вход |
| POST | `/api/auth/logout` | Изход |
| POST | `/api/auth/refresh` | Обновяване на токен |
| POST | `/api/auth/forgot-password` | Забравена парола |
| POST | `/api/auth/reset-password` | Нова парола |

### Поръчки

| Метод | Endpoint | Описание |
|-------|----------|----------|
| GET | `/api/orders` | Списък поръчки |
| POST | `/api/orders` | Създаване на поръчка |
| GET | `/api/orders/:id` | Детайли на поръчка |
| PUT | `/api/orders/:id` | Редакция на поръчка |
| PATCH | `/api/orders/:id/status` | Промяна на статус |
| DELETE | `/api/orders/:id` | Изтриване |

### Клиенти

| Метод | Endpoint | Описание |
|-------|----------|----------|
| GET | `/api/clients` | Списък клиенти |
| POST | `/api/clients` | Създаване |
| GET | `/api/clients/:id` | Детайли |
| PUT | `/api/clients/:id` | Редакция |
| DELETE | `/api/clients/:id` | Изтриване |

### Превозни средства

| Метод | Endpoint | Описание |
|-------|----------|----------|
| GET | `/api/vehicles` | Списък превозни средства |
| POST | `/api/vehicles` | Създаване |
| GET | `/api/vehicles/:id` | Детайли |
| PUT | `/api/vehicles/:id` | Редакция |
| DELETE | `/api/vehicles/:id` | Изтриване |

### График

| Метод | Endpoint | Описание |
|-------|----------|----------|
| GET | `/api/schedules` | Списък задачи |
| POST | `/api/schedules` | Създаване |
| GET | `/api/schedules/:id` | Детайли |
| PUT | `/api/schedules/:id` | Редакция |
| DELETE | `/api/schedules/:id` | Изтриване |

### Фактури

| Метод | Endpoint | Описание |
|-------|----------|----------|
| GET | `/api/invoices` | Списък фактури |
| POST | `/api/invoices` | Създаване |
| GET | `/api/invoices/:id` | Детайли |
| GET | `/api/invoices/:id/pdf` | PDF изтегляне |
| PATCH | `/api/invoices/:id/payment` | Маркиране като платена |

### Финанси

| Метод | Endpoint | Описание |
|-------|----------|----------|
| GET | `/api/finances` | Списък записи |
| POST | `/api/finances` | Създаване |
| GET | `/api/finances/dashboard` | Финансово табло |

### Доставчици

| Метод | Endpoint | Описание |
|-------|----------|----------|
| GET | `/api/suppliers` | Списък доставчици |
| POST | `/api/suppliers` | Създаване |
| GET | `/api/suppliers/:id` | Детайли |
| PUT | `/api/suppliers/:id` | Редакция |

---

## База данни

### Основни модели

```prisma
model User {
  id            String    @id @default(uuid())
  email         String    @unique
  password      String
  firstName     String
  lastName      String
  phone         String?
  role          UserRole  @default(CLIENT)
  isActive      Boolean   @default(true)
  tokenVersion  Int       @default(0)
}

model ServiceCompany {
  id          String   @id @default(uuid())
  name        String
  address     String?
  phone       String?
  email       String?
  ownerId     String   @unique
}

model Client {
  id          String    @id @default(uuid())
  userId      String    @unique
  vehicles    Vehicle[]
  orders      Order[]
}

model Worker {
  id              String   @id @default(uuid())
  userId          String   @unique
  specialization  String?
  skills          String[]
}

model Vehicle {
  id           String   @id @default(uuid())
  brand        String
  model        String
  year         Int
  licensePlate String
  vin          String?
  mileage      Int?
  clientId     String
}

model Order {
  id           String      @id @default(uuid())
  displayId    Int
  status       OrderStatus @default(WAITING)
  priority     String      @default("NORMAL")
  diagnosis    String?
  clientId     String
  vehicleId    String
  workerId     String?
  items        OrderItem[]
  invoice      Invoice?
}

model Invoice {
  id            String   @id @default(uuid())
  invoiceNumber String   @unique
  totalAmount   Float
  taxAmount     Float
  isPaid        Boolean  @default(false)
  paidDate      DateTime?
  paymentMethod String?
  orderId       String   @unique
}

model Schedule {
  id          String         @id @default(uuid())
  title       String
  description String?
  startTime   DateTime
  endTime     DateTime?
  status      ScheduleStatus @default(SCHEDULED)
  priority    SchedulePriority @default(NORMAL)
  workerId    String
  orderId     String?
}

model Finance {
  id          String        @id @default(uuid())
  type        FinanceType
  category    FinanceCategory
  amount      Float
  description String?
  date        DateTime
}

model Supplier {
  id          String       @id @default(uuid())
  name        String
  type        SupplierType
  phone       String?
  email       String?
  address     String?
  isPreferred Boolean      @default(false)
}
```

### Енумерации

```prisma
enum UserRole {
  ADMIN
  CLIENT
  MECHANIC
}

enum OrderStatus {
  WAITING
  IN_PROGRESS
  READY
  COMPLETED
  CANCELLED
}

enum ScheduleStatus {
  SCHEDULED
  IN_PROGRESS
  READY
  COMPLETED
  CANCELLED
  DELAYED
}

enum SchedulePriority {
  LOW
  NORMAL
  HIGH
  URGENT
}

enum FinanceType {
  INCOME
  EXPENSE
}

enum FinanceCategory {
  PARTS
  LABOR
  CONSUMABLES
  RENT
  UTILITIES
  SALARIES
  TAXES
  INSURANCE
  MARKETING
  MAINTENANCE
  SUPPLIES
  OTHER
}

enum SupplierType {
  PARTS
  CONSUMABLES
  SERVICES
  TIRES
  OTHER
}
```

---

## Сигурност

### Автентикация
- **JWT токени** с 15-минутен живот
- **Refresh токени** в httpOnly cookies (30 дни)
- **Token blacklisting** при изход
- **Автоматично почистване** на изтекли токени (cron job)

### Защита
- **Rate limiting**: 1000 заявки / 15 минути
- **CORS whitelist**: само разрешени домейни
- **Password hashing**: bcryptjs
- **Input validation**: Joi schemas
- **Role-based access control**: middleware проверки

### Препоръки
- Използвайте силни JWT секрети (минимум 32 символа)
- Редовно обновявайте зависимостите
- Конфигурирайте HTTPS в production

---

## Тестване

```bash
cd backend
npm test
```

Тестовете включват:
- Автентикация (login, register, refresh)
- CRUD операции за поръчки
- Проверка на права за достъп

---

## Структура на проекта

### Backend контролери

| Файл | Описание |
|------|----------|
| `auth.controller.ts` | Автентикация и управление на сесии |
| `order.controller.ts` | CRUD и статус на поръчки |
| `client.controller.ts` | Управление на клиенти |
| `worker.controller.ts` | Управление на механици |
| `vehicle.controller.ts` | Управление на превозни средства |
| `schedule.controller.ts` | График и планиране |
| `invoice.controller.ts` | Фактуриране |
| `finance.controller.ts` | Финансов модул |
| `supplier.controller.ts` | Доставчици |
| `dashboard.controller.ts` | Статистики и табла |

### Frontend страници

| Директория | Описание |
|------------|----------|
| `pages/admin/` | Admin панел (20+ страници) |
| `pages/mechanic/` | Механик панел (11 страници) |
| `pages/client/` | Клиентски панел (8 страници) |
| `pages/auth/` | Автентикация (8 страници) |

### Middleware

| Файл | Описание |
|------|----------|
| `auth.middleware.ts` | JWT верификация |
| `role.middleware.ts` | Проверка на роли |
| `validation.middleware.ts` | Валидация на входни данни |
| `errorHandler.middleware.ts` | Глобална обработка на грешки |
| `rateLimiter.middleware.ts` | Rate limiting |

---

## Скриптове

### Backend

| Команда | Описание |
|---------|----------|
| `npm run dev` | Стартиране в development режим |
| `npm test` | Изпълнение на тестове |
| `npm run build` | Production build |

### Frontend

| Команда | Описание |
|---------|----------|
| `npm run dev` | Стартиране в development режим |
| `npm run build` | Production build |
| `npm run preview` | Преглед на build |
| `npm run lint` | Проверка на код |

---

## Лиценз

Този проект е частна собственост. Всички права запазени.

---

## Автор

Разработено с TypeScript, React и Express.js.
