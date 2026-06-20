import cron from 'node-cron';
import { logger } from '../config/logger.js';
import { expireDueSubscriptions } from '../services/subscription.service.js';
import { sendSubscriptionExpiryReminders } from '../services/reminders.service.js';

let subscriptionExpiryTask = null;
let subscriptionReminderTask = null;

export const startJobs = () => {
  // Daily at 00:30 server local time
  subscriptionExpiryTask = cron.schedule('30 0 * * *', async () => {
    try {
      const result = await expireDueSubscriptions();
      logger.info('Subscription expiry job completed', result);
    } catch (err) {
      logger.error('Subscription expiry job failed', { message: err.message });
    }
  });

  // Daily at 09:00 server local time
  subscriptionReminderTask = cron.schedule('0 9 * * *', async () => {
    try {
      const result = await sendSubscriptionExpiryReminders({ daysBefore: 3 });
      logger.info('Subscription reminder job completed', result);
    } catch (err) {
      logger.error('Subscription reminder job failed', { message: err.message });
    }
  });

  // Run once shortly after boot (helps dev machines without waiting for cron)
  setTimeout(async () => {
    try {
      const result = await expireDueSubscriptions();
      logger.info('Subscription expiry job (startup) completed', result);
    } catch (err) {
      logger.error('Subscription expiry job (startup) failed', { message: err.message });
    }
  }, 5_000).unref();

  setTimeout(async () => {
    try {
      const result = await sendSubscriptionExpiryReminders({ daysBefore: 3 });
      logger.info('Subscription reminder job (startup) completed', result);
    } catch (err) {
      logger.error('Subscription reminder job (startup) failed', { message: err.message });
    }
  }, 8_000).unref();
};

export const stopJobs = () => {
  subscriptionExpiryTask?.stop();
  subscriptionExpiryTask = null;
  subscriptionReminderTask?.stop();
  subscriptionReminderTask = null;
};
