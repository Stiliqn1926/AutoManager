import axios from 'axios';

/**
 * Shared API client used across the frontend.
 * Authentication state is carried by httpOnly cookies.
 */
declare module 'axios' {
  export interface AxiosRequestConfig {
    skipAutoLogout?: boolean;
    _retry?: boolean;
  }
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Required so the browser includes auth cookies on cross-origin requests.
  withCredentials: true,
});

// Reserved request hook for future request metadata (trace ids, etc.).
api.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error),
);

const forceLogout = () => {
  localStorage.removeItem('user');
  window.location.href = '/';
};

// Shared promise avoids sending multiple refresh requests in parallel.
let refreshPromise: Promise<void> | null = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401) {
      if (!originalRequest) {
        return Promise.reject(error);
      }

      // If refresh itself is unauthorized, the session is no longer valid.
      if (originalRequest.url === '/auth/refresh') {
        forceLogout();
        return Promise.reject(error);
      }

      // Prevent retry loops when the retried request fails with 401 again.
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

        await refreshPromise;

        originalRequest._retry = true;
        return api(originalRequest);
      } catch (refreshError) {
        forceLogout();
        return Promise.reject(refreshError);
      }
    }

    const skipAutoLogout = originalRequest?.skipAutoLogout === true;

    if (error.response?.status === 403 && !skipAutoLogout) {
      const errorCode = error.response?.data?.code;

      if (errorCode === 'NO_ACTIVE_SUBSCRIPTION') {
        const currentPath = window.location.pathname;
        if (!currentPath.startsWith('/billing')) {
          window.location.href = '/billing/cancel';
        }
        return Promise.reject(error);
      }

      if (
        errorCode === 'NO_ACTIVE_SERVICE' ||
        errorCode === 'NO_ACTIVE_MEMBERSHIP' ||
        errorCode === 'WORKER_DELETED'
      ) {
        localStorage.removeItem('user');
        window.location.href = '/';
        return Promise.reject(error);
      }
    }

    if (error.response?.status === 404 && !skipAutoLogout) {
      const errorCode = error.response?.data?.code;

      if (errorCode === 'WORKER_NOT_FOUND') {
        localStorage.removeItem('user');
        window.location.href = '/';
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  },
);

export default api;
