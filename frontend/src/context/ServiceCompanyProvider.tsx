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

  // Fetch service companies от backend
  const fetchServiceCompanies = useCallback(async () => {
    if (!isAuthenticated || user?.role !== UserRole.CLIENT) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.get('/client/service-companies');
      const companies = response.data.serviceCompanies || [];
      setServiceCompanies(companies);

      // Ако има запазен избор в localStorage, възстанови го
     const savedCompanyId = localStorage.getItem('selectedServiceCompanyId');
if (savedCompanyId && companies.length > 0) {
  const found = companies.find(
    (c: ClientServiceCompany) => c.serviceCompany?.id === savedCompanyId
  );
  if (found && found.serviceCompany) {  // 🆕 null check
    setSelectedServiceCompanyState(found.serviceCompany);
    setSelectedClientId(found.clientId);
  } else {
    // Ако запазеният сервиз не съществува, избери първия валиден
    const firstValid = companies.find((c: ClientServiceCompany) => c.serviceCompany !== null);
    if (firstValid && firstValid.serviceCompany) {  // 🆕 null check
      setSelectedServiceCompanyState(firstValid.serviceCompany);
      setSelectedClientId(firstValid.clientId);
      localStorage.setItem('selectedServiceCompanyId', firstValid.serviceCompany.id);
    }
  }
} else if (companies.length > 0) {
  // Ако няма запазен избор, избери първия валиден
  const firstValid = companies.find((c: ClientServiceCompany) => c.serviceCompany !== null);
  if (firstValid && firstValid.serviceCompany) {  // 🆕 null check
    setSelectedServiceCompanyState(firstValid.serviceCompany);
    setSelectedClientId(firstValid.clientId);
    localStorage.setItem('selectedServiceCompanyId', firstValid.serviceCompany.id);
  }
}
} catch (error) {
  toast.error('Грешка при зареждане на сервизи');
  console.error('Failed to fetch service companies:', error);
} finally {
  setIsLoading(false);
}
}, [isAuthenticated, user?.role]);

  // Смяна на избран сервиз
  const setSelectedServiceCompany = (companyId: string) => {
    const found = serviceCompanies.find((c) => c.serviceCompany.id === companyId);
    if (found) {
      setSelectedServiceCompanyState(found.serviceCompany);
      setSelectedClientId(found.clientId);
      localStorage.setItem('selectedServiceCompanyId', companyId);

      // Emit custom event за да се знае че сервизът е сменен
      window.dispatchEvent(
        new CustomEvent('service-company-changed', {
          detail: { serviceCompany: found.serviceCompany, clientId: found.clientId },
        })
      );
    }
  };

    // Зареди сервизи при login
 useEffect(() => {
  if (isAuthenticated && user?.role === UserRole.CLIENT) {
    fetchServiceCompanies();
  } else if (!isAuthenticated) {
    // Изчисти state САМО при logout (не за ADMIN/MECHANIC)
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