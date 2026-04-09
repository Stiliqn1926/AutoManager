import Stripe from 'stripe';

const createStripeClient = (secretKey: string) => new Stripe(secretKey);

let stripeClient: ReturnType<typeof createStripeClient> | null = null;

const getRequiredEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`${key} is not defined`);
  }
  return value;
};

export const getStripe = () => {
  if (stripeClient) {
    return stripeClient;
  }

  const secretKey = getRequiredEnv('STRIPE_SECRET_KEY');
  stripeClient = createStripeClient(secretKey);
  return stripeClient;
};

export const getStripePriceId = (): string => getRequiredEnv('STRIPE_PRICE_ID');

export const getStripeWebhookSecret = (): string =>
  getRequiredEnv('STRIPE_WEBHOOK_SECRET');

export const getStripeSuccessUrl = (): string =>
  getRequiredEnv('STRIPE_SUCCESS_URL');

export const getStripeCancelUrl = (): string =>
  getRequiredEnv('STRIPE_CANCEL_URL');

export const getFrontendUrl = (): string => getRequiredEnv('FRONTEND_URL');
