import { resolveMx } from 'dns/promises';
import logger from '../services/logger.service';

/**
 * Validates whether an email domain has MX records.
 */
export const validateEmailDomain = async (email: string): Promise<boolean> => {
  // Skip validation in test environment
  if (process.env.NODE_ENV === 'test') {
    return true;
  }

  try {

    const domain = email.split('@')[1];

    if (!domain) {
      logger.warn(`[validateEmailDomain] Invalid email format: ${email}`);
      return false;
    }


    const mxRecords = await resolveMx(domain);

    const hasMxRecords = mxRecords.length > 0;

    if (!hasMxRecords) {
      logger.warn(`[validateEmailDomain] No MX records found for domain: ${domain}`);
      return false;
    }

    logger.info(`[validateEmailDomain] Valid domain: ${domain}`);
    return true;
  } catch (error) {
    logger.error(`[validateEmailDomain] Error checking MX records for ${email}:`, error);


    return false;
  }
};

/**
 * Checks if the given email is available for registration.
 */
export const isEmailUnique = async (
  email: string,
  prisma: any
): Promise<boolean> => {
  try {

    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      logger.warn(`[isEmailUnique] Email already exists: ${email}`);
      return false;
    }

    return true;
  } catch (error) {
    logger.error(`[isEmailUnique] Error checking email uniqueness:`, error);
    throw error;
  }
};

