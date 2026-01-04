/**
 * ============================================
 * API SERVICE С АВТОМАТИЧЕН TOKEN REFRESH
 * ============================================
 *
 * ПРОМЕНИ:
 * 1. Добавено withCredentials: true - за изпращане на httpOnly cookies
 * 2. Автоматичен refresh на access token при 401 error
 * 3. Retry на failed request след refresh
 *
 * КАК РАБОТИ REFRESH FLOW:
 * 1. Правим API request с access token
 * 2. Ако получим 401 (токенът е изтекъл):
 *    a. Викаме /auth/refresh (refresh token се изпраща автоматично в cookie)
 *    b. Получаваме нов access token
 *    c. Запазваме го в localStorage
 *    d. Retry-ваме оригиналната заявка с новия токен
 * 3. Ако refresh fail-не (refresh token също е изтекъл):
 *    a. Logout user-а
 *    b. Redirect към login
 */

import axios from 'axios';

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

// Request interceptor - добавя token към всяка заявка
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
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
        // Изчистваме всичко и redirect към login
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(error);
      }

      // Опитваме се да refresh-нем токена
      isRefreshing = true;

      try {
        // Викаме /auth/refresh
        // Refresh token се изпраща автоматично в httpOnly cookie
        const response = await api.post('/auth/refresh');
        const { accessToken } = response.data;

        // Запазваме новия access token
        localStorage.setItem('token', accessToken);

        // Обновяваме Authorization header на оригиналната заявка
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;

        // Reset flag
        isRefreshing = false;

        // Retry оригиналната заявка с новия токен
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh fail-на - logout
        isRefreshing = false;
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // За други errors просто reject-ваме
    return Promise.reject(error);
  }
);

export default api;