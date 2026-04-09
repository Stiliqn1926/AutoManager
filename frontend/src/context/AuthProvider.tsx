import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { AuthContext } from './AuthContext';
import type { User } from '../types';
import api from '../services/api';
import { POLLING_INTERVALS } from '../config/polling';

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  // 🆕 Инициализираме само user state от localStorage
  // Токените са в httpOnly cookies, не се съхраняват в localStorage!
  const [user, setUser] = useState<User | null>(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) return null;

    try {
      return JSON.parse(storedUser);
    } catch {
      // Ако JSON е корумпиран, изчистваме localStorage
      localStorage.removeItem('user');
      return null;
    }
  });

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      return;
    }

    const refreshSession = async () => {
      try {
        await api.post('/auth/refresh');
      } catch {
        // При 401 interceptor-ът ще се погрижи за logout.
      }
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        void refreshSession();
      }
    };

    const intervalId = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        void refreshSession();
      }
    }, POLLING_INTERVALS.keepAlive);

    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [user]);

  /**
   * Login функция
   * @param email
   * @param password
   * @param role - ролята за която влизаме (ADMIN, MECHANIC, CLIENT)
   * @param rememberMe
   *
   * 🆕 ПРОМЕНИ:
   * - Backend връща само user в JSON
   * - accessToken и refreshToken са в httpOnly cookies
   * - НЕ запазваме токени в localStorage!
   */
  const login = async (
    email: string,
    password: string,
    role: string,
    rememberMe: boolean = false
  ) => {
    setIsLoading(true);
    try {
      const response = await api.post(
        '/auth/login',
        {
          email,
          password,
          role,
          rememberMe,
        },
        {
          skipAutoLogout: true,
        }
      );

      // 🆕 Backend връща само user (токените са в cookies)
      const { user: userData } = response.data;

      // Запазваме само user в state и localStorage
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
    } catch (error) {
      // 🔥 ВАЖНО: Re-throw грешката за да я хване Login.tsx!
      setIsLoading(false);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Logout функция
   *
   * 🆕 OPTIMISTIC LOGOUT:
   * - Първо изчистваме локалния state (мигновен logout)
   * - Изчистваме localStorage
   * - Викаме backend logout endpoint за cleanup
   * - Redirect-ваме към root "/" (страница за избор на роля)
   */
  const logout = async () => {
    // 🔥 OPTIMISTIC: Първо изчистваме user (незабавен logout)
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('selectedServiceCompanyId');

    // После cleanup в background
    try {
      // Викаме backend logout endpoint
      // Това ще изтрие tokens от DB и cookies
      await api.post('/auth/logout');
    } catch (error) {
      // Грешката не е критична - user е вече logout-нат локално
      console.error('Logout cleanup error:', error);
    }

    // Редирект-ваме към root "/" (страница за избор на роля)
    window.location.href = '/';
  };

  // 🆕 Проверка дали потребителят е authenticated
  // Сега проверяваме само дали има user (токените са в cookies)
  const isAuthenticated = Boolean(user);

  const value = {
    user,
    login,
    logout,
    isAuthenticated,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
