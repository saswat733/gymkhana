import { Gym, GymSaasSubscription, Member, SaasInvoice, SaasPlan, Trainer } from '../models/index.js';
import { ApiError } from '../utils/ApiError.js';
import { SAAS_BILLING_CYCLE } from '../models/SaasPlan.js';
import { GYM_SAAS_SUBSCRIPTION_STATUS } from '../models/GymSaasSubscription.js';
import { SAAS_INVOICE_STATUS } from '../models/SaasInvoice.js';

const addDays = (d, days) => {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
};

const addMonths = (d, months) => {
  const x = new Date(d);
  x.setMonth(x.getMonth() + months);
  return x;
};

const computeAmountCents = ({ plan, billingCycle }) => {
  if (billingCycle === SAAS_BILLING_CYCLE.YEARLY) return plan.priceYearlyCents;
  return plan.priceMonthlyCents;
};

const issueNextInvoiceNumber = async ({ gymId }) => {
  const gym = await Gym.findByPk(gymId);
  if (!gym) throw ApiError.notFound('Gym not found');

  const prefix = gym.saasInvoicePrefix || 'GK';
  const seq = Number(gym.saasInvoiceSeq || 1);
  const yyyy = new Date().getFullYear();
  const invoiceNumber = `${prefix}-${yyyy}-${String(seq).padStart(6, '0')}`;

  await gym.update({ saasInvoiceSeq: seq + 1 });
  return invoiceNumber;
};

export const listSaasPlans = async () => {
  const rows = await SaasPlan.findAll({ where: { isActive: true }, order: [['priceMonthlyCents', 'ASC']] });
  return rows;
};

export const getGymSaasSubscription = async ({ gymId }) => {
  if (!gymId) throw ApiError.badRequest('gymId is required');
  const sub = await GymSaasSubscription.findOne({ where: { gymId }, include: [{ model: SaasPlan }] });
  return sub;
};

export const startOrChangeGymSubscription = async ({ gymId, planCode, billingCycle, trialDays = 14 }) => {
  if (!gymId) throw ApiError.badRequest('gymId is required');
  if (!planCode) throw ApiError.badRequest('planCode is required');

  const cycle = billingCycle || SAAS_BILLING_CYCLE.MONTHLY;
  if (![SAAS_BILLING_CYCLE.MONTHLY, SAAS_BILLING_CYCLE.YEARLY].includes(cycle)) {
    throw ApiError.badRequest('Invalid billingCycle');
  }

  const plan = await SaasPlan.findOne({ where: { code: planCode, isActive: true } });
  if (!plan) throw ApiError.notFound('SaaS plan not found');

  const now = new Date();
  const [sub, created] = await GymSaasSubscription.findOrCreate({
    where: { gymId },
    defaults: {
      gymId,
      saasPlanId: plan.id,
      billingCycle: cycle,
      status: GYM_SAAS_SUBSCRIPTION_STATUS.TRIALING,
      startsAt: now,
      trialEndsAt: addDays(now, Number(trialDays) || 14),
      currentPeriodEndsAt: null,
    },
  });

  if (!created) {
    if (sub.status === GYM_SAAS_SUBSCRIPTION_STATUS.CANCELLED) {
      // Reactivate into trial (simplest for now)
      await sub.update({
        saasPlanId: plan.id,
        billingCycle: cycle,
        status: GYM_SAAS_SUBSCRIPTION_STATUS.TRIALING,
        startsAt: now,
        trialEndsAt: addDays(now, Number(trialDays) || 14),
        currentPeriodEndsAt: null,
        cancelledAt: null,
      });
    } else {
      // Plan change applies immediately; invoicing handled separately.
      await sub.update({ saasPlanId: plan.id, billingCycle: cycle });
    }
  }

  return getGymSaasSubscription({ gymId });
};

