import { createContext } from 'react';

export interface ServiceCompany {
  id: string;
  name: string;
  address: string | null;
  phone: string;
  email: string;
  uniqueCode: string;
}

export interface ClientServiceCompany {
  clientId: string;
  serviceCompany: ServiceCompany;
}

export interface ServiceCompanyContextType {
  serviceCompanies: ClientServiceCompany[];
  selectedServiceCompany: ServiceCompany | null;
  selectedClientId: string | null;
  setSelectedServiceCompany: (companyId: string) => void;
  isLoading: boolean;
  refreshServiceCompanies: () => Promise<void>;
}

export const ServiceCompanyContext = createContext<ServiceCompanyContextType | undefined>(
  undefined
);