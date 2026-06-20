import { Op } from 'sequelize';
import { Member, Plan, Subscription } from '../models/index.js';
import { ApiError } from '../utils/ApiError.js';
import { ROLES } from '../constants/roles.js';
import { buildMeta, getPagination, getSort } from '../utils/pagination.js';
import { SUBSCRIPTION_STATUS } from '../models/Subscription.js';
import { findActiveSubscription } from '../utils/membershipAccess.js';
import { isProd, env } from '../config/env.js';

const toDateOnly = (d) => {
  const dt = new Date(d);
  const yyyy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  const dd = String(dt.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const addMonths = (date, months) => {
  const d = new Date(date);
  const day = d.getDate();
  d.setMonth(d.getMonth() + months);
  if (d.getDate() < day) d.setDate(0);
  return d;
};

export const createSubscription = async ({ gymId, memberId, planId, startsAt, autoRenew, transaction }) => {
  if (!gymId) throw ApiError.badRequest('gymId is required');
  const member = await Member.findByPk(memberId);
  if (!member) throw ApiError.notFound('Member not found');
  if (String(member.gymId) !== String(gymId)) throw ApiError.forbidden('Cross-tenant member');

  const plan = await Plan.findByPk(planId);
  if (!plan || !plan.isActive) throw ApiError.notFound('Plan not found or inactive');
  if (String(plan.gymId) !== String(gymId)) throw ApiError.forbidden('Cross-tenant plan');

  const start = startsAt ? new Date(startsAt) : new Date();
  const end = addMonths(start, plan.durationMonths);

  const subscription = await Subscription.create({
    gymId,
    memberId,
    planId,
    startsAt: toDateOnly(start),
    endsAt: toDateOnly(end),
    status: SUBSCRIPTION_STATUS.ACTIVE,
    autoRenew: autoRenew ?? false,
  }, transaction ? { transaction } : undefined);

  return subscription;
};

export const createSubscriptionForSelf = async ({ user, gymId, planId, autoRenew }) => {
  if (user.role !== ROLES.MEMBER) throw ApiError.forbidden('Only members can buy subscriptions');

  const member = await Member.findOne({ where: { userId: user.id, gymId } });
  if (!member) throw ApiError.notFound('Member profile not found');

  const existingActive = await findActiveSubscription({ gymId, memberId: member.id });
  if (existingActive) throw ApiError.conflict('You already have an active subscription');

  const plan = await Plan.findByPk(planId);
  if (plan?.isTrial) {
    return createTrialSubscription({ gymId, memberId: member.id, planId });
  }

  const allowFreeSelfSubscribe = env.features.allowFreeSelfSubscribe;
  if (isProd && plan && !plan.isTrial && plan.priceCents > 0 && !allowFreeSelfSubscribe) {
    throw ApiError.badRequest('Paid plans require online payment. Tap Pay on the plan in the app.');
  }

  return createSubscription({ gymId, memberId: member.id, planId, autoRenew });
};

export const createTrialSubscription = async ({ gymId, memberId, planId, startsAt }) => {
  const plan = await Plan.findByPk(planId);
  if (!plan || !plan.isActive || !plan.isTrial) {
    throw ApiError.badRequest('Trial plan not found');
  }
  if (String(plan.gymId) !== String(gymId)) throw ApiError.forbidden('Cross-tenant plan');

  const existing = await findActiveSubscription({ gymId, memberId });
  if (existing) throw ApiError.conflict('Member already has an active or trial subscription');

  const start = startsAt ? new Date(startsAt) : new Date();
  const trialDays = plan.trialDays ?? 7;
  const end = new Date(start);
  end.setDate(end.getDate() + trialDays);

  return Subscription.create({
    gymId,
    memberId,
    planId,
    startsAt: toDateOnly(start),
    endsAt: toDateOnly(end),
    status: SUBSCRIPTION_STATUS.ACTIVE,
    isTrial: true,
    trialVisitsLimit: plan.trialVisitsLimit ?? null,
    trialVisitsUsed: 0,
    autoRenew: false,
  });
};

export const listSubscriptionsForRequester = async ({ user, gymId, query }) => {
  const scopedQuery = { ...query };
  scopedQuery.gymId = gymId;

  if (user.role === ROLES.MEMBER) {
    const member = await Member.findOne({ where: { userId: user.id, gymId } });
    if (!member) throw ApiError.notFound('Member profile not found');
    scopedQuery.memberId = member.id;
  }

  return listSubscriptions(scopedQuery);
};

export const listSubscriptions = async (query) => {
  const { page, pageSize, offset, limit } = getPagination(query);
  const order = getSort(query, { allowed: ['createdAt', 'endsAt', 'status'] });

  const where = {};
  if (query?.gymId) where.gymId = query.gymId;
  if (query?.memberId) where.memberId = query.memberId;
  if (query?.status) where.status = query.status;
  if (query?.q) {
    const q = String(query.q).trim();
    where[Op.or] = [
      { id: { [Op.like]: `%${q}%` } },
      { memberId: { [Op.like]: `%${q}%` } },
      { planId: { [Op.like]: `%${q}%` } },
    ];
  }

  const { rows, count } = await Subscription.findAndCountAll({ where, offset, limit, order });
  return { rows, meta: buildMeta({ page, pageSize, total: count }) };
};

export const cancelSubscription = async ({ gymId, id }) => {
  if (!gymId) throw ApiError.badRequest('gymId is required');
  const sub = await Subscription.findByPk(id);
  if (!sub) throw ApiError.notFound('Subscription not found');
  if (String(sub.gymId) !== String(gymId)) throw ApiError.forbidden();
  if (sub.status === SUBSCRIPTION_STATUS.CANCELLED) return sub;
  await sub.update({ status: SUBSCRIPTION_STATUS.CANCELLED, cancelledAt: new Date() });
  return sub;
};

export const renewSubscription = async ({ gymId, id }) => {
  if (!gymId) throw ApiError.badRequest('gymId is required');
  const sub = await Subscription.findByPk(id, { include: [{ model: Plan }] });
  if (!sub) throw ApiError.notFound('Subscription not found');
  if (String(sub.gymId) !== String(gymId)) throw ApiError.forbidden();
  if (!sub.Plan) throw ApiError.badRequest('Subscription is missing plan metadata');

  if (sub.status === SUBSCRIPTION_STATUS.CANCELLED) {
    throw ApiError.badRequest('Cannot renew a cancelled subscription');
  }

  const newEndsAt = addMonths(new Date(sub.endsAt), sub.Plan.durationMonths);
  await sub.update({
    endsAt: toDateOnly(newEndsAt),
    status: SUBSCRIPTION_STATUS.ACTIVE,
  });
  return sub;
};

export const expireDueSubscriptions = async () => {
  const today = toDateOnly(new Date());
  const [updated] = await Subscription.update(
    { status: SUBSCRIPTION_STATUS.EXPIRED },
    {
      where: {
        status: SUBSCRIPTION_STATUS.ACTIVE,
        endsAt: { [Op.lt]: today },
      },
    },
  );
  return { updatedRows: updated };
};

