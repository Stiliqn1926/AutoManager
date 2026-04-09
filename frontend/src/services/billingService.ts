import api from './api';

export interface CheckoutSessionResponse {
  checkoutUrl: string;
  sessionId: string;
}

export const createCheckoutSession = async (): Promise<CheckoutSessionResponse> => {
  const response = await api.post('/billing/checkout-session');
  return response.data;
};

