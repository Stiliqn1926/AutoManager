import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';
import { UserRole } from '../types';
import api from '../services/api';
import { ActiveServiceContext } from './ActiveServiceContext';
import { POLLING_INTERVALS } from '../config/polling';

interface Props {
  children: ReactNode;
}

export const ActiveServiceProvider = ({ children }: Props) => {
  const { user } = useAuth();
  const [hasActiveService, setHasActiveService] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const checkActiveService = useCallback(async () => {

    if (user?.role !== UserRole.MECHANIC) {
      setIsLoading(false);
      setHasActiveService(false);
      return;
    }

    try {
      setIsLoading(true);
      
      await api.get('/workers/service-companies/active', { skipAutoLogout: true });
      setHasActiveService(true);
    } catch (error: unknown) {
      const err = error as {
        response?: { status?: number; data?: { code?: string } };
      };

      if (
        err.response?.status === 404 ||
        err.response?.status === 403 ||
        err.response?.data?.code === 'NO_ACTIVE_SERVICE' ||
        err.response?.data?.code === 'NO_ACTIVE_MEMBERSHIP' ||
        err.response?.data?.code === 'WORKER_NOT_FOUND'
      ) {
        setHasActiveService(false);
      } else {
        
        console.error('Error checking active service:', error);
        setHasActiveService(false);
      }
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    checkActiveService();
  }, [checkActiveService]);


  useEffect(() => {
    if (user?.role !== UserRole.MECHANIC || hasActiveService || isLoading) {
      return;
    }

    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        void checkActiveService();
      }
    }, POLLING_INTERVALS.activeServiceCheck);

    return () => clearInterval(interval);
  }, [user, hasActiveService, isLoading, checkActiveService]);

  return (
    <ActiveServiceContext.Provider value={{ hasActiveService, isLoading, checkActiveService }}>
      {children}
    </ActiveServiceContext.Provider>
  );
};
