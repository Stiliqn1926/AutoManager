import { Request, Response } from 'express';
import {
  AdminRegistrationStatus,
  SubscriptionStatus,
  UserRole,
} from '@prisma/client';
import prisma from '../config/database';
import logger from '../services/logger.service';
import { generateUniqueCode } from '../utils/generateUniqueCode';
import {
  getFrontendUrl,
  getStripe,
  getStripeCancelUrl,
  getStripePriceId,
  getStripeSuccessUrl,
  getStripeWebhookSecret,
} from '../services/stripe.service';

interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
    serviceCompanyId?: string;
  };
}

const mapStripeStatusToSubscriptionStatus = (
  status: string
): SubscriptionStatus => {
  switch (status) {
    case 'trialing':
      return SubscriptionStatus.TRIALING;
    case 'active':
      return SubscriptionStatus.ACTIVE;
    case 'past_due':
      return SubscriptionStatus.PAST_DUE;
    case 'canceled':
      return SubscriptionStatus.CANCELED;
    case 'unpaid':
      return SubscriptionStatus.UNPAID;
    case 'incomplete':
      return SubscriptionStatus.INCOMPLETE;
    case 'incomplete_expired':
      return SubscriptionStatus.CANCELED;
    case 'paused':
      return SubscriptionStatus.PAST_DUE;
    default:
      return SubscriptionStatus.INCOMPLETE;
  }
};

const unixToDate = (timestamp: number | null | undefined): Date | null => {
  if (!timestamp) return null;
  return new Date(timestamp * 1000);
};

const getServiceCompanyForAdmin = async (userId: string) =>
  prisma.serviceCompany.findUnique({
    where: { userId },
  });

const ensureStripeCustomer = async (serviceCompanyId: string) => {
  const serviceCompany = await prisma.serviceCompany.findUnique({
    where: { id: serviceCompanyId },
  });

  if (!serviceCompany) {
    return null;
  }

  if (serviceCompany.stripeCustomerId) {
    return {
      serviceCompany,
      stripeCustomerId: serviceCompany.stripeCustomerId,
    };
  }

  const stripe = getStripe();
  const customer = await stripe.customers.create({
    email: serviceCompany.email,
    name: serviceCompany.name,
    metadata: {
      serviceCompanyId: serviceCompany.id,
    },
  });

  await prisma.serviceCompany.update({
    where: { id: serviceCompany.id },
    data: { stripeCustomerId: customer.id },
  });

  return {
    serviceCompany,
    stripeCustomerId: customer.id,
  };
};

const buildSubscriptionUpdatePayload = (subscription: any) => {
  const customerId =
    typeof subscription.customer === 'string'
      ? subscription.customer
      : subscription.customer.id;

  return {
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscription.id,
    subscriptionStatus: mapStripeStatusToSubscriptionStatus(subscription.status),
    subscriptionCurrentPeriodEnd: unixToDate(subscription.current_period_end),
    subscriptionCancelAtPeriodEnd: subscription.cancel_at_period_end,
  };
};

