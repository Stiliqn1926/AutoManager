import { useContext } from 'react';
import { ServiceCompanyContext } from '../context/ServiceCompanyContext';

export const useMechanicService = () => {
  const context = useContext(ServiceCompanyContext);
  if (!context) {
    throw new Error('useMechanicService must be used within ServiceCompanyProvider');
  }
  return context;
};

