import { Op } from 'sequelize';
import { SubscriptionFreeze, Subscription } from '../models/index.js';
import { SUBSCRIPTION_STATUS } from '../models/Subscription.js';
import { FREEZE_STATUS } from '../models/SubscriptionFreeze.js';

const todayDateOnly = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

export const isSubscriptionFrozen = async ({ gymId, subscriptionId, memberId, asOf = todayDateOnly() }) => {
  const freeze = await SubscriptionFreeze.findOne({
    where: {
      gymId,
      subscriptionId,
      memberId,
      status: FREEZE_STATUS.ACTIVE,
      startsAt: { [Op.lte]: asOf },
      endsAt: { [Op.gte]: asOf },
    },
  });
  return Boolean(freeze);
};

export const isSubscriptionActive = async (sub, { asOf = todayDateOnly(), gymId } = {}) => {
  if (!sub) return false;
  if (sub.status !== SUBSCRIPTION_STATUS.ACTIVE) return false;
  if (sub.endsAt && String(sub.endsAt) < asOf) return false;

  const gid = gymId ?? sub.gymId;
  if (gid && sub.id && sub.memberId) {
    const frozen = await isSubscriptionFrozen({
      gymId: gid,
      subscriptionId: sub.id,
      memberId: sub.memberId,
      asOf,
    });
    if (frozen) return false;
  }

  if (sub.isTrial && sub.trialVisitsLimit != null && sub.trialVisitsUsed >= sub.trialVisitsLimit) {
    return false;
  }

  return true;
};

export const findActiveSubscription = async ({ gymId, memberId }) => {
  const subs = await Subscription.findAll({
    where: { gymId, memberId, status: SUBSCRIPTION_STATUS.ACTIVE },
    order: [['endsAt', 'DESC']],
    limit: 5,
  });
  for (const s of subs) {
    if (await isSubscriptionActive(s, { gymId })) return s;
  }
  return null;
};
