import { resolveMx } from 'dns/promises';
import logger from '../services/logger.service';

/**
 * Проверя дали домейнът на имейла има валидни MX records
 * @param email - имейл адрес за проверка
 * @returns true ако домейнът е валиден, false иначе
 */
export const validateEmailDomain = async (email: string): Promise<boolean> => {
  try {
    // Извличаме домейна от имейла
    const domain = email.split('@')[1];

    if (!domain) {
      logger.warn(`[validateEmailDomain] Invalid email format: ${email}`);
      return false;
    }

    // Проверяваме MX records за домейна
    const mxRecords = await resolveMx(domain);

    // D?D?D_ D,D?D? D_?,D3D_D?D_?? ?? MX records, D'D_D?D?D1D??S?, D? D?D?D?D,D'D?D?
    const hasMxRecords = mxRecords.length > 0;

    if (!hasMxRecords) {
      logger.warn(`[validateEmailDomain] No MX records found for domain: ${domain}`);
      return false;
    }

    logger.info(`[validateEmailDomain] Valid domain: ${domain}`);
    return true;
  } catch (error) {
    logger.error(`[validateEmailDomain] Error checking MX records for ${email}:`, error);
    // На случай на грешка, не блокираме регистрацията но логваме
    // В production може да върнеш false за по-строга проверка
    return false;
  }
};

/**
 * Проверява дали имейлът е вече използван в системата
 * @param email - имейл адрес
 * @param prisma - Prisma client
 * @returns true ако имейлът е свободен, false ако е използван
 */
export const isEmailUnique = async (
  email: string,
  prisma: any
): Promise<boolean> => {
  try {
    // Проверяваме в User таблица
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
