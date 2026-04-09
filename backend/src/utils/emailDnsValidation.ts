import { promises as dns } from 'dns';

/**
 * Validates email domain DNS records.
 * In non-production environments this check is intentionally skipped.
 */
export const validateEmailDomain = async (email: string): Promise<boolean> => {
  try {
    const domain = email.split('@')[1];

    if (!domain) {
      return false;
    }



    if (process.env.NODE_ENV !== 'production') {
      console.log(`[DEV] Skipping DNS validation for: ${email}`);
      return true;
    }


    const mxRecords = await dns.resolveMx(domain);

    return mxRecords && mxRecords.length > 0;
  } catch (error) {

    return false;
  }
};

