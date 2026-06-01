# AutoManager

Уеб платформа за управление на автосервизи с роли `ADMIN`, `MECHANIC`, `CLIENT`, процес за одобрение на заявки, имейл верификация и Stripe абонамент.

Последна актуализация: 10 април 2026 г.

---

## Съдържание

1. [Общ преглед](#общ-преглед)
2. [Технологичен стек](#технологичен-стек)
3. [Функционалности](#функционалности)
4. [Роли и достъп](#роли-и-достъп)
5. [Auth и onboarding потоци](#auth-и-onboarding-потоци)
6. [Stripe абонаменти](#stripe-абонаменти)
7. [Сигурност и стабилност](#сигурност-и-стабилност)
8. [Локален старт](#локален-старт)
9. [Environment променливи](#environment-променливи)
10. [Demo данни и натоварващи тестове](#demo-данни-и-натоварващи-тестове)
11. [Основни API маршрути](#основни-api-маршрути)
12. [Deployment](#deployment)
13. [Структура на проекта](#структура-на-проекта)

---

## Общ преглед

AutoManager покрива целия оперативен цикъл в сервиз:

- клиенти и автомобили
- поръчки и артикули по поръчка
- график и задачи
- фактуриране и PDF
- финанси и dashboard статистики
- доставчици
- известия
- заявки за одобрение (механици/клиенти)
- SaaS абонамент за администраторите чрез Stripe

---

## Технологичен стек

### Backend

- Node.js + TypeScript
- Express `5.2.1`
- Prisma `5.21.1`
- PostgreSQL
- JWT + httpOnly cookies
- Stripe `22.x`
- Resend (имейли)
- Supabase Storage (PDF фактури)
- Jest + Supertest

### Frontend

- React `19`
- React Router `7`
- TypeScript
- Vite `7`
- Tailwind CSS
- Axios
- Recharts

---

## Функционалности

- Landing страница за продукта с отделни вход/регистрация потоци.
- Админ модул:
  - dashboard с KPI и графики
  - управление на работници, клиенти, автомобили, поръчки, график, доставчици, финанси
  - управление на pending заявки (approve/reject)
- Механик модул:
  - dashboard
  - поръчки и детайли
  - клиенти/автомобили
  - график
  - профил
- Клиент модул:
  - dashboard
  - сервизни компании и смяна на активна компания
  - автомобили, поръчки, фактури, известия
  - профил
- Имейл потоци:
  - код за верификация на имейл
  - код за reset password
  - имейли при одобрение/отхвърляне
  - имейли за фактури и ключови събития

---

## Роли и достъп

| Роля | Достъп |
|---|---|
| `ADMIN` | Пълен достъп до сервиза + billing. Оперативните admin endpoints изискват активен абонамент. |
| `MECHANIC` | Работи в контекст на активна сервизна принадлежност. |
| `CLIENT` | Достъп до собствени данни в избран сервиз (чрез membership). |

Допълнително:

- механик и клиент могат да имат membership към повече от един сервиз;
- достъпът е разрешен само при активен membership;
- pending membership блокира входа в системата до одобрение.

---

## Auth и onboarding потоци

### 1) Регистрация на администратор на сервиз

1. `POST /api/auth/register-admin` създава `PendingAdminRegistration`.
2. Системата изпраща код за имейл верификация.
3. Потребителят потвърждава кода през `POST /api/auth/verify-email-code`.
4. Frontend стартира Stripe checkout чрез `POST /api/auth/register-admin/checkout-session`.
5. `checkout.session.completed` (webhook) финализира регистрацията:
   - създава `User (ADMIN)` и `ServiceCompany`
   - записва Stripe customer/subscription данни
6. Админът влиза в системата.

Важно: преди успешно плащане администраторски акаунт не се финализира.

### 2) Регистрация на механик

1. Механикът подава форма с `uniqueCode` на сервиз.
2. Създава се `User (MECHANIC)`, `Worker` и `PendingRequest`.
3. Имейлът се потвърждава с код.
4. До одобрение от admin входът връща `ACCOUNT_PENDING_APPROVAL`.
5. При approve се активира membership и се изпраща имейл.

### 3) Регистрация на клиент

1. Клиентът подава форма с `uniqueCode` на сервиз (задължително).
2. Създава се `User (CLIENT)` + `PendingRequest`.
3. Имейл верификация с код.
4. До approve от admin няма достъп до вътрешните екрани.
5. При approve се активира client membership и се изпраща имейл.

### 4) Вход и сесии

- `POST /api/auth/login` приема `rememberMe`.
- Access token: 15 минути (httpOnly cookie).
- Refresh token: 1 ден или 30 дни при `rememberMe` (httpOnly cookie).
- Автоматичен refresh е имплементиран в `frontend/src/services/api.ts`.

### 5) Кодове и изтичане

- имейл верификация: 10 минути
- reset password код: 15 минути
- resend cooldown: 60 секунди

---

## Stripe абонаменти

### Какво е свързано

- Admin checkout: `POST /api/billing/checkout-session`
- Billing portal: `POST /api/billing/portal-session`
- Subscription status sync: `GET /api/billing/subscription-status`
- Webhook endpoint: `POST /api/billing/webhook` (raw body)

### Какво се пази в базата

В `ServiceCompany`:

- `stripeCustomerId`
- `stripeSubscriptionId`
- `subscriptionStatus`
- `subscriptionCurrentPeriodEnd`
- `subscriptionCancelAtPeriodEnd`

### Enforcement

Middleware `requireActiveAdminSubscription` допуска само:

- `ACTIVE`
- `TRIALING`

При неактивен абонамент се връща `NO_ACTIVE_SUBSCRIPTION` и frontend пренасочва към `/billing/cancel`.

---

## Сигурност и стабилност

- CORS allowlist + `.vercel.app` домейни.
- `trust proxy = 1` за коректни IP-та зад Railway/Vercel.
- Global API rate limit: `1000` заявки / `15` минути.
- Login brute-force limiter: `5` неуспешни опита / `15` минути (по IP + email).
- Blacklist на access tokens при logout и revoke на refresh tokens.
- Ежедневен cleanup job (03:00 Europe/Sofia) за изтекли tokens/codes.
- Polling в frontend за критични екрани (dashboard/lists/details), за да няма „заседнали“ данни след refresh.

---

## Локален старт

### 1) Изисквания

- Node.js 18+
- PostgreSQL
- npm

### 2) Backend

```bash
cd backend
npm install
```

Създай `backend/.env` (виж секцията [Environment променливи](#environment-променливи)).

```bash
npx prisma migrate dev
npx prisma generate
npm run dev
```

Backend URL по подразбиране: `http://localhost:5000`

### 3) Frontend

```bash
cd frontend
npm install
```

Създай `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

Стартирай:

```bash
npm run dev
```

Frontend URL по подразбиране: `http://localhost:5173`

---

## Environment променливи

### Backend (`backend/.env`)

| Променлива | Задължителна | Описание |
|---|---|---|
| `PORT` | не | Порт на backend (default: `5000`) |
| `NODE_ENV` | да | `development` / `production` / `test` |
| `FRONTEND_URL` | да | Frontend origin за CORS и redirect-и |
| `DATABASE_URL` | да | PostgreSQL connection string |
| `JWT_SECRET` | да | Secret за подписване на JWT |
| `DEFAULT_TAX_RATE` | не | Default ДДС ставка |
| `DEFAULT_PAGINATION_LIMIT` | не | Default лимит за списъци |
| `MAX_PAGINATION_LIMIT` | не | Max лимит за списъци |
| `RESEND_API_KEY` | да | API ключ за изпращане на имейли |
| `EMAIL_FROM` | да | Sender адрес за системните имейли |
| `SUPABASE_URL` | да | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | да | Service role ключ |
| `SUPABASE_BUCKET` | не | Bucket за PDF файлове (default: `invoices`) |
| `STRIPE_PRICE_ID` | да | `price_...` за абонаментния план |
| `STRIPE_SECRET_KEY` | да | `sk_test_...` / `sk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | да | `whsec_...` |
| `STRIPE_SUCCESS_URL` | да | Frontend success URL |
| `STRIPE_CANCEL_URL` | да | Frontend cancel URL |
| `AUTH_USER_CACHE_TTL_MS` | не | Cache TTL за auth middleware |
| `AUTH_BLACKLIST_HIT_TTL_MS` | не | Cache TTL при blacklist hit |
| `AUTH_BLACKLIST_MISS_TTL_MS` | не | Cache TTL при blacklist miss |
| `AUTH_CACHE_MAX_ENTRIES` | не | Max cache entries |

Забележка: текущият код използва `Resend` и `Supabase`. Ако копираш стар `.env.example`, добави липсващите ключове за тези интеграции.

### Frontend (`frontend/.env`)

| Променлива | Задължителна | Описание |
|---|---|---|
| `VITE_API_URL` | да | Пълният base URL към backend API (пример: `https://<backend>/api`) |

---

## Demo данни и натоварващи тестове

### Seed demo данни

```bash
cd backend
npm run seed:demo
```
0
020000
Създава:

- 5 сервиза (София/Пловдив)
- 5 admin акаунта
- 10 механика (част от тях в повече от един сервиз)
- 20 клиента (част от тях в повече от един сервиз)
- автомобили, поръчки, график, финанси, доставчици, фактури

Demo парола: `Demo12345!`

Примерни акаунти:

- admin: `admin1@automanager.bg` ... `admin5@automanager.bg`
- mechanic: `mechanic1@automanager.bg` ... `mechanic10@automanager.bg`
- client: `client1@automanager.bg` ... `client20@automanager.bg`

### Изчистване на demo данни

```bash
cd backend
npm run seed:demo:cleanup
```

### Load test (read + write сценарии)

```bash
cd backend
npm run load:test
```

Поддържани ENV за теста:

- `LOAD_TEST_BASE_URL`
- `LOAD_TEST_CONCURRENCY`
- `LOAD_TEST_ITERATIONS`
- `LOAD_TEST_REQUEST_TIMEOUT_MS`
- `LOAD_TEST_ENABLE_WRITES`
- `LOAD_TEST_PASSWORD`

Скриптът изпълнява реални сценарии по роли и извежда p50/p95/p99 latency, error rate и endpoint breakdown.

---

## Основни API маршрути

Base path: `/api`

| Група | Префикс |
|---|---|
| Auth | `/auth` |
| Billing | `/billing` |
| Dashboard | `/dashboard` |
| Service company | `/service-company` |
| Workers | `/worker`, `/workers` |
| Clients | `/clients` |
| Pending approvals | `/pending-requests` |
| Vehicles | `/vehicles` |
| Orders | `/orders` |
| Order items | `/order-items` |
| Invoices | `/invoices` |
| Notifications | `/notifications` |
| Schedules | `/schedules` |
| Client dashboard APIs | `/client` |
| Suppliers | `/suppliers` |
| Finances | `/finances` |
| Health check | `/health` |

---

## Deployment

Текущата архитектура е:

- Frontend: Vercel
- Backend: Railway
- DB: PostgreSQL (Neon)
- Billing: Stripe

### Критични настройки

1. Stripe webhook endpoint трябва да сочи към Railway backend:
   - `https://<your-backend>.up.railway.app/api/billing/webhook`
2. `STRIPE_SUCCESS_URL` и `STRIPE_CANCEL_URL` трябва да сочат към frontend домейна (Vercel), не към localhost.
3. `FRONTEND_URL` в backend трябва да е production frontend домейнът.
4. `VITE_API_URL` във frontend трябва да е production backend `/api` URL.

---

## Структура на проекта

```text
AutoManager/
├─ backend/
│  ├─ prisma/
│  │  ├─ schema.prisma
│  │  └─ migrations/
│  └─ src/
│     ├─ controllers/
│     ├─ middleware/
│     ├─ routes/
│     ├─ services/
│     ├─ scripts/
│     ├─ utils/
│     ├─ app.ts
│     └─ server.ts
├─ frontend/
│  └─ src/
│     ├─ pages/
│     ├─ components/
│     ├─ context/
│     ├─ routes/
│     ├─ services/
│     └─ App.tsx
└─ docs/
   └─ README.md
```
