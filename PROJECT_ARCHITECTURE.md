# AutoManager - Архитектура на проекта

## Обща структура

```
AutoManager/
├── backend/               # Node.js/Express API сървър
├── frontend/              # React/Vite клиентско приложение
└── PROJECT_ARCHITECTURE.md
```

---

## 📁 BACKEND СТРУКТУРА

```
backend/
├── prisma/
│   ├── migrations/        # Database миграции
│   │   ├── 20251229000939_add_soft_delete/
│   │   │   └── migration.sql
│   │   ├── 20251229012251_add_vehicle_image_url/
│   │   │   └── migration.sql
│   │   ├── 20251229192821_add_password_reset/
│   │   │   └── migration.sql
│   │   ├── 20251231183603_add_email_verification/
│   │   │   └── migration.sql
│   │   ├── 20251231192318_remove_email_verification/
│   │   │   └── migration.sql
│   │   └── migration_lock.toml
│   └── schema.prisma      # Prisma схема на базата данни
│
├── src/
│   ├── __tests__/         # Unit и Integration тестове
│   │   ├── auth.test.ts
│   │   ├── order.test.ts
│   │   ├── permissions.test.ts
│   │   └── setup.ts
│   │
│   ├── config/            # Конфигурационни файлове
│   │   ├── database.ts    # Prisma клиент конфигурация
│   │   └── multer.ts      # File upload конфигурация
│   │
│   ├── controllers/       # Business логика
│   │   ├── auth.controller.ts              # Аутентикация (Login, Register, Logout)
│   │   ├── client.controller.ts            # Управление на клиенти
│   │   ├── client.dashboard.controller.ts  # Клиентски dashboard
│   │   ├── clientDashboard.controller.ts   # Клиентски dashboard (дублиран)
│   │   ├── dashboard.controller.ts         # Общ dashboard
│   │   ├── finance.controller.ts           # Финансови отчети
│   │   ├── invoice.controller.ts           # Фактури
│   │   ├── notification.controller.ts      # Уведомления
│   │   ├── order.controller.ts             # Поръчки
│   │   ├── orderItem.controller.ts         # Артикули към поръчки
│   │   ├── pendingRequest.controller.ts    # Заявки за одобрение
│   │   ├── schedule.controller.ts          # Графици
│   │   ├── serviceCompany.controller.ts    # Сервизна компания
│   │   ├── supplier.controller.ts          # Доставчици
│   │   ├── vehicle.controller.ts           # Превозни средства
│   │   └── worker.controller.ts            # Служители
│   │
│   ├── middleware/        # Express middleware
│   │   ├── auth.middleware.ts           # JWT валидация
│   │   ├── errorHandler.middleware.ts   # Централна обработка на грешки
│   │   ├── role.middleware.ts           # Роля проверка
│   │   └── validation.middleware.ts     # Zod валидация
│   │
│   ├── routes/            # API маршрути
│   │   ├── auth.routes.ts
│   │   ├── client.routes.ts
│   │   ├── clientDashboard.routes.ts
│   │   ├── dashboard.routes.ts
│   │   ├── finance.routes.ts
│   │   ├── index.ts                     # Централен router
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
│   │
│   ├── services/          # Бизнес логика сервизи
│   │   ├── email.service.ts    # Nodemailer email изпращане
│   │   ├── logger.service.ts   # Winston логване
│   │   └── pdf.service.ts      # PDFKit генериране на PDF
│   │
│   ├── types/             # TypeScript типове
│   │   ├── express.d.ts   # Express типове разширения
│   │   ├── index.js
│   │   └── index.ts
│   │
│   ├── utils/             # Помощни функции
│   │   ├── emailDnsValidation.ts      # Email DNS валидация
│   │   ├── generateToken.ts           # JWT токен генериране
│   │   ├── generateUniqueCode.ts      # Уникални кодове
│   │   ├── generateVerificationToken.ts # Верификация токени
│   │   ├── hashPassword.ts            # Bcrypt хеширане
│   │   └── pagination.ts              # Pagination логика
│   │
│   ├── validators/        # Zod валидационни схеми
│   │   └── schemas.ts
│   │
│   ├── app.ts             # Express приложение setup
│   └── server.ts          # HTTP сървър стартиране
│
├── uploads/               # Качени файлове
│   └── invoices/          # PDF фактури
│       └── .gitkeep
│
├── logs/                  # Логове файлове
│   ├── combined.log
│   └── error.log
│
├── .env                   # Environment променливи
├── .env.example           # Environment template
├── .gitignore
├── jest.config.js         # Jest тест конфигурация
├── package.json
├── package-lock.json
├── prisma.config.js
├── prisma.config.ts
├── prisma.config.ts.backup
├── tsconfig.json          # TypeScript конфигурация
└── tsconfig.test.json     # TypeScript test конфигурация
```

