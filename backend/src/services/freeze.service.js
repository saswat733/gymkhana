import { Op } from 'sequelize';
import { sequelize } from '../config/database.js';
import { Member, Subscription, SubscriptionFreeze } from '../models/index.js';
import { SUBSCRIPTION_STATUS } from '../models/Subscription.js';
import { FREEZE_STATUS } from '../models/SubscriptionFreeze.js';
import { ApiError } from '../utils/ApiError.js';

const dayDiff = (start, end) => {
  const a = new Date(start);
  const b = new Date(end);
  return Math.max(0, Math.round((b - a) / 86400000) + 1);
};

const addDays = (dateStr, days) => {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

export const freezeSubscription = async ({ gymId, subscriptionId, startsAt, endsAt, reason, createdByUserId }) => {
  const sub = await Subscription.findByPk(subscriptionId);
  if (!sub || String(sub.gymId) !== String(gymId)) throw ApiError.notFound('Subscription not found');
  if (sub.status !== SUBSCRIPTION_STATUS.ACTIVE) throw ApiError.badRequest('Only active subscriptions can be frozen');

  const overlap = await SubscriptionFreeze.findOne({
    where: {
      gymId,
      subscriptionId,
      status: FREEZE_STATUS.ACTIVE,
      [Op.or]: [{ startsAt: { [Op.between]: [startsAt, endsAt] } }, { endsAt: { [Op.between]: [startsAt, endsAt] } }],
    },
  });
  if (overlap) throw ApiError.conflict('Subscription already frozen for overlapping dates');

  const days = dayDiff(startsAt, endsAt);
  return SubscriptionFreeze.create({
    gymId,
    subscriptionId,
    memberId: sub.memberId,
    startsAt,
    endsAt,
    reason: reason ?? null,
    status: FREEZE_STATUS.ACTIVE,
    daysFrozen: days,
    createdByUserId: createdByUserId ?? null,
  });
};

export const completeDueFreezes = async () => {
  const today = new Date().toISOString().slice(0, 10);
  const due = await SubscriptionFreeze.findAll({
    where: { status: FREEZE_STATUS.ACTIVE, endsAt: { [Op.lt]: today } },
  });

  let updated = 0;
  for (const f of due) {
    await sequelize.transaction(async (t) => {
      const sub = await Subscription.findByPk(f.subscriptionId, { transaction: t });
      if (sub && sub.status === SUBSCRIPTION_STATUS.ACTIVE) {
        await sub.update({ endsAt: addDays(sub.endsAt, f.daysFrozen) }, { transaction: t });
      }
      await f.update({ status: FREEZE_STATUS.COMPLETED }, { transaction: t });
      updated += 1;
    });
  }
  return { updated };
};

export const cancelFreeze = async ({ gymId, freezeId }) => {
  const freeze = await SubscriptionFreeze.findByPk(freezeId);
  if (!freeze || String(freeze.gymId) !== String(gymId)) throw ApiError.notFound('Freeze not found');
  if (freeze.status !== FREEZE_STATUS.ACTIVE) throw ApiError.badRequest('Freeze is not active');
  await freeze.update({ status: FREEZE_STATUS.CANCELLED });
  return freeze;
};

export const listFreezes = async ({ gymId, memberId }) => {
  const where = { gymId };
  if (memberId) where.memberId = memberId;
  return SubscriptionFreeze.findAll({ where, order: [['createdAt', 'DESC']] });
};
