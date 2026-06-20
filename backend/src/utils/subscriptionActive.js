import { SUBSCRIPTION_STATUS } from '../models/Subscription.js';

const todayDateOnly = () => {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

/** A subscription counts as active only when status is active and the period has not ended. */
export const isSubscriptionActive = (sub, { asOf = todayDateOnly() } = {}) => {
  if (!sub) return false;
  if (sub.status !== SUBSCRIPTION_STATUS.ACTIVE) return false;
  if (sub.endsAt && String(sub.endsAt) < asOf) return false;
  return true;
};
