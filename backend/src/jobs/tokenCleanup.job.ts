/**
 * ============================================
 * TOKEN CLEANUP CRON JOB
 * ============================================
 *
 * КАК РАБОТИ CRON JOB:
 *
 * Cron job е автоматична задача която се изпълнява периодично на зададен интервал.
 * Подобен на Windows Task Scheduler или Linux crontab.
 *
 * ЗАЩО Е НУЖЕН CLEANUP:
 *
 * С времето в DB се натрупват записи които вече не са нужни:
 * 1. Refresh tokens - след като изтекат (30 дни), не могат да се използват
 * 2. Blacklisted tokens - след като изтекат (15 min), естествено не работят
 * 3. Password reset codes - след като се използват или изтекат (15 min)
 *
 * Тези записи заемат място и забавят queries. Трябва редовно да ги изтриваме.
 *
 * КАКВО ПРАВИ ТОЗИ JOB:
 * 1. Стартира автоматично всеки ден в 03:00 (нощно време - малко активност)
 * 2. Вика cleanupExpiredTokens() функция от tokenUtils
 * 3. Изтрива всички изтекли записи
 * 4. Логва резултата (колко записа са изтрити)
 *
 * АЛТЕРНАТИВИ:
 * - Можем да викаме cleanup на всеки N requests (проблем: непредсказуемо)
 * - Можем да викаме manual с API endpoint (проблем: трябва да се помни)
 * - Cron job е най-добрият вариант за production
 *
 * ИЗПОЛЗВАМЕ NODE-CRON БИБЛИОТЕКА:
 * npm install node-cron
 * npm install --save-dev @types/node-cron
 */

import cron from 'node-cron';
import { cleanupExpiredTokens } from '../utils/tokenUtils';
import logger from '../services/logger.service';

/**
 * CRON EXPRESSION ОБЯСНЕНИЕ:
 *
 * Форматът е: минута час ден месец ден-от-седмицата
 * Например '0 3 * * *' означава всеки ден в 03:00
 */

/**
 * Стартира cleanup job
 *
 * Това е main функция която се вика от server.ts при стартиране
 */
export const startTokenCleanupJob = (): void => {
  // Създаваме cron task
  // schedule(expression, callback) - задава кога и какво да се изпълни
  cron.schedule(
    '0 3 * * *', // Всеки ден в 03:00 AM
    async () => {
      try {
        logger.info('🧹 Starting token cleanup job...');

        // Викаме cleanup функцията
        const result = await cleanupExpiredTokens();

        // Логваме резултата
        logger.info('Token cleanup completed:', {
          refreshTokensDeleted: result.refreshTokens,
          blacklistedTokensDeleted: result.blacklistedTokens,
          passwordResetsDeleted: result.passwordResets,
          totalDeleted:
            result.refreshTokens +
            result.blacklistedTokens +
            result.passwordResets,
        });
      } catch (error) {
        // Ако cleanup fail-не, логваме error но НЕ crashваме приложението
        logger.error('Token cleanup job failed:', error);
      }
    },
    {
      // Опции за cron job
      timezone: 'Europe/Sofia', // Bulgarian timezone
    }
  );

  logger.info('Token cleanup job scheduled (daily at 3:00 AM)');
};

/**
 * MANUAL CLEANUP ФУНКЦИЯ
 *
 * За testing или за emergency cleanup можем да викаме тази функция manual.
 * Например от admin endpoint: POST /api/admin/cleanup
 */
export const runTokenCleanupNow = async () => {
  try {
    logger.info('🧹 Running manual token cleanup...');
    const result = await cleanupExpiredTokens();
    logger.info('✅ Manual cleanup completed:', result);
    return result;
  } catch (error) {
    logger.error('❌ Manual cleanup failed:', error);
    throw error;
  }
};

/**
 * КАК ДА ИЗПОЛЗВАМЕ В server.ts:
 *
 * import { startTokenCleanupJob } from './jobs/tokenCleanup.job';
 *
 * // След като сървърът стартира
 * app.listen(PORT, () => {
 *   console.log(`Server running on port ${PORT}`);
 *   startTokenCleanupJob(); // Стартираме cron job
 * });
 */