---

## 📁 FRONTEND СТРУКТУРА

```
frontend/
├── public/
│   └── vite.svg           # Static ресурси
│
├── src/
│   ├── assets/            # Картинки, икони
│   │   └── react.svg
│   │
│   ├── components/        # React компоненти
│   │   ├── admin/         # Admin специфични компоненти
│   │   │   ├── CreateTaskModal.tsx
│   │   │   ├── FinanceChart.tsx
│   │   │   ├── OrdersCalendar.tsx
│   │   │   ├── RecentClients.tsx
│   │   │   ├── RecentOrders.tsx
│   │   │   ├── SetupWizard.tsx
│   │   │   ├── StatsCard.tsx
│   │   │   ├── StatsDashboard.tsx
│   │   │   ├── UpcomingSchedule.tsx
│   │   │   └── WorkersList.tsx
│   │   │
│   │   ├── common/        # Преизползваеми компоненти
│   │   │   ├── Button.tsx
│   │   │   ├── Checkbox.tsx
│   │   │   ├── CountdownTimer.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── PasswordInput.tsx
│   │   │   └── PasswordStrengthBar.tsx
│   │   │
│   │   └── layout/        # Layout компоненти
│   │       ├── Header.tsx
│   │       ├── MainLayout.tsx
│   │       └── Sidebar.tsx
│   │
│   ├── context/           # React Context
│   │   ├── AuthContext.tsx
│   │   └── AuthProvider.tsx
│   │
│   ├── hooks/             # Custom React hooks
│   │   └── useAuth.ts
│   │
│   ├── pages/             # Страниц компоненти
│   │   ├── admin/         # Admin страници
│   │   │   ├── ClientDetails.tsx
│   │   │   ├── ClientEdit.tsx
│   │   │   ├── Clients.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── FinalizeOrderModal.tsx
│   │   │   ├── OrderCreate.tsx
│   │   │   ├── OrderDetails.tsx
│   │   │   ├── OrderEdit.tsx
│   │   │   ├── Orders.tsx
│   │   │   ├── VehicleCreate.tsx
│   │   │   ├── VehicleDetails.tsx
│   │   │   ├── VehicleEdit.tsx
│   │   │   ├── Vehicles.tsx
│   │   │   ├── WorkerDetails.tsx
│   │   │   ├── WorkerEdit.tsx
│   │   │   └── Workers.tsx
│   │   │
│   │   ├── auth/          # Аутентикация страници
│   │   │   ├── ForgotPassword.tsx
│   │   │   ├── Login.tsx
│   │   │   ├── Register.tsx
│   │   │   ├── RegisterClient.tsx
│   │   │   ├── RegisterMechanic.tsx
│   │   │   ├── ResetPassword.tsx
│   │   │   ├── RoleSelection.tsx
│   │   │   └── ServiceRoleSelection.tsx
│   │   │
│   │   ├── client/        # Клиентски страници
│   │   │   └── Dashboard.tsx
│   │   │
│   │   ├── mechanic/      # Механик страници
│   │   │   └── Dashboard.tsx
│   │   │
│   │   ├── NotFound.tsx
│   │   └── TermsAndConditions.tsx
│   │
│   ├── routes/            # React Router конфигурация
│   │   ├── AppRoutes.tsx
│   │   └── ProtectedRoute.tsx
│   │
│   ├── services/          # API клиенти
│   │   ├── api.ts               # Axios instance
│   │   ├── authService.ts       # Auth API calls
│   │   └── dashboardService.ts  # Dashboard API calls
│   │
│   ├── types/             # TypeScript типове
│   │   └── index.ts
│   │
│   ├── utils/             # Помощни функции
│   │   └── validation.ts
│   │
│   ├── App.css            # App стилове
│   ├── App.tsx            # Root компонент
│   ├── index.css          # Global стилове
│   ├── main.tsx           # Entry point
│   └── vite-env.d.ts      # Vite типове
│
├── .env                   # Environment променливи
├── .gitignore
├── eslint.config.js       # ESLint конфигурация
├── index.html             # HTML template
├── package.json
├── package-lock.json
├── postcss.config.js      # PostCSS конфигурация
├── README.md
├── tailwind.config.js     # Tailwind CSS конфигурация
├── tsconfig.app.json      # TypeScript app конфигурация
├── tsconfig.json          # TypeScript главна конфигурация
├── tsconfig.node.json     # TypeScript node конфигурация
└── vite.config.ts         # Vite конфигурация
```

