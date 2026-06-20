import { sequelize } from '../config/database.js';
import { Member, Payment, Plan, Subscription, User } from '../models/index.js';
import { ApiError } from '../utils/ApiError.js';
import { ROLES } from '../constants/roles.js';
import { PAYMENT_STATUS } from '../models/Payment.js';
import { SUBSCRIPTION_STATUS } from '../models/Subscription.js';
import { buildMeta, getPagination, getSort } from '../utils/pagination.js';

const stableStringify = (obj) => JSON.stringify(obj ?? {});

const addMonthsFromDateOnly = (dateOnlyStr, months) => {
  const [y, m, d] = String(dateOnlyStr).split('-').map((n) => Number(n));
  const dt = new Date(Date.UTC(y, m - 1, d));
  const day = dt.getUTCDate();
  dt.setUTCMonth(dt.getUTCMonth() + months);
  if (dt.getUTCDate() < day) dt.setUTCDate(0);
  const yyyy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(dt.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

export const createPayment = async ({
  gymId,
  idempotencyKey,
  subscriptionId,
  amountCents,
  currency,
  method,
  status = PAYMENT_STATUS.PAID,
  paidAt,
  gatewayRef,
  notes,
  razorpayOrderId,
  razorpayPaymentId,
  skipRenewalExtension = false,
  transaction: externalTransaction,
}) => {
  if (!gymId) throw ApiError.badRequest('gymId is required');
  const clientPaidAt = paidAt ? new Date(paidAt).toISOString() : null;
  const paidAtProvided = Boolean(clientPaidAt);

  const fingerprint = stableStringify({
    subscriptionId,
    amountCents,
    currency,
    method,
    status,
    ...(paidAtProvided ? { paidAt: clientPaidAt } : {}),
    gatewayRef: gatewayRef ?? null,
    notes: notes ?? null,
  });

  const existing = await Payment.findOne({ where: { idempotencyKey } });
  if (existing) {
    if (stableStringify({
      subscriptionId: existing.subscriptionId,
      amountCents: existing.amountCents,
      currency: existing.currency,
      method: existing.method,
      status: existing.status,
      ...(paidAtProvided
        ? { paidAt: existing.paidAt ? new Date(existing.paidAt).toISOString() : null }
        : {}),
      gatewayRef: existing.gatewayRef ?? null,
      notes: existing.notes ?? null,
    }) !== fingerprint) {
      throw ApiError.conflict('Idempotency-Key already used with different payload');
    }
    return existing;
  }

  const run = async (t) => {
    const subscription = await Subscription.findByPk(subscriptionId, {
      include: [{ model: Plan }],
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!subscription) throw ApiError.notFound('Subscription not found');
    if (String(subscription.gymId) !== String(gymId)) throw ApiError.forbidden('Cross-tenant subscription');

    if (subscription.status !== SUBSCRIPTION_STATUS.ACTIVE && !skipRenewalExtension) {
      throw ApiError.badRequest('Cannot record payment for a non-active subscription');
    }

    const payment = await Payment.create(
      {
        gymId,
        subscriptionId,
        amountCents,
        currency,
        method,
        status,
        paidAt: paidAt ? new Date(paidAt) : new Date(),
        gatewayRef: gatewayRef ?? null,
        razorpayOrderId: razorpayOrderId ?? null,
        razorpayPaymentId: razorpayPaymentId ?? null,
        idempotencyKey,
        notes: notes ?? null,
      },
      { transaction: t },
    );

    if (status === PAYMENT_STATUS.PAID && subscription.Plan && !skipRenewalExtension) {
      const newEndsAt = addMonthsFromDateOnly(subscription.endsAt, subscription.Plan.durationMonths);
      await subscription.update({ endsAt: newEndsAt, status: SUBSCRIPTION_STATUS.ACTIVE }, { transaction: t });
    }

    return payment;
  };

  if (externalTransaction) return run(externalTransaction);

  return sequelize.transaction(run);
};

export const getPaymentReceiptContext = async ({ paymentId }) => {
  const payment = await Payment.findByPk(paymentId, {
    include: [
      {
        model: Subscription,
        include: [
          { model: Plan },
          { model: Member, include: [{ model: User }] },
        ],
      },
    ],
  });
  if (!payment) throw ApiError.notFound('Payment not found');
  if (!payment.Subscription) throw ApiError.notFound('Subscription not found');
  if (!payment.Subscription.Member?.User) throw ApiError.notFound('Member user not found');

  const user = payment.Subscription.Member.User;
  return {
    to: user.email,
    memberName: user.name,
    subscriptionId: payment.subscriptionId,
    planName: payment.Subscription.Plan?.name ?? null,
    amountCents: payment.amountCents,
    currency: payment.currency,
    method: payment.method,
    status: payment.status,
    paidAt: payment.paidAt,
    gatewayRef: payment.gatewayRef ?? null,
  };
};

export const listPayments = async (query) => {
  const { page, pageSize, offset, limit } = getPagination(query);
  const order = getSort(query, { allowed: ['paidAt', 'createdAt', 'amountCents'] });

  const where = {};
  if (!query?.gymId) throw ApiError.badRequest('gymId is required');
  where.gymId = query.gymId;
  if (query?.subscriptionId) where.subscriptionId = query.subscriptionId;

  const { rows, count } = await Payment.findAndCountAll({ where, offset, limit, order });
  return { rows, meta: buildMeta({ page, pageSize, total: count }) };
};

export const assertPaymentVisibleToUser = async ({ user, gymId, subscriptionId }) => {
  if (!gymId) throw ApiError.badRequest('gymId is required');
  const sub = await Subscription.findByPk(subscriptionId);
  if (!sub) throw ApiError.notFound('Subscription not found');
  if (String(sub.gymId) !== String(gymId)) throw ApiError.forbidden('Cross-tenant subscription');

  if (user.role === ROLES.ADMIN || user.role === ROLES.TRAINER) return sub;

  const member = await Member.findOne({ where: { userId: user.id, gymId } });
  if (!member) throw ApiError.notFound('Member profile not found');
  if (sub.memberId !== member.id) throw ApiError.forbidden();

  return sub;
};