const finalizePendingAdminRegistration = async (params: {
  pendingRegistrationId: string;
  customerId: string | null;
  subscriptionId: string | null;
  subscriptionPayload?: ReturnType<typeof buildSubscriptionUpdatePayload>;
}) => {
  const {
    pendingRegistrationId,
    customerId,
    subscriptionId,
    subscriptionPayload,
  } = params;

  const pendingRegistration = await prisma.pendingAdminRegistration.findUnique({
    where: { id: pendingRegistrationId },
  });

  if (!pendingRegistration) {
    logger.warn(
      `checkout.session.completed for unknown pending registration (${pendingRegistrationId})`
    );
    return;
  }

  if (pendingRegistration.status === AdminRegistrationStatus.COMPLETED) {
    return;
  }

  if (!pendingRegistration.emailVerifiedAt) {
    logger.warn(
      `checkout.session.completed before email verification (${pendingRegistrationId})`
    );
    return;
  }

  if (pendingRegistration.expiresAt < new Date()) {
    await prisma.pendingAdminRegistration.update({
      where: { id: pendingRegistration.id },
      data: { status: AdminRegistrationStatus.EXPIRED },
    });
    return;
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: pendingRegistration.email },
    include: { serviceCompany: true },
  });

  if (existingUser) {
    if (existingUser.serviceCompany) {
      const updateData: {
        stripeCustomerId?: string;
        stripeSubscriptionId?: string;
        subscriptionStatus?: SubscriptionStatus;
        subscriptionCurrentPeriodEnd?: Date | null;
        subscriptionCancelAtPeriodEnd?: boolean;
      } = {};

      if (customerId) updateData.stripeCustomerId = customerId;
      if (subscriptionPayload) Object.assign(updateData, subscriptionPayload);
      if (subscriptionId && !updateData.stripeSubscriptionId) {
        updateData.stripeSubscriptionId = subscriptionId;
      }
      if (!updateData.subscriptionStatus) {
        updateData.subscriptionStatus = SubscriptionStatus.ACTIVE;
      }

      await prisma.serviceCompany.update({
        where: { id: existingUser.serviceCompany.id },
        data: updateData,
      });

      await prisma.pendingAdminRegistration.update({
        where: { id: pendingRegistration.id },
        data: {
          status: AdminRegistrationStatus.COMPLETED,
          completedAt: new Date(),
          createdUserId: existingUser.id,
          createdServiceCompanyId: existingUser.serviceCompany.id,
          verificationCodeHash: null,
          verificationCodeExpiresAt: null,
        },
      });
    } else {
      logger.warn(
        `Pending registration email already exists without service company (${pendingRegistration.email})`
      );
    }
    return;
  }

  const uniqueCode = generateUniqueCode();

  await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email: pendingRegistration.email,
        password: pendingRegistration.passwordHash,
        role: UserRole.ADMIN,
        emailVerified: true,
      },
    });

    const serviceCompany = await tx.serviceCompany.create({
      data: {
        name: pendingRegistration.companyName,
        address: pendingRegistration.companyAddress,
        phone: pendingRegistration.companyPhone,
        email: pendingRegistration.companyEmail,
        uniqueCode,
        bulstat: pendingRegistration.bulstat,
        vatNumber: pendingRegistration.vatNumber,
        description: pendingRegistration.description,
        userId: user.id,
        stripeCustomerId: customerId || pendingRegistration.stripeCustomerId || null,
        stripeSubscriptionId:
          subscriptionPayload?.stripeSubscriptionId || subscriptionId || null,
        subscriptionStatus:
          subscriptionPayload?.subscriptionStatus || SubscriptionStatus.ACTIVE,
        subscriptionCurrentPeriodEnd:
          subscriptionPayload?.subscriptionCurrentPeriodEnd || null,
        subscriptionCancelAtPeriodEnd:
          subscriptionPayload?.subscriptionCancelAtPeriodEnd || false,
      },
    });

    await tx.pendingAdminRegistration.update({
      where: { id: pendingRegistration.id },
      data: {
        status: AdminRegistrationStatus.COMPLETED,
        completedAt: new Date(),
        createdUserId: user.id,
        createdServiceCompanyId: serviceCompany.id,
        verificationCodeHash: null,
        verificationCodeExpiresAt: null,
      },
    });
  });
};

