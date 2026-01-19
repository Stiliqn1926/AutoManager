import { createContext } from 'react';

export interface ActiveServiceContextType {
  hasActiveService: boolean;
  isLoading: boolean;
  checkActiveService: () => Promise<void>;
}

export const ActiveServiceContext = createContext<ActiveServiceContextType>({
  hasActiveService: false,
  isLoading: true,
  checkActiveService: async () => {},
});
