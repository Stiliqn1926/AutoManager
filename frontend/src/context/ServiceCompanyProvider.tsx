import { useEffect, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { ServiceCompanyContext } from './ServiceCompanyContext';
import type { ServiceCompany, ClientServiceCompany } from './ServiceCompanyContext';
import { useAuth } from '../hooks/useAuth';
import { UserRole } from '../types';
import api from '../services/api';
import toast from 'react-hot-toast';

interface ServiceCompanyProviderProps {
  children: ReactNode;
}

export const ServiceCompanyProvider = ({ children }: ServiceCompanyProviderProps) => {
  const { user, isAuthenticated } = useAuth();
  const [serviceCompanies, setServiceCompanies] = useState<ClientServiceCompany[]>([]);
  const [selectedServiceCompany, setSelectedServiceCompanyState] =
    useState<ServiceCompany | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);


  const fetchServiceCompanies = useCallback(async () => {
    if (!isAuthenticated || user?.role !== UserRole.CLIENT) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.get('/client/service-companies');
      const companies = response.data.serviceCompanies || [];
      setServiceCompanies(companies);

      if (companies.length === 0) {
        setSelectedServiceCompanyState(null);
        setSelectedClientId(null);
        localStorage.removeItem('selectedServiceCompanyId');
        return;
      }


     const savedCompanyId = localStorage.getItem('selectedServiceCompanyId');
if (savedCompanyId && companies.length > 0) {
  const found = companies.find(
    (c: ClientServiceCompany) => c.serviceCompany?.id === savedCompanyId
  );
  if (found && found.serviceCompany) {
    setSelectedServiceCompanyState(found.serviceCompany);
    setSelectedClientId(found.clientId);
  } else {

    const firstValid = companies.find((c: ClientServiceCompany) => c.serviceCompany !== null);
    if (firstValid && firstValid.serviceCompany) {
      setSelectedServiceCompanyState(firstValid.serviceCompany);
      setSelectedClientId(firstValid.clientId);
      localStorage.setItem('selectedServiceCompanyId', firstValid.serviceCompany.id);
    } else {
      setSelectedServiceCompanyState(null);
      setSelectedClientId(null);
      localStorage.removeItem('selectedServiceCompanyId');
    }
  }
} else if (companies.length > 0) {

  const firstValid = companies.find((c: ClientServiceCompany) => c.serviceCompany !== null);
    if (firstValid && firstValid.serviceCompany) {
      setSelectedServiceCompanyState(firstValid.serviceCompany);
      setSelectedClientId(firstValid.clientId);
      localStorage.setItem('selectedServiceCompanyId', firstValid.serviceCompany.id);
    } else {
      setSelectedServiceCompanyState(null);
      setSelectedClientId(null);
      localStorage.removeItem('selectedServiceCompanyId');
    }
}
} catch (error) {
  toast.error('Ð“Ñ€ÐµÑˆÐºÐ° Ð¿Ñ€Ð¸ Ð·Ð°Ñ€ÐµÐ¶Ð´Ð°Ð½Ðµ Ð½Ð° ÑÐµÑ€Ð²Ð¸Ð·Ð¸');
  console.error('Failed to fetch service companies:', error);
} finally {
  setIsLoading(false);
}
}, [isAuthenticated, user?.role]);


  const setSelectedServiceCompany = (companyId: string) => {
    const found = serviceCompanies.find((c) => c.serviceCompany.id === companyId);
    if (found) {
      setSelectedServiceCompanyState(found.serviceCompany);
      setSelectedClientId(found.clientId);
      localStorage.setItem('selectedServiceCompanyId', companyId);


      window.dispatchEvent(
        new CustomEvent('service-company-changed', {
          detail: { serviceCompany: found.serviceCompany, clientId: found.clientId },
        })
      );
    }
  };


 useEffect(() => {
  if (isAuthenticated && user?.role === UserRole.CLIENT) {
    fetchServiceCompanies();
  } else if (!isAuthenticated) {

    setServiceCompanies([]);
    setSelectedServiceCompanyState(null);
    setSelectedClientId(null);
    localStorage.removeItem('selectedServiceCompanyId');
  }
}, [isAuthenticated, user?.role, fetchServiceCompanies]);

  const value = {
    serviceCompanies,
    selectedServiceCompany,
    selectedClientId,
    setSelectedServiceCompany,
    isLoading,
    refreshServiceCompanies: fetchServiceCompanies,
  };

  return (
    <ServiceCompanyContext.Provider value={value}>
      {children}
    </ServiceCompanyContext.Provider>
  );
};

