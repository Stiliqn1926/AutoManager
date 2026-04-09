import api from './api';

export interface CheckoutSessionResponse {
  checkoutUrl: string;
  sessionId: string;
}

export const createCheckoutSession = async (): Promise<CheckoutSessionResponse> => {
  const response = await api.post('/billing/checkout-session');
  return response.data;
};

export const createAdminRegistrationCheckoutSession = async (
  email: string
): Promise<CheckoutSessionResponse> => {
  const response = await api.post('/auth/register-admin/checkout-session', {
    email,
  });
  return response.data;
};

export interface AdminRegistrationStatusResponse {
  status: string;
  isCompleted: boolean;
}

export const getAdminRegistrationStatus = async (
  email: string
): Promise<AdminRegistrationStatusResponse> => {
  const response = await api.get('/auth/register-admin/status', {
    params: { email },
  });
  return response.data;
};
