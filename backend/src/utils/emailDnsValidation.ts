import { promises as dns } from 'dns';

/**
 * Проверява дали email domain съществува
 * @param email - email адрес
 * @returns true ако domain-ът съществува, false ако не
 *
 * DEVELOPMENT MODE:
 * В development mode (NODE_ENV !== 'production') пропускаме DNS проверката
 * за да можем да използваме test email адреси като test@example.com
 */
export const validateEmailDomain = async (email: string): Promise<boolean> => {
  try {
    const domain = email.split('@')[1];

    if (!domain) {
      return false;
    }

    // 🆕 В development mode пропускаме DNS проверката
    // Това позволява използването на test email адреси
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[DEV] Skipping DNS validation for: ${email}`);
      return true; // Винаги приемаме в development
    }

    // Проверка за MX records (mail exchange) само в production
    const mxRecords = await dns.resolveMx(domain);

    return mxRecords && mxRecords.length > 0;
  } catch (error) {
    // Ако DNS проверката фейлне, domain-ът не съществува
    return false;
  }
};