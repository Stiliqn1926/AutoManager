# AutoManager

## Обзор
Проектът е разделен на два основни слоя: `frontend` (React/Vite) и `backend` (Express + Prisma). Архитектурата е типична за SPA приложение с REST API.

## Архитектура
- **Frontend (SPA)**: Клиентско приложение с React 19, роутинг чрез React Router.
- **Backend (REST API)**: Express 5, слой за бизнес логика и достъп до базата.
- **DB слой**: Prisma (ORM), използван от backend.
- **Auth**: JWT (jsonwebtoken), middleware за `authenticate`/`authorize`.

## Структура на проекта
```
AutoManager/
  backend/
    src/
      app.ts
      server.ts
      config/
      controllers/
      routes/
      middleware/
      services/
      validators/
      utils/
      jobs/
      types/
      __tests__/
  frontend/
    src/
      App.tsx
      main.tsx
      components/
      pages/
      routes/
      context/
      hooks/
      services/
      styles/
      types/
      utils/
```

## Backend (Express + Prisma)
Ключови директории:
- `controllers/` – handler-и за REST endpoints.
- `routes/` – дефиниции на маршрути.
- `middleware/` – auth/role проверки, общи middlewares.
- `services/` – бизнес логика извън controllers.
- `validators/` – Joi схеми за валидация.
- `jobs/` – cron задачи (node-cron).
- `utils/` – помощни функции.

Използвани технологии и библиотеки:
- **Express 5** за HTTP сървър.
- **Prisma** за ORM достъп до базата.
- **jsonwebtoken** за токени.
- **bcryptjs** за хеширане на пароли.
- **joi** за валидация.
- **multer** за upload-и.
- **nodemailer** за email.
- **pdfkit** за PDF генерация.
- **winston** за логове.
- **express-rate-limit** за rate limiting.

## Frontend (React + Vite)
Ключови директории:
- `components/` – UI компоненти.
- `pages/` – страници по роли (admin/client/mechanic).
- `routes/` – защитени маршрути.
- `context/` – React контексти (auth, service company, active service).
- `hooks/` – custom hooks.
- `services/` – API клиент (axios).
- `styles/` – глобални стилове (Tailwind).

Използвани технологии и библиотеки:
- **React 19** + **React Router**.
- **Vite** за dev/build.
- **TypeScript**.
- **Tailwind CSS**.
- **Axios** за HTTP заявки.
- **lucide-react** за икони.
- **react-hot-toast** за нотификации.
- **recharts** за графики.

## Скриптове
Frontend:
- `npm run dev` – старт на Vite dev server.
- `npm run build` – production build.
- `npm run lint` – ESLint.

Backend:
- `npm run dev` – стартиране с nodemon.
- `npm test` / `npm run test:watch` / `npm run test:coverage` – Jest тестове.

## Комуникация Frontend ↔ Backend
Frontend използва `frontend/src/services/api.ts` (axios инстанция) за заявки към backend. 
Backend експонира REST API в `backend/src/routes`.