---

## 🔧 ТЕХНОЛОГИЧЕН СТЕК

### Backend
- **Runtime:** Node.js + TypeScript
- **Framework:** Express.js
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Authentication:** JWT (jsonwebtoken)
- **Password Hashing:** bcrypt
- **Validation:** Zod
- **File Upload:** Multer
- **Email:** Nodemailer (Gmail SMTP)
- **PDF Generation:** PDFKit
- **Logging:** Winston
- **Testing:** Jest
- **HTTP Client:** Axios

### Frontend
- **Framework:** React 18
- **Build Tool:** Vite
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Routing:** React Router v6
- **HTTP Client:** Axios
- **State Management:** React Context API
- **UI Components:** Custom components
- **Icons:** Heroicons (предполагаемо)

---

## 🗂️ БАЗИ ДАННИ МОДЕЛИ (Prisma Schema)

### Основни модели:
- **User** - Потребители (Admin, Client, Mechanic)
- **ServiceCompany** - Сервизна компания
- **Client** - Клиенти
- **Worker** - Служители (Механици)
- **PendingRequest** - Заявки за одобрение
- **Vehicle** - Превозни средства
- **Order** - Поръчки
- **OrderItem** - Артикули в поръчки (PART, LABOR, CONSUMABLE)
- **Invoice** - Фактури
- **Notification** - Уведомления
- **Schedule** - График/Срещи
- **Supplier** - Доставчици
- **PasswordResetToken** - Токени за reset на парола

---

## 🔐 РОЛИ В СИСТЕМАТА

1. **ADMIN** - Администратор
   - Пълен достъп до всички функции
   - Управление на клиенти, поръчки, служители
   - Финализиране на поръчки и генериране на фактури
   - Одобряване/отхвърляне на заявки

2. **CLIENT** - Клиент
   - Регистрация и управление на профил
   - Преглед на собствени поръчки
   - Добавяне на превозни средства
   - Преглед на фактури

3. **MECHANIC** - Механик
   - Заявка за регистрация (чака одобрение от ADMIN)
   - Преглед на назначени задачи
   - Актуализиране на статус на поръчки

---

## 📡 API ENDPOINTS СТРУКТУРА

### Authentication (`/api/auth`)
- POST `/register` - Регистрация
- POST `/login` - Login
- POST `/logout` - Logout
- POST `/forgot-password` - Забравена парола
- POST `/reset-password/:token` - Reset парола
- GET `/verify-token` - Валидация на токен

### Orders (`/api/orders`)
- GET `/` - Списък поръчки
- POST `/` - Създаване на поръчка
- GET `/:id` - Детайли на поръчка
- PUT `/:id` - Актуализиране на поръчка
- DELETE `/:id` - Изтриване на поръчка
- POST `/:id/finalize` - Финализиране на поръчка

### Order Items (`/api/order-items`)
- POST `/:orderId` - Добавяне на артикул
- GET `/:orderId` - Списък артикули
- PUT `/:id` - Актуализиране на артикул
- DELETE `/:id` - Изтриване на артикул

### Invoices (`/api/invoices`)
- POST `/order/:orderId` - Създаване на фактура
- GET `/order/:orderId` - Фактура по поръчка
- GET `/:id` - Детайли на фактура
- PUT `/:id/pay` - Маркиране като платена

### Clients (`/api/clients`)
- GET `/` - Списък клиенти
- POST `/` - Създаване на клиент
- GET `/:id` - Детайли на клиент
- PUT `/:id` - Актуализиране на клиент
- DELETE `/:id` - Изтриване на клиент

### Vehicles (`/api/vehicles`)
- GET `/` - Списък превозни средства
- POST `/` - Създаване на превозно средство
- GET `/:id` - Детайли
- PUT `/:id` - Актуализиране
- DELETE `/:id` - Изтриване

### Workers (`/api/workers`)
- GET `/` - Списък служители
- GET `/:id` - Детайли
- PUT `/:id` - Актуализиране
- DELETE `/:id` - Изтриване

### Pending Requests (`/api/pending-requests`)
- GET `/` - Списък заявки
- POST `/:id/approve` - Одобряване
- POST `/:id/reject` - Отхвърляне

