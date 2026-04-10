import prisma from '../config/database';

const TEST_EMAIL_SUFFIX = '@automanager-test.com';

const ensureTestEnvironment = (): void => {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error(
      'Refusing to run integration test cleanup outside NODE_ENV=test.'
    );
  }
};

export const resetIntegrationTestData = async (): Promise<void> => {
  ensureTestEnvironment();

  // Clean standalone registration rows first (not FK-linked to users table).
  await prisma.pendingAdminRegistration.deleteMany({
    where: { email: { endsWith: TEST_EMAIL_SUFFIX } },
  });

  // Drop test service companies and test users.
  await prisma.serviceCompany.deleteMany({
    where: {
      OR: [
        { email: { endsWith: TEST_EMAIL_SUFFIX } },
        { user: { email: { endsWith: TEST_EMAIL_SUFFIX } } },
      ],
    },
  });

  await prisma.user.deleteMany({
    where: { email: { endsWith: TEST_EMAIL_SUFFIX } },
  });

  // Safety net for any orphan test rows.
  await prisma.pendingRequest.deleteMany({
    where: { email: { endsWith: TEST_EMAIL_SUFFIX } },
  });
  await prisma.client.deleteMany({
    where: { email: { endsWith: TEST_EMAIL_SUFFIX } },
  });
  await prisma.worker.deleteMany({
    where: { email: { endsWith: TEST_EMAIL_SUFFIX } },
  });
};

export const getTestEmailSuffix = (): string => TEST_EMAIL_SUFFIX;

