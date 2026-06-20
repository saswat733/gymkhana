import { Member, Plan, Subscription, User } from '../models/index.js';
import { SUBSCRIPTION_STATUS } from '../models/Subscription.js';
import { emailService } from './email/email.service.js';
import { sendPushToUsers } from './push.service.js';

const toDateOnly = (d) => {
  const dt = new Date(d);
  const yyyy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(dt.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const addDaysDateOnly = (dateOnlyStr, days) => {
  const [y, m, d] = String(dateOnlyStr).split('-').map((n) => Number(n));
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return toDateOnly(dt);
};

export const sendSubscriptionExpiryReminders = async ({ daysBefore = 3 } = {}) => {
  const today = toDateOnly(new Date());
  const target = addDaysDateOnly(today, Number(daysBefore) || 3);

  const subs = await Subscription.findAll({
    where: { status: SUBSCRIPTION_STATUS.ACTIVE, endsAt: target },
    include: [
      { model: Plan },
      { model: Member, include: [{ model: User }] },
    ],
  });

  let sent = 0;
  for (const sub of subs) {
    const u = sub.Member?.User;
    if (!u?.email) continue;
    await emailService.sendSubscriptionExpiring({
      to: u.email,
      correlationId: `sub-exp-${sub.id}-${target}`,
      memberName: u.name,
      planName: sub.Plan?.name ?? null,
      subscriptionId: sub.id,
      endsAt: sub.endsAt,
      daysLeft: Number(daysBefore) || 3,
    });
    await sendPushToUsers({
      userIds: [u.id],
      title: 'Subscription expiring soon',
      body: `Your ${sub.Plan?.name ?? 'plan'} expires in ${Number(daysBefore) || 3} days.`,
      data: { type: 'subscription_expiring', subscriptionId: sub.id },
    });
    sent += 1;
  }

  return { sent, targetDate: target };
};

