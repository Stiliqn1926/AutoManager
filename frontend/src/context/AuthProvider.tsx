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


  const [user, setUser] = useState<User | null>(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) return null;

    try {
      return JSON.parse(storedUser);
    } catch {

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
        // Keep-alive failures are handled by guarded routes and next auth-required request.
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
   * Starts an authenticated session and persists user metadata locally.
   * Token handling remains fully cookie-based.
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


      const { user: userData } = response.data;


      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
    } catch (error) {

      setIsLoading(false);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Performs optimistic logout:
   * clear local auth state first, then call server cleanup in background.
   */
  const logout = async () => {

    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('selectedServiceCompanyId');


    try {


      await api.post('/auth/logout');
    } catch (error) {

      console.error('Logout cleanup error:', error);
    }


    window.location.href = '/';
  };



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