export const generateSaasInvoiceForCurrentPeriod = async ({ gymId, dueDays = 7, gstPercent = 18 }) => {
  if (!gymId) throw ApiError.badRequest('gymId is required');

  const sub = await GymSaasSubscription.findOne({ where: { gymId }, include: [{ model: SaasPlan }] });
  if (!sub) throw ApiError.notFound('SaaS subscription not found');
  if (!sub.SaasPlan) throw ApiError.badRequest('SaaS plan metadata missing');

  const amountCents = computeAmountCents({ plan: sub.SaasPlan, billingCycle: sub.billingCycle });

  const pct = gstPercent === null ? null : Number(gstPercent);
  const gstCents = pct ? Math.round((amountCents * pct) / 100) : null;
  const totalCents = amountCents + (gstCents || 0);

  const invoiceNumber = await issueNextInvoiceNumber({ gymId });
  const issuedAt = new Date();
  const dueAt = addDays(issuedAt, Number(dueDays) || 7);

  const invoice = await SaasInvoice.create({
    gymId,
    gymSaasSubscriptionId: sub.id,
    invoiceNumber,
    status: SAAS_INVOICE_STATUS.ISSUED,
    currency: sub.SaasPlan.currency || 'INR',
    amountCents,
    gstPercent: pct,
    gstCents,
    totalCents,
    issuedAt,
    dueAt,
  });

  // Update subscription period end (soft rule)
  const periodMonths = sub.billingCycle === SAAS_BILLING_CYCLE.YEARLY ? 12 : 1;
  const nextPeriodEnd = addMonths(issuedAt, periodMonths);
  await sub.update({
    status: GYM_SAAS_SUBSCRIPTION_STATUS.ACTIVE,
    currentPeriodEndsAt: nextPeriodEnd,
    trialEndsAt: null,
  });

  return invoice;
};

export const listSaasInvoicesForGym = async ({ gymId }) => {
  if (!gymId) throw ApiError.badRequest('gymId is required');
  const rows = await SaasInvoice.findAll({
    where: { gymId },
    order: [['issuedAt', 'DESC']],
  });
  return rows;
};

export const markSaasInvoicePaid = async ({ gymId, invoiceId }) => {
  if (!gymId) throw ApiError.badRequest('gymId is required');
  const inv = await SaasInvoice.findByPk(invoiceId);
  if (!inv) throw ApiError.notFound('Invoice not found');
  if (String(inv.gymId) !== String(gymId)) throw ApiError.forbidden();

  if (inv.status === SAAS_INVOICE_STATUS.PAID) return inv;
  await inv.update({ status: SAAS_INVOICE_STATUS.PAID, paidAt: new Date() });
  return inv;
};

export const cancelGymSubscription = async ({ gymId }) => {
  if (!gymId) throw ApiError.badRequest('gymId is required');
  const sub = await GymSaasSubscription.findOne({ where: { gymId } });
  if (!sub) throw ApiError.notFound('SaaS subscription not found');
  await sub.update({ status: GYM_SAAS_SUBSCRIPTION_STATUS.CANCELLED, cancelledAt: new Date() });
  return sub;
};

const isSubscriptionAccessValid = (sub) => {
  if (!sub) return true; // legacy gym without SaaS row — allow until owner starts billing
  const now = new Date();

  if (sub.status === GYM_SAAS_SUBSCRIPTION_STATUS.CANCELLED) return false;

  if (sub.status === GYM_SAAS_SUBSCRIPTION_STATUS.TRIALING) {
    if (!sub.trialEndsAt) return true;
    return new Date(sub.trialEndsAt).getTime() >= now.getTime();
  }

  if (sub.status === GYM_SAAS_SUBSCRIPTION_STATUS.PAST_DUE) {
    const graceEnd = sub.currentPeriodEndsAt
      ? addDays(new Date(sub.currentPeriodEndsAt), 7)
      : addDays(now, 7);
    return graceEnd.getTime() >= now.getTime();
  }

  if (sub.status === GYM_SAAS_SUBSCRIPTION_STATUS.ACTIVE) {
    if (!sub.currentPeriodEndsAt) return true;
    return new Date(sub.currentPeriodEndsAt).getTime() >= now.getTime();
  }

  return false;
};

export const isGymPlatformAccessAllowed = async ({ gymId }) => {
  const sub = await GymSaasSubscription.findOne({ where: { gymId } });
  return isSubscriptionAccessValid(sub);
};

export const assertMemberLimit = async ({ gymId }) => {
  const sub = await GymSaasSubscription.findOne({ where: { gymId }, include: [{ model: SaasPlan }] });
  const limit = sub?.SaasPlan?.limitMembers;
  if (!limit) return;
  const count = await Member.count({ where: { gymId, isActive: true } });
  if (count >= limit) {
    throw ApiError.forbidden(`Member limit reached (${limit}). Upgrade your platform plan.`);
  }
};

export const assertTrainerLimit = async ({ gymId }) => {
  const sub = await GymSaasSubscription.findOne({ where: { gymId }, include: [{ model: SaasPlan }] });
  const limit = sub?.SaasPlan?.limitTrainers;
  if (!limit) return;
  const count = await Trainer.count({ where: { gymId, isActive: true } });
  if (count >= limit) {
    throw ApiError.forbidden(`Trainer limit reached (${limit}). Upgrade your platform plan.`);
  }
};