export const createCheckoutSession = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const serviceCompany = await getServiceCompanyForAdmin(userId);

    if (!serviceCompany) {
      res.status(404).json({ message: 'Сервизът не е намерен' });
      return;
    }

    const customerResult = await ensureStripeCustomer(serviceCompany.id);

    if (!customerResult) {
      res.status(404).json({ message: 'Сервизът не е намерен' });
      return;
    }

    const stripe = getStripe();
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerResult.stripeCustomerId,
      line_items: [
        {
          price: getStripePriceId(),
          quantity: 1,
        },
      ],
      success_url: `${getStripeSuccessUrl()}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: getStripeCancelUrl(),
      allow_promotion_codes: true,
      client_reference_id: serviceCompany.id,
      metadata: {
        serviceCompanyId: serviceCompany.id,
        userId,
      },
      subscription_data: {
        metadata: {
          serviceCompanyId: serviceCompany.id,
          userId,
        },
      },
    });

    if (!checkoutSession.url) {
      res.status(500).json({ message: 'Неуспешно създаване на Checkout сесия' });
      return;
    }

    res.status(200).json({
      checkoutUrl: checkoutSession.url,
      sessionId: checkoutSession.id,
    });
  } catch (error) {
    logger.error('Create checkout session error:', error);
    res.status(500).json({ message: 'Сървърна грешка' });
  }
};

export const createBillingPortalSession = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const serviceCompany = await getServiceCompanyForAdmin(userId);

    if (!serviceCompany) {
      res.status(404).json({ message: 'Сервизът не е намерен' });
      return;
    }

    const customerResult = await ensureStripeCustomer(serviceCompany.id);

    if (!customerResult) {
      res.status(404).json({ message: 'Сервизът не е намерен' });
      return;
    }

    const stripe = getStripe();
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerResult.stripeCustomerId,
      return_url: getFrontendUrl(),
    });

    res.status(200).json({
      portalUrl: portalSession.url,
    });
  } catch (error) {
    logger.error('Create billing portal session error:', error);
    res.status(500).json({ message: 'Сървърна грешка' });
  }
};

export const getSubscriptionStatus = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const serviceCompany = await getServiceCompanyForAdmin(userId);

    if (!serviceCompany) {
      res.status(404).json({ message: 'Сервизът не е намерен' });
      return;
    }

    if (!serviceCompany.stripeSubscriptionId) {
      res.status(200).json({
        hasSubscription: false,
        status: serviceCompany.subscriptionStatus,
        currentPeriodEnd: serviceCompany.subscriptionCurrentPeriodEnd,
        cancelAtPeriodEnd: serviceCompany.subscriptionCancelAtPeriodEnd,
      });
      return;
    }

    const stripe = getStripe();
    const subscription = await stripe.subscriptions.retrieve(
      serviceCompany.stripeSubscriptionId
    );

    const updatePayload = buildSubscriptionUpdatePayload(subscription);

    const updatedCompany = await prisma.serviceCompany.update({
      where: { id: serviceCompany.id },
      data: updatePayload,
    });

    res.status(200).json({
      hasSubscription: true,
      status: updatedCompany.subscriptionStatus,
      currentPeriodEnd: updatedCompany.subscriptionCurrentPeriodEnd,
      cancelAtPeriodEnd: updatedCompany.subscriptionCancelAtPeriodEnd,
      stripeSubscriptionId: updatedCompany.stripeSubscriptionId,
    });
  } catch (error) {
    logger.error('Get subscription status error:', error);
    res.status(500).json({ message: 'Сървърна грешка' });
  }
};

const findServiceCompanyForSubscriptionEvent = async (
  subscriptionId: string,
  customerId: string | null
) => {
  const bySubscription = await prisma.serviceCompany.findUnique({
    where: { stripeSubscriptionId: subscriptionId },
  });

  if (bySubscription) {
    return bySubscription;
  }

  if (customerId) {
    return prisma.serviceCompany.findUnique({
      where: { stripeCustomerId: customerId },
    });
  }

  return null;
};

export const handleStripeWebhook = async (
  req: Request,
  res: Response
): Promise<void> => {
  const stripe = getStripe();
  const signatureHeader = req.headers['stripe-signature'];

  if (!signatureHeader || Array.isArray(signatureHeader)) {
    res.status(400).send('Missing stripe-signature header');
    return;
  }

  const payload = Buffer.isBuffer(req.body)
    ? req.body
    : Buffer.from(JSON.stringify(req.body));

  let event: any;
  try {
    event = stripe.webhooks.constructEvent(
      payload,
      signatureHeader,
      getStripeWebhookSecret()
    );
  } catch (error) {
    logger.error('Stripe webhook signature verification failed:', error);
    res.status(400).send('Webhook signature verification failed');
    return;
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as any;
        const pendingAdminRegistrationId =
          session.metadata?.pendingAdminRegistrationId ?? null;
        const serviceCompanyId =
          session.metadata?.serviceCompanyId ?? session.client_reference_id ?? null;
        const customerId =
          typeof session.customer === 'string'
            ? session.customer
            : session.customer?.id ?? null;
        const subscriptionId =
          typeof session.subscription === 'string'
            ? session.subscription
            : session.subscription?.id ?? null;

        if (pendingAdminRegistrationId) {
          let subscriptionPayload:
            | ReturnType<typeof buildSubscriptionUpdatePayload>
            | undefined;

          if (subscriptionId) {
            const subscription = await stripe.subscriptions.retrieve(subscriptionId);
            subscriptionPayload = buildSubscriptionUpdatePayload(subscription);
          }

          await finalizePendingAdminRegistration({
            pendingRegistrationId: pendingAdminRegistrationId,
            customerId,
            subscriptionId,
            subscriptionPayload,
          });
          break;
        }

        if (!serviceCompanyId) {
          logger.warn('checkout.session.completed without serviceCompanyId metadata');
          break;
        }

        const updateData: {
          stripeCustomerId?: string;
          stripeSubscriptionId?: string;
          subscriptionStatus?: SubscriptionStatus;
          subscriptionCurrentPeriodEnd?: Date | null;
          subscriptionCancelAtPeriodEnd?: boolean;
        } = {};

        if (customerId) {
          updateData.stripeCustomerId = customerId;
        }

        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          Object.assign(updateData, buildSubscriptionUpdatePayload(subscription));
        }

        if (!updateData.subscriptionStatus) {
          updateData.subscriptionStatus = SubscriptionStatus.ACTIVE;
        }

        await prisma.serviceCompany.update({
          where: { id: serviceCompanyId },
          data: updateData,
        });
        break;
      }

      case 'checkout.session.expired': {
        const session = event.data.object as any;
        const pendingAdminRegistrationId =
          session.metadata?.pendingAdminRegistrationId ?? null;

        if (!pendingAdminRegistrationId) {
          break;
        }

        await prisma.pendingAdminRegistration.updateMany({
          where: {
            id: pendingAdminRegistrationId,
            status: { not: AdminRegistrationStatus.COMPLETED },
          },
          data: {
            status: AdminRegistrationStatus.CANCELED,
          },
        });
        break;
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as any;
        const customerId =
          typeof subscription.customer === 'string'
            ? subscription.customer
            : subscription.customer.id;

        const company = await findServiceCompanyForSubscriptionEvent(
          subscription.id,
          customerId
        );

        if (!company) {
          logger.warn(
            `Subscription webhook for unknown service company (subscription=${subscription.id})`
          );
          break;
        }

        await prisma.serviceCompany.update({
          where: { id: company.id },
          data: buildSubscriptionUpdatePayload(subscription),
        });
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as any;
        const subscriptionId =
          typeof invoice.subscription === 'string'
            ? invoice.subscription
            : invoice.subscription?.id ?? null;
        const customerId =
          typeof invoice.customer === 'string'
            ? invoice.customer
            : invoice.customer?.id ?? null;

        let company = null;
        if (subscriptionId) {
          company = await findServiceCompanyForSubscriptionEvent(
            subscriptionId,
            customerId
          );
        } else if (customerId) {
          company = await prisma.serviceCompany.findUnique({
            where: { stripeCustomerId: customerId },
          });
        }

        if (!company) {
          logger.warn('invoice.payment_failed for unknown service company');
          break;
        }

        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          await prisma.serviceCompany.update({
            where: { id: company.id },
            data: buildSubscriptionUpdatePayload(subscription),
          });
        } else {
          await prisma.serviceCompany.update({
            where: { id: company.id },
            data: {
              subscriptionStatus: SubscriptionStatus.PAST_DUE,
            },
          });
        }
        break;
      }

      default:
        logger.info(`Unhandled Stripe event type: ${event.type}`);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    logger.error('Stripe webhook handling error:', error);
    res.status(500).json({ message: 'Сървърна грешка при обработка на webhook' });
  }
};

