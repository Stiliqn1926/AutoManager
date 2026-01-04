import { useState } from 'react';
import type { ReactNode } from 'react';
import { AuthContext } from './AuthContext';
import type { User } from '../types';
import api from '../services/api';

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  // Инициализираме state директно със стойностите от localStorage
  const [user, setUser] = useState<User | null>(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) return null;

    try {
      return JSON.parse(storedUser);
    } catch {
      // Ако JSON е корумпиран, изчистваме localStorage
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      return null;
    }
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('token');
  });

  const [isLoading, setIsLoading] = useState(false);

  /**
   * Login функция
   * @param email
   * @param password
   * @param rememberMe
   *
   * ПРОМЕНИ:
   * - Сега backend връща accessToken вместо token
   * - Refresh token вече НЕ идва в JSON - той е в httpOnly cookie
   */
  const login = async (
    email: string,
    password: string,
    rememberMe: boolean = false
  ) => {
    setIsLoading(true);
    try {
      const response = await api.post('/auth/login', {
        email,
        password,
        rememberMe,
      });

      // 🆕 Backend връща accessToken (не token)
      // Refresh token е в httpOnly cookie и не го виждаме тук
      const { accessToken, user: userData } = response.data;

      // Запазваме в state
      setToken(accessToken);
      setUser(userData);

      // Запазваме в localStorage
      localStorage.setItem('token', accessToken);
      localStorage.setItem('user', JSON.stringify(userData));
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Logout функция
   *
   * ПРОМЕНИ:
   * - Сега викаме /auth/logout endpoint
   * - Backend изтрива refresh token от DB
   * - Backend добавя access token в blacklist
   * - Backend изтрива refresh token cookie
   */
  const logout = async () => {
    try {
      // Викаме backend logout endpoint
      // Това ще изтрие refresh token от DB и cookie
      await api.post('/auth/logout');
    } catch (error) {
      // Дори ако logout fail-не, локално изчистваме
      console.error('Logout error:', error);
    } finally {
      // Изчистваме local state и localStorage
      setUser(null);
      setToken(null);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  };

  // Проверка дали потребителят е authenticated
  const isAuthenticated = Boolean(token && user);

  const value = {
    user,
    token,
    login,
    logout,
    isAuthenticated,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
