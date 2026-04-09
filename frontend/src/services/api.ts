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

// 🆕 Flag за да избегнем infinite loop при refresh
// Ако refresh fail-не, не искаме да retry-ваме refresh-а безкрайно
let isRefreshing = false;

// Response interceptor - обработва errors И автоматичен token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Проверяваме дали грешката е 401 (Unauthorized)
    if (error.response?.status === 401) {
      // Ако вече сме правили refresh или това Е refresh request-а, logout
      if (isRefreshing || originalRequest.url === '/auth/refresh') {
        // Refresh token също е изтекъл или невалиден
        // 🆕 Изчистваме само user и redirect към начална страница
        localStorage.removeItem('user');
        window.location.href = '/';
        return Promise.reject(error);
      }

      // Опитваме се да refresh-нем токена
      isRefreshing = true;

      try {
        // Викаме /auth/refresh
        // 🆕 Refresh token се изпраща автоматично в httpOnly cookie
        // Backend връща нов accessToken cookie
        await api.post('/auth/refresh');

        // Reset flag
        isRefreshing = false;

        // 🆕 Retry оригиналната заявка
        // Новият accessToken cookie се изпраща автоматично
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh fail-на - logout
        isRefreshing = false;
        // 🆕 Изчистваме само user и redirect към начална страница
        localStorage.removeItem('user');
        window.location.href = '/';
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
