# AutoManager - Документация

## Преглед
AutoManager е уеб система за управление на автосервизи: клиенти, механици, автомобили, поръчки, графици, фактури, доставчици и финансов отчет.

## Архитектура (цялостна)
- Монорепо с два основни модула: `backend/` (API) и `frontend/` (SPA клиент).
- Backend слой:
  - Входна точка: `server.ts` → `app.ts` (Express).
  - Рутинг: `routes/` (REST endpoints по домейни).
  - Контролери: `controllers/` (обработка на заявки, бизнес логика).
  - Услуги: `services/` (общи услуги, логване, външни интеграции).
  - Валидации: `validators/` (Joi схеми).
  - Middleware: `middleware/` (грешки, auth и др.).
  - Jobs: `jobs/` (cron задачи, напр. почистване на токени).
  - Types/Utils: `types/`, `utils/`.
- Данни:
  - ORM: Prisma (`prisma/schema.prisma`).
  - База данни: PostgreSQL.
  - Домейн модели: потребители и роли, компании, клиенти, механици, заявки, автомобили, поръчки, позиции, фактури, графици, доставчици, финанси, уведомления.
- Сигурност и достъп:
  - JWT + refresh tokens, httpOnly cookies.
  - Rate limiting, CORS whitelist.
  - Хеширане на пароли.
- Файлове:
  - Статично сервиране на `/uploads` за качени файлове.
- Frontend слой:
  - React SPA с Vite.
  - Маршрути: `routes/`, страници по роли: `pages/admin`, `pages/mechanic`, `pages/client`, `pages/auth`.
  - State/Context: `context/` и custom hooks в `hooks/`.
  - API слой: `services/` (axios).
  - UI компоненти: `components/` + Tailwind CSS стилове.

## Структура на проекта
- `backend/` - API, бизнес логика, Prisma схема, jobs, middleware, validators.
- `frontend/` - SPA приложение, маршрути, страници, компоненти, контекст, услуги.
- `docs/` - документация.

## Технологии
- Backend: Node.js, TypeScript, Express, Prisma, PostgreSQL.
- Frontend: React, TypeScript, Vite, Tailwind CSS.
- Тестове: Jest, Supertest.
- Логване и утилити: Winston, dotenv.

## Всички изтеглени библиотеки
### Backend зависимости
Производствени:
- @prisma/client
- bcryptjs
- cookie-parser
- cors
- dns2
- dotenv
- express
- express-rate-limit
- joi
- jsonwebtoken
- multer
- node-cron
- nodemailer
- pdfkit
- prisma
- winston

Dev зависимости:
- @types/bcryptjs
- @types/cookie-parser
- @types/cors
- @types/dns2
- @types/express
- @types/jest
- @types/joi
- @types/jsonwebtoken
- @types/methods
- @types/multer
- @types/node
- @types/node-cron
- @types/nodemailer
- @types/pdfkit
- @types/supertest
- @types/winston
- jest
- nodemon
- supertest
- ts-jest
- ts-node
- typescript

### Frontend зависимости
Производствени:
- axios
- date-fns
- lucide-react
- react
- react-dom
- react-hot-toast
- react-router-dom
- recharts

Dev зависимости:
- @eslint/js
- @types/node
- @types/react
- @types/react-dom
- @vitejs/plugin-react
- autoprefixer
- eslint
- eslint-plugin-react-hooks
- eslint-plugin-react-refresh
- globals
- postcss
- tailwindcss
- typescript
- typescript-eslint
- vite

## Стартиране локално
### Backend
1) `cd backend`
2) `npm install`
3) Копирай `.env.example` в `.env` и попълни стойностите
4) `npm run dev`

### Frontend
1) `cd frontend`
2) `npm install`
3) `npm run dev`

## Конфигурация (.env)
Backend очаква основните стойности в `.env` (например: `DATABASE_URL`, JWT секретни ключове, `FRONTEND_URL`).

## Скриптове
Backend:
- `npm run dev` - старт на API
- `npm test` - тестове

Frontend:
- `npm run dev` - старт на SPA
- `npm run build` - build

## Най-важно
- Ролеви модели: ADMIN, CLIENT, MECHANIC.
- Ключови домейни: поръчки, графици, фактури, финанси, доставчици.
- Защита: JWT + refresh tokens, rate limiting, логване.

