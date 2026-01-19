import { useContext } from 'react';
import { ActiveServiceContext } from '../context/ActiveServiceContext';

export const useActiveService = () => {
  const context = useContext(ActiveServiceContext);
  if (!context) {
    throw new Error('useActiveService must be used within ActiveServiceProvider');
  }
  return context;
};