### Dashboard (`/api/dashboard`)
- GET `/stats` - Статистики
- GET `/client` - Клиентски dashboard

### Finance (`/api/finance`)
- GET `/stats` - Финансови статистики

### Notifications (`/api/notifications`)
- GET `/` - Списък уведомления
- PUT `/:id/read` - Маркиране като прочетено
- DELETE `/:id` - Изтриване

### Schedule (`/api/schedule`)
- GET `/` - График
- POST `/` - Създаване на среща
- PUT `/:id` - Актуализиране
- DELETE `/:id` - Изтриване

### Service Company (`/api/service-company`)
- GET `/` - Информация за компанията
- PUT `/` - Актуализиране на информация

### Suppliers (`/api/suppliers`)
- GET `/` - Списък доставчици
- POST `/` - Създаване
- PUT `/:id` - Актуализиране
- DELETE `/:id` - Изтриване

---

## 🔄 ГЛАВНИ РАБОТНИ ПРОЦЕСИ

### 1. Регистрация и Login
```
Client/Mechanic → Register → Email Verification (optional) → Login → JWT Token
```

### 2. Създаване на поръчка
```
Admin → Create Order → Add Order Items (Parts/Labor/Consumables) → Assign Mechanic
```

### 3. Обработка на поръчка
```
Order Created → IN_PROGRESS → Add Items → Calculate Total → Finalize Order
→ Generate Invoice → Generate PDF → Send Email → READY → Client Payment → COMPLETED
```

### 4. Генериране на фактура
```
Finalize Order → Calculate (Subtotal + 20% VAT) → Generate PDF → Create Invoice Record
→ Send Email with PDF attachment → Update Order Status to READY
```

### 5. Одобрение на механик
```
Mechanic Register → PENDING_APPROVAL → Admin Review → Approve/Reject
→ Email Notification → Account APPROVED or REJECTED
```

---

## 📊 СТАТУСИ В СИСТЕМАТА

### Order Status
- **PENDING** - Чака обработка
- **IN_PROGRESS** - В процес на изпълнение
- **READY** - Готова за плащане
- **COMPLETED** - Завършена и платена
- **CANCELLED** - Отказана

### Worker Approval Status
- **PENDING** - Чака одобрение
- **APPROVED** - Одобрен
- **REJECTED** - Отхвърлен

---

## 🔒 СИГУРНОСТ

- JWT токен аутентикация
- Bcrypt хеширане на пароли
- Role-based access control (RBAC)
- Input валидация с Zod
- CORS конфигурация
- Email DNS валидация
- Soft delete на записи
- Password reset с временни токени

---

## 📧 EMAIL ТЕМПЛЕЙТИ

1. **invoiceReady** - Фактурата е готова
2. **orderReady** - Поръчката е готова за плащане
3. **orderCompleted** - Поръчката е завършена
4. **mechanicApproved** - Механик одобрен
5. **mechanicRejected** - Механик отхвърлен
6. **emailVerification** - Email верификация (optional)

---

## 🧪 ТЕСТВАНЕ

- **Jest** за unit и integration тестове
- Тестове за:
  - Authentication
  - Orders
  - Permissions

---

## 📝 КОНФИГУРАЦИЯ

### Backend Environment Variables (.env)
```
DATABASE_URL=postgresql://...
JWT_SECRET=...
JWT_EXPIRES_IN=7d
EMAIL_USER=...
EMAIL_PASSWORD=...
PORT=5000
NODE_ENV=development
```

### Frontend Environment Variables (.env)
```
VITE_API_URL=http://localhost:5000/api
```

---

## 🚀 СТАРТИРАНЕ НА ПРОЕКТА

### Backend
```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

---

## 📦 ОСНОВНИ ПАКЕТИ

### Backend Dependencies
- express
- @prisma/client
- bcrypt
- jsonwebtoken
- zod
- multer
- nodemailer
- pdfkit
- winston
- cors
- dotenv

### Frontend Dependencies
- react
- react-dom
- react-router-dom
- axios
- tailwindcss
- vite

---

## 📄 ФАЙЛОВИ ФОРМАТИ

- **TypeScript** (.ts, .tsx) - Основен език
- **SQL** (.sql) - Database миграции
- **JSON** (.json) - Конфигурация
- **CSS** (.css) - Стилове
- **Markdown** (.md) - Документация
- **Environment** (.env) - Променливи

---

Това е пълната архитектура на AutoManager 