## Пълна структура (папки и файлове)
(Списък без съдържанието на node_modules и .git)

### Папки
- `.claude`
- `.vscode`
- `backend`
- `backend\fonts`
- `backend\logs`
- `backend\prisma`
- `backend\prisma\migrations`
- `backend\prisma\migrations\20251229000939_add_soft_delete`
- `backend\prisma\migrations\20251229012251_add_vehicle_image_url`
- `backend\prisma\migrations\20251229192821_add_password_reset`
- `backend\prisma\migrations\20251231183603_add_email_verification`
- `backend\prisma\migrations\20251231192318_remove_email_verification`
- `backend\prisma\migrations\20260101142207_extend_schedule_module`
- `backend\prisma\migrations\20260101182436_update_suppliers_model`
- `backend\prisma\migrations\20260101231240_add_finance_module`
- `backend\prisma\migrations\20260102122847_add_refresh_and_blacklist_tokens`
- `backend\prisma\migrations\20260103113427_sync_schema_with_database`
- `backend\prisma\migrations\20260103121959_add_worker_skills`
- `backend\prisma\migrations\20260103130909_add_schedule_fields`
- `backend\prisma\migrations\20260108133339_refresh_token_rotation`
- `backend\prisma\migrations\20260110124443_add_mechanic_service_company`
- `backend\prisma\migrations\20260110212946_fix_worker_service_company_nullable_and_order_priority`
- `backend\prisma\migrations\20260111111158_add_skills_to_pending_request`
- `backend\prisma\migrations\20260116121635_make_client_service_optional`
- `backend\prisma\migrations\20260116202325_add_request_type_to_pending_requests`
- `backend\prisma\migrations\20260117221905_allow_client_multiple_services`
- `backend\prisma\migrations\20260117235135_change_labor_to_service`
- `backend\prisma\migrations\20260118_add_payment_method_to_invoice`
- `backend\prisma\migrations\20260118_fix_service_to_labor`
- `backend\src`
- `backend\src\__tests__`
- `backend\src\config`
- `backend\src\controllers`
- `backend\src\jobs`
- `backend\src\logs`
- `backend\src\middleware`
- `backend\src\routes`
- `backend\src\services`
- `backend\src\types`
- `backend\src\utils`
- `backend\src\validators`
- `backend\uploads`
- `backend\uploads\invoices`
- `backend\uploads\vehicles`
- `docs`
- `frontend`
- `frontend\dist`
- `frontend\dist\assets`
- `frontend\src`
- `frontend\src\assets`
- `frontend\src\components`
- `frontend\src\components\admin`
- `frontend\src\components\common`
- `frontend\src\components\features`
- `frontend\src\components\layout`
- `frontend\src\components\mechanic`
- `frontend\src\context`
- `frontend\src\hooks`
- `frontend\src\pages`
- `frontend\src\pages\admin`
- `frontend\src\pages\auth`
- `frontend\src\pages\client`
- `frontend\src\pages\mechanic`
- `frontend\src\routes`
- `frontend\src\services`
- `frontend\src\styles`
- `frontend\src\types`
- `frontend\src\utils`

