import api from './api';
import type { LoginResponse, RegisterResponse } from '../types';

// Регистрация на ADMIN
interface RegisterAdminData {
  email: string;
  password: string;
  role: 'ADMIN';
}

// Регистрация на CLIENT
interface RegisterClientData {
  email: string;
  password: string;
  role: 'CLIENT';
}

// Регистрация на MECHANIC
interface RegisterMechanicData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  specialization?: string;
  skills?: string;
  uniqueCode: string;
}

// РЕГИСТРАЦИЯ НА АДМИН
export const registerAdmin = async (data: RegisterAdminData): Promise<RegisterResponse> => {
  const response = await api.post('/auth/register', data);
  return response.data;
};

// РЕГИСТРАЦИЯ НА CLIENT
export const registerClient = async (data: RegisterClientData): Promise<RegisterResponse> => {
  const response = await api.post('/auth/register', data);
  return response.data;
};

// РЕГИСТРАЦИЯ НА МЕХАНИК
export const registerMechanic = async (data: RegisterMechanicData) => {
  const response = await api.post('/auth/register-mechanic', data);
  return response.data;
};

// LOGIN
export const login = async (email: string, password: string, role: 'ADMIN' | 'MECHANIC' | 'CLIENT', rememberMe: boolean = false): Promise<LoginResponse> => {
  const response = await api.post('/auth/login', { email, password, role, rememberMe });
  return response.data;
};

// ЗАБРАВЕНА ПАРОЛА
export const forgotPassword = async (email: string) => {
  const response = await api.post('/auth/forgot-password', { email });
  return response.data;
};

// RESET НА ПАРОЛА
export const resetPassword = async (email: string, code: string, newPassword: string) => {
  const response = await api.post('/auth/reset-password', { email, code, newPassword });
  return response.data;
};