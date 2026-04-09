import api from './api';
import type { LoginResponse, RegisterResponse } from '../types';


interface RegisterAdminData {
  email: string;
  password: string;
  role: 'ADMIN';
}


interface RegisterClientData {
  email: string;
  password: string;
  role: 'CLIENT';
}


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


export const registerAdmin = async (data: RegisterAdminData): Promise<RegisterResponse> => {
  const response = await api.post('/auth/register', data);
  return response.data;
};


export const registerClient = async (data: RegisterClientData): Promise<RegisterResponse> => {
  const response = await api.post('/auth/register', data);
  return response.data;
};


export const registerMechanic = async (data: RegisterMechanicData) => {
  const response = await api.post('/auth/register-mechanic', data);
  return response.data;
};

// LOGIN
export const login = async (email: string, password: string, role: 'ADMIN' | 'MECHANIC' | 'CLIENT', rememberMe: boolean = false): Promise<LoginResponse> => {
  const response = await api.post('/auth/login', { email, password, role, rememberMe });
  return response.data;
};


export const forgotPassword = async (email: string) => {
  const response = await api.post('/auth/forgot-password', { email });
  return response.data;
};


export const resetPassword = async (email: string, code: string, newPassword: string) => {
  const response = await api.post('/auth/reset-password', { email, code, newPassword });
  return response.data;
};

