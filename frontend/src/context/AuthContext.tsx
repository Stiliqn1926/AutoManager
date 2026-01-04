import { createContext } from 'react';
import type { AuthContextType } from '../types';

// Създаваме context с initial стойност undefined
export const AuthContext = createContext<AuthContextType | undefined>(undefined);