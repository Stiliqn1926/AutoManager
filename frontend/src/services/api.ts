/**
 * ============================================
 * API SERVICE С АВТОМАТИЧЕН TOKEN REFRESH
 * ============================================
 *
 * 🆕 httpOnly Cookie Strategy:
 * - withCredentials: true изпраща cookies автоматично
 * - accessToken и refreshToken са в httpOnly cookies
 * - НЕ използваме localStorage за токени!
 *
 * КАК РАБОТИ REFRESH FLOW:
 * 1. Правим API request (браузърът изпраща accessToken cookie)
 * 2. Ако получим 401 (токенът е изтекъл):
 *    a. Викаме /auth/refresh (refreshToken cookie се изпраща автоматично)
 *    b. Backend връща нов accessToken cookie
 *    c. Retry-ваме оригиналната заявка (с новия accessToken cookie)
 * 3. Ако refresh fail-не (refresh token също е изтекъл):
 *    a. Изчистваме user от localStorage
 *    b. Redirect към начална страница (/)
 */

import axios from 'axios';

// Разширяваме axios config типа за да добавим custom property
declare module 'axios' {
  export interface AxiosRequestConfig {
    skipAutoLogout?: boolean;
    _retry?: boolean;
  }
}

// Базов URL на backend
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Създаваме axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // 🆕 ВАЖНО: Това казва на axios да изпраща cookies при cross-origin requests
  // Без това httpOnly cookie-тата НЕ ЩЕ СЕ ИЗПРАЩАТ!
  withCredentials: true,
});

// Request interceptor
// 🆕 НЕ добавяме Authorization header - токените са в cookies!
// Браузърът автоматично изпраща cookies с withCredentials: true
api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

const forceLogout = () => {
  localStorage.removeItem('user');
  window.location.href = '/';
};

// Една обща promise за refresh - всички паралелни 401 заявки чакат нея
let refreshPromise: Promise<void> | null = null;

// Response interceptor - обработва errors И автоматичен token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Проверяваме дали грешката е 401 (Unauthorized)
    if (error.response?.status === 401) {
      if (!originalRequest) {
        return Promise.reject(error);
      }

      // Ако самият refresh endpoint върне 401 -> logout
      if (originalRequest.url === '/auth/refresh') {
        forceLogout();
        return Promise.reject(error);
      }

      // Предпазване от безкраен retry loop
      if (originalRequest._retry) {
        return Promise.reject(error);
      }

      try {
        if (!refreshPromise) {
          refreshPromise = api
            .post('/auth/refresh')
            .then(() => undefined)
            .finally(() => {
              refreshPromise = null;
            });
        }

        // Чакаме общия refresh
        await refreshPromise;

        originalRequest._retry = true;
        return api(originalRequest);
      } catch (refreshError) {
        forceLogout();
        return Promise.reject(refreshError);
      }
    }

    // 🆕 Проверка дали заявката иска да skip-не auto-logout
    // Използва се за endpoint-и които СПЕЦИАЛНО проверяват за активен сервиз
    const skipAutoLogout = originalRequest.skipAutoLogout === true;

    // Проверяваме дали грешката е 403 (Forbidden) - механик изтрит от админ
    if (error.response?.status === 403 && !skipAutoLogout) {
      const errorCode = error.response?.data?.code;

      if (errorCode === 'NO_ACTIVE_SUBSCRIPTION') {
        const currentPath = window.location.pathname;
        if (!currentPath.startsWith('/billing')) {
          window.location.href = '/billing/cancel';
        }
        return Promise.reject(error);
      }

      // Ако механикът е изтрит или няма активен сервиз, logout
      if (errorCode === 'NO_ACTIVE_SERVICE' || errorCode === 'NO_ACTIVE_MEMBERSHIP' || errorCode === 'WORKER_DELETED') {
        localStorage.removeItem('user');
        window.location.href = '/';
        return Promise.reject(error);
      }
    }

    // Проверяваме дали грешката е 404 - Worker profile not found
    if (error.response?.status === 404 && !skipAutoLogout) {
      const errorCode = error.response?.data?.code;

      // Ако Worker профилът е изтрит, logout
      if (errorCode === 'WORKER_NOT_FOUND') {
        localStorage.removeItem('user');
        window.location.href = '/';
        return Promise.reject(error);
      }
    }

    // За други errors просто reject-ваме
    return Promise.reject(error);
  }
);

export default api;
