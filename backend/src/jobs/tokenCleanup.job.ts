import cron from 'node-cron';
import { cleanupExpiredTokens } from '../utils/tokenUtils';
import logger from '../services/logger.service';

/**
 * Schedules daily cleanup for expired auth artifacts:
 * refresh tokens, blacklisted access tokens, password reset codes,
 * and email verification codes.
 */
export const startTokenCleanupJob = (): void => {
  cron.schedule(
    '0 3 * * *',
    async () => {
      try {
        logger.info('Starting token cleanup job...');

        const result = await cleanupExpiredTokens();

        logger.info('Token cleanup completed', {
          refreshTokensDeleted: result.refreshTokens,
          blacklistedTokensDeleted: result.blacklistedTokens,
          passwordResetsDeleted: result.passwordResets,
          emailVerificationCodesDeleted: result.emailVerificationCodes,
          totalDeleted:
            result.refreshTokens +
            result.blacklistedTokens +
            result.passwordResets +
            result.emailVerificationCodes,
        });
      } catch (error) {
        // Cleanup errors are logged but must not fail the server process.
        logger.error('Token cleanup job failed', error);
      }
    },
    {
      timezone: 'Europe/Sofia',
    },
  );

  logger.info('Token cleanup job scheduled (daily at 03:00 Europe/Sofia)');
};

/**
 * Manual cleanup entry point used by administrative operations and tests.
 */
export const runTokenCleanupNow = async () => {
  try {
    logger.info('Running manual token cleanup...');
    const result = await cleanupExpiredTokens();
    logger.info('Manual token cleanup completed', result);
    return result;
  } catch (error) {
    logger.error('Manual token cleanup failed', error);
    throw error;
  }
};