### Файлове
- `.claude\settings.local.json`
- `.vscode\settings.json`
- `backend\.env`
- `backend\.env.example`
- `backend\.gitignore`
- `backend\check-db.js`
- `backend\fix-enum.js`
- `backend\fonts\DejaVuSans.ttf`
- `backend\fonts\DejaVuSans-Bold.ttf`
- `backend\jest.config.js`
- `backend\logs\combined.log`
- `backend\logs\error.log`
- `backend\package.json`
- `backend\package-lock.json`
- `backend\prisma.config.js`
- `backend\prisma.config.ts`
- `backend\prisma\migrations\20251229000939_add_soft_delete\migration.sql`
- `backend\prisma\migrations\20251229012251_add_vehicle_image_url\migration.sql`
- `backend\prisma\migrations\20251229192821_add_password_reset\migration.sql`
- `backend\prisma\migrations\20251231183603_add_email_verification\migration.sql`
- `backend\prisma\migrations\20251231192318_remove_email_verification\migration.sql`
- `backend\prisma\migrations\20260101142207_extend_schedule_module\migration.sql`
- `backend\prisma\migrations\20260101182436_update_suppliers_model\migration.sql`
- `backend\prisma\migrations\20260101231240_add_finance_module\migration.sql`
- `backend\prisma\migrations\20260102122847_add_refresh_and_blacklist_tokens\migration.sql`
- `backend\prisma\migrations\20260103113427_sync_schema_with_database\migration.sql`
- `backend\prisma\migrations\20260103121959_add_worker_skills\migration.sql`
- `backend\prisma\migrations\20260103130909_add_schedule_fields\migration.sql`
- `backend\prisma\migrations\20260108133339_refresh_token_rotation\migration.sql`
- `backend\prisma\migrations\20260110124443_add_mechanic_service_company\migration.sql`
- `backend\prisma\migrations\20260110212946_fix_worker_service_company_nullable_and_order_priority\migration.sql`
- `backend\prisma\migrations\20260111111158_add_skills_to_pending_request\migration.sql`
- `backend\prisma\migrations\20260116121635_make_client_service_optional\migration.sql`
- `backend\prisma\migrations\20260116202325_add_request_type_to_pending_requests\migration.sql`
- `backend\prisma\migrations\20260117221905_allow_client_multiple_services\migration.sql`
- `backend\prisma\migrations\20260117235135_change_labor_to_service\migration.sql`
- `backend\prisma\migrations\20260118_add_payment_method_to_invoice\migration.sql`
- `backend\prisma\migrations\20260118_fix_service_to_labor\migration.sql`
- `backend\prisma\migrations\migration_lock.toml`
- `backend\prisma\schema.prisma`
- `backend\src\__tests__\auth.test.ts`
- `backend\src\__tests__\order.test.ts`
- `backend\src\__tests__\permissions.test.ts`
- `backend\src\__tests__\setup.ts`
- `backend\src\app.ts`
- `backend\src\config\database.ts`
- `backend\src\config\multer.ts`
- `backend\src\controllers\auth.controller.ts`
- `backend\src\controllers\client.controller.ts`
- `backend\src\controllers\clientDashboard.controller.ts`
- `backend\src\controllers\dashboard.controller.ts`
- `backend\src\controllers\finance.controller.ts`
- `backend\src\controllers\invoice.controller.ts`
- `backend\src\controllers\notification.controller.ts`
- `backend\src\controllers\order.controller.ts`
- `backend\src\controllers\orderItem.controller.ts`
- `backend\src\controllers\pendingRequest.controller.ts`
- `backend\src\controllers\schedule.controller.ts`
- `backend\src\controllers\serviceCompany.controller.ts`
- `backend\src\controllers\supplier.controller.ts`
- `backend\src\controllers\vehicle.controller.ts`
- `backend\src\controllers\worker.controller.ts`
- `backend\src\jobs\tokenCleanup.job.ts`
- `backend\src\logs\combined.log`
- `backend\src\logs\error.log`
- `backend\src\middleware\auth.middleware.ts`
- `backend\src\middleware\errorHandler.middleware.ts`
- `backend\src\middleware\mechanicServiceCheck.middleware.ts`
- `backend\src\middleware\rateLimiter.middleware.ts`
- `backend\src\middleware\role.middleware.ts`
- `backend\src\middleware\validation.middleware.ts`
- `backend\src\routes\auth.routes.ts`
- `backend\src\routes\client.routes.ts`
- `backend\src\routes\clientDashboard.routes.ts`
- `backend\src\routes\dashboard.routes.ts`
- `backend\src\routes\finance.routes.ts`
- `backend\src\routes\index.ts`
- `backend\src\routes\invoice.routes.ts`
- `backend\src\routes\notification.routes.ts`
- `backend\src\routes\order.routes.ts`
- `backend\src\routes\orderItem.routes.ts`
- `backend\src\routes\pendingRequest.routes.ts`
- `backend\src\routes\schedule.routes.ts`
- `backend\src\routes\serviceCompany.routes.ts`
- `backend\src\routes\supplier.routes.ts`
- `backend\src\routes\vehicle.routes.ts`
- `backend\src\routes\worker.routes.ts`
- `backend\src\server.ts`
- `backend\src\services\email.service.ts`
- `backend\src\services\logger.service.ts`
- `backend\src\services\pdf.service.ts`
- `backend\src\types\express.d.ts`
- `backend\src\types\index.js`
- `backend\src\types\index.ts`
- `backend\src\utils\emailDnsValidation.ts`
- `backend\src\utils\emailValidator.ts`
- `backend\src\utils\generateToken.ts`
- `backend\src\utils\generateUniqueCode.ts`
- `backend\src\utils\generateVerificationToken.ts`
- `backend\src\utils\hashPassword.ts`
- `backend\src\utils\pagination.ts`
- `backend\src\utils\tokenUtils.ts`
- `backend\src\validators\schemas.ts`
- `backend\test-orders.js`
- `backend\tsconfig.json`
- `backend\tsconfig.test.json`
- `backend\uploads\invoices\.gitkeep`
- `backend\uploads\invoices\INV-202601-1768696339249-227.pdf`
- `backend\uploads\invoices\INV-202601-1768829725932-432.pdf`
- `backend\uploads\invoices\INV-202601-1768832288459-272.pdf`
- `backend\uploads\invoices\INV-202601-1768833944343-194.pdf`
- `backend\uploads\invoices\INV-202601-1768834396789-340.pdf`
- `docs\README.md`
- `frontend\.env`
- `frontend\.gitignore`
- `frontend\dist\assets\index-Ba5aDhYq.js`
- `frontend\dist\assets\index-DM7NPJmi.css`
- `frontend\dist\index.html`
- `frontend\dist\vite.svg`
- `frontend\eslint.config.js`
- `frontend\index.html`
- `frontend\package.json`
- `frontend\package-lock.json`
- `frontend\postcss.config.js`
- `frontend\src\App.css`
- `frontend\src\App.tsx`
- `frontend\src\assets\react.svg`
- `frontend\src\components\admin\CreateTaskModal.tsx`
- `frontend\src\components\admin\EditTaskModal.tsx`
- `frontend\src\components\admin\FinanceChart.tsx`
- `frontend\src\components\admin\OrdersCalendar.tsx`
- `frontend\src\components\admin\ReassignWorkerModal.tsx`
- `frontend\src\components\admin\RecentClients.tsx`
- `frontend\src\components\admin\RecentOrders.tsx`
- `frontend\src\components\admin\SetupWizard.tsx`
- `frontend\src\components\admin\StatsCard.tsx`
- `frontend\src\components\admin\StatsDashboard.tsx`
- `frontend\src\components\admin\UpcomingSchedule.tsx`
- `frontend\src\components\admin\WorkersList.tsx`
- `frontend\src\components\common\Button.tsx`
- `frontend\src\components\common\Checkbox.tsx`
- `frontend\src\components\common\CountdownTimer.tsx`
- `frontend\src\components\common\Input.tsx`
- `frontend\src\components\common\PasswordInput.tsx`
- `frontend\src\components\common\PasswordStrengthBar.tsx`
- `frontend\src\components\layout\Header.tsx`
- `frontend\src\components\layout\MainLayout.tsx`
- `frontend\src\components\layout\Sidebar.tsx`
- `frontend\src\components\mechanic\ScheduleDetailsModal.tsx`
- `frontend\src\context\ActiveServiceContext.ts`
- `frontend\src\context\ActiveServiceProvider.tsx`
- `frontend\src\context\AuthContext.tsx`
- `frontend\src\context\AuthProvider.tsx`
- `frontend\src\context\ServiceCompanyContext.tsx`
- `frontend\src\context\ServiceCompanyProvider.tsx`
- `frontend\src\hooks\useActiveService.ts`
- `frontend\src\hooks\useAuth.ts`
- `frontend\src\hooks\useMechanicService.ts`
- `frontend\src\hooks\useServiceCompany.ts`
- `frontend\src\index.css`
- `frontend\src\main.tsx`
- `frontend\src\pages\admin\ClientDetails.tsx`
- `frontend\src\pages\admin\ClientEdit.tsx`
- `frontend\src\pages\admin\Clients.tsx`
- `frontend\src\pages\admin\Dashboard.tsx`
- `frontend\src\pages\admin\FinalizeOrderModal.tsx`
- `frontend\src\pages\admin\FinanceCreate.tsx`
- `frontend\src\pages\admin\FinanceDashboard.tsx`
- `frontend\src\pages\admin\Finances.tsx`
- `frontend\src\pages\admin\OrderCreate.tsx`
- `frontend\src\pages\admin\OrderDetails.tsx`
- `frontend\src\pages\admin\OrderEdit.tsx`
- `frontend\src\pages\admin\Orders.tsx`
- `frontend\src\pages\admin\PendingRequests.tsx`
- `frontend\src\pages\admin\ScheduleCreate.tsx`
- `frontend\src\pages\admin\ScheduleDaily.module.css`
- `frontend\src\pages\admin\ScheduleDaily.tsx`
- `frontend\src\pages\admin\ScheduleDetails.tsx`
- `frontend\src\pages\admin\ScheduleEdit.tsx`
- `frontend\src\pages\admin\ScheduleMonthly.tsx`
- `frontend\src\pages\admin\Schedules.tsx`
- `frontend\src\pages\admin\ScheduleWeekly.tsx`
- `frontend\src\pages\admin\Settings.tsx`
- `frontend\src\pages\admin\SupplierCreate.tsx`
- `frontend\src\pages\admin\SupplierDetails.tsx`
- `frontend\src\pages\admin\SupplierEdit.tsx`
- `frontend\src\pages\admin\Suppliers.tsx`
- `frontend\src\pages\admin\VehicleCreate.tsx`
- `frontend\src\pages\admin\VehicleDetails.tsx`
- `frontend\src\pages\admin\VehicleEdit.tsx`
- `frontend\src\pages\admin\Vehicles.tsx`
- `frontend\src\pages\admin\WorkerDetails.tsx`
- `frontend\src\pages\admin\WorkerEdit.tsx`
- `frontend\src\pages\admin\Workers.tsx`
- `frontend\src\pages\auth\ForgotPassword.tsx`
- `frontend\src\pages\auth\Login.tsx`
- `frontend\src\pages\auth\Register.tsx`
- `frontend\src\pages\auth\RegisterClient.tsx`
- `frontend\src\pages\auth\RegisterMechanic.tsx`
- `frontend\src\pages\auth\ResetPassword.tsx`
- `frontend\src\pages\auth\RoleSelection.tsx`
- `frontend\src\pages\auth\ServiceRoleSelection.tsx`
- `frontend\src\pages\client\Dashboard.tsx`
- `frontend\src\pages\client\Invoices.tsx`
- `frontend\src\pages\client\NoServiceScreen.tsx`
- `frontend\src\pages\client\Notifications.tsx`
- `frontend\src\pages\client\OrderDetails.tsx`
- `frontend\src\pages\client\Orders.tsx`
- `frontend\src\pages\client\Profile.tsx`
- `frontend\src\pages\client\ServiceCompanies.tsx`
- `frontend\src\pages\client\VehicleDetails.tsx`
- `frontend\src\pages\client\Vehicles.tsx`
- `frontend\src\pages\mechanic\ClientDetails.tsx`
- `frontend\src\pages\mechanic\Clients.tsx`
- `frontend\src\pages\mechanic\Dashboard.tsx`
- `frontend\src\pages\mechanic\NoActiveServiceScreen.tsx`
- `frontend\src\pages\mechanic\OrderDetails.tsx`
- `frontend\src\pages\mechanic\Orders.tsx`
- `frontend\src\pages\mechanic\Profile.tsx`
- `frontend\src\pages\mechanic\Schedule.tsx`
- `frontend\src\pages\mechanic\ServiceSettings.tsx`
- `frontend\src\pages\mechanic\VehicleDetails.tsx`
- `frontend\src\pages\mechanic\Vehicles.tsx`
- `frontend\src\pages\NotFound.tsx`
- `frontend\src\pages\TermsAndConditions.tsx`
- `frontend\src\pages\Unauthorized.tsx`
- `frontend\src\routes\AppRoutes.tsx`
- `frontend\src\routes\ProtectedRoute.tsx`
- `frontend\src\services\api.ts`
- `frontend\src\services\authService.ts`
- `frontend\src\services\dashboardService.ts`
- `frontend\src\services\mechanicService.ts`
- `frontend\src\styles\schedule.css`
- `frontend\src\types\client.ts`
- `frontend\src\types\index.ts`
- `frontend\src\types\mechanic.ts`
- `frontend\src\utils\validation.ts`
- `frontend\src\vite-env.d.ts`
- `frontend\tailwind.config.js`
- `frontend\tsconfig.app.json`
- `frontend\tsconfig.json`
- `frontend\tsconfig.node.json`
- `frontend\vite.config.ts`

