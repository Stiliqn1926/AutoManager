import { useContext } from 'react';
import { ServiceCompanyContext } from '../context/ServiceCompanyContext';

export const useServiceCompany = () => {
  const context = useContext(ServiceCompanyContext);

  if (!context) {
    throw new Error('useServiceCompany must be used within ServiceCompanyProvider');
  }

  return context;
};