import { sequelize } from '../config/database.js';
import {
  Member,
  Payment,
  PaymentIntent,
  Plan,
  Subscription,
} from '../models/index.js';
import { ApiError } from '../utils/ApiError.js';
import { ROLES } from '../constants/roles.js';
import { PAYMENT_INTENT_STATUS } from '../models/PaymentIntent.js';
import { PAYMENT_STATUS } from '../models/Payment.js';
import { SUBSCRIPTION_STATUS } from '../models/Subscription.js';
import { findActiveSubscription } from '../utils/membershipAccess.js';
import * as paymentService from './payment.service.js';
import * as subscriptionService from './subscription.service.js';
import * as memberInvoiceService from './memberInvoice.service.js';
import { verifyCheckoutSignature } from '../utils/razorpay.util.js';
import Razorpay from 'razorpay';
import { env } from '../config/env.js';

const RENEWAL_WINDOW_DAYS = 14;

const daysUntilEnd = (endsAt) => {
  const [y, m, d] = String(endsAt).split('-').map((n) => Number(n));
  const endUtc = Date.UTC(y, m - 1, d);
  const now = new Date();
  const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Math.round((endUtc - todayUtc) / 86400000);
};

const getRazorpayClient = () => {
  if (!env.razorpay.keyId || !env.razorpay.keySecret) {
    throw ApiError.badRequest('Razorpay is not configured');
  }
  return new Razorpay({ key_id: env.razorpay.keyId, key_secret: env.razorpay.keySecret });
};

export const createMemberOrder = async ({ user, gymId, planId }) => {
  if (user.role !== ROLES.MEMBER) throw ApiError.forbidden('Only members can purchase plans');

  const member = await Member.findOne({ where: { userId: user.id, gymId } });
  if (!member) throw ApiError.notFound('Member profile not found');

  const plan = await Plan.findByPk(planId);
  if (!plan || !plan.isActive) throw ApiError.notFound('Plan not found or inactive');
  if (String(plan.gymId) !== String(gymId)) throw ApiError.forbidden('Cross-tenant plan');
  if (plan.isTrial) throw ApiError.badRequest('Trial plans do not require payment. Subscribe from Plans.');
  if (!plan.priceCents || plan.priceCents <= 0) {
    throw ApiError.badRequest('This plan has no online price. Contact reception.');
  }

  const active = await findActiveSubscription({ gymId, memberId: member.id });
  let subscriptionId = null;

  if (active) {
    const daysLeft = daysUntilEnd(active.endsAt);
    if (daysLeft > RENEWAL_WINDOW_DAYS) {
      throw ApiError.conflict('You already have an active membership. Renewal opens closer to expiry.');
    }
    subscriptionId = active.id;
  }

  const rz = getRazorpayClient();
  const receipt = `mbr_${member.id.slice(0, 8)}_${Date.now()}`;
  const order = await rz.orders.create({
    amount: plan.priceCents,
    currency: 'INR',
    receipt,
    notes: {
      type: 'member_subscription',
      gymId,
      memberId: member.id,
      planId: plan.id,
      subscriptionId: subscriptionId ?? '',
    },
  });

  const intent = await PaymentIntent.create({
    gymId,
    memberId: member.id,
    planId: plan.id,
    subscriptionId,
    amountCents: plan.priceCents,
    currency: 'INR',
    razorpayOrderId: order.id,
    status: PAYMENT_INTENT_STATUS.CREATED,
  });

  return {
    intentId: intent.id,
    razorpay: {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: env.razorpay.keyId,
    },
    plan: { id: plan.id, name: plan.name, durationMonths: plan.durationMonths },
  };
};

export const fulfillMemberOrder = async ({ orderId, paymentId }) => {
  const intent = await PaymentIntent.findOne({ where: { razorpayOrderId: orderId } });
  if (!intent) return null;
  if (intent.status === PAYMENT_INTENT_STATUS.CAPTURED) {
    const existing = await Payment.findOne({ where: { razorpayPaymentId: paymentId } });
    return { intent, payment: existing, alreadyFulfilled: true };
  }

  const existingPayment = await Payment.findOne({ where: { razorpayPaymentId: paymentId } });
  if (existingPayment) {
    await intent.update({ status: PAYMENT_INTENT_STATUS.CAPTURED });
    return { intent, payment: existingPayment, alreadyFulfilled: true };
  }

  const plan = await Plan.findByPk(intent.planId);
  if (!plan) throw ApiError.notFound('Plan not found for payment intent');

  return sequelize.transaction(async (t) => {
    const lockedIntent = await PaymentIntent.findByPk(intent.id, {
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (lockedIntent.status === PAYMENT_INTENT_STATUS.CAPTURED) {
      const pay = await Payment.findOne({ where: { razorpayPaymentId: paymentId }, transaction: t });
      return { intent: lockedIntent, payment: pay, alreadyFulfilled: true };
    }

    let subscriptionId = lockedIntent.subscriptionId;
    let skipRenewalExtension = false;

    if (!subscriptionId) {
      const sub = await subscriptionService.createSubscription({
        gymId: lockedIntent.gymId,
        memberId: lockedIntent.memberId,
        planId: lockedIntent.planId,
        transaction: t,
      });
      subscriptionId = sub.id;
      skipRenewalExtension = true;
      await lockedIntent.update({ subscriptionId }, { transaction: t });
    } else {
      const sub = await Subscription.findByPk(subscriptionId, { transaction: t, lock: t.LOCK.UPDATE });
      if (!sub) throw ApiError.notFound('Subscription not found for renewal');
      if (sub.status === SUBSCRIPTION_STATUS.CANCELLED) {
        throw ApiError.badRequest('Cannot renew a cancelled subscription');
      }
      if (sub.status === SUBSCRIPTION_STATUS.EXPIRED) {
        await sub.update({ status: SUBSCRIPTION_STATUS.ACTIVE }, { transaction: t });
      }
    }

    const payment = await paymentService.createPayment({
      gymId: lockedIntent.gymId,
      idempotencyKey: `rzp_${paymentId}`,
      subscriptionId,
      amountCents: lockedIntent.amountCents,
      currency: lockedIntent.currency,
      method: 'razorpay',
      status: PAYMENT_STATUS.PAID,
      gatewayRef: paymentId,
      notes: `Razorpay order ${orderId}`,
      razorpayOrderId: orderId,
      razorpayPaymentId: paymentId,
      skipRenewalExtension,
      transaction: t,
    });

    await lockedIntent.update({ status: PAYMENT_INTENT_STATUS.CAPTURED }, { transaction: t });

    return { intent: lockedIntent, payment, subscriptionId, alreadyFulfilled: false };
  });
};

export const verifyAndFulfillMemberPayment = async ({
  user,
  gymId,
  orderId,
  paymentId,
  signature,
}) => {
  if (!verifyCheckoutSignature({ orderId, paymentId, signature })) {
    throw ApiError.badRequest('Invalid payment signature');
  }

  const intent = await PaymentIntent.findOne({ where: { razorpayOrderId: orderId } });
  if (!intent) throw ApiError.notFound('Payment order not found');
  if (String(intent.gymId) !== String(gymId)) throw ApiError.forbidden();

  if (user.role === ROLES.MEMBER) {
    const member = await Member.findOne({ where: { userId: user.id, gymId } });
    if (!member || member.id !== intent.memberId) throw ApiError.forbidden();
  }

  const result = await fulfillMemberOrder({ orderId, paymentId });
  return result;
};

export const getMemberOrderStatus = async ({ user, gymId, orderId }) => {
  const intent = await PaymentIntent.findOne({ where: { razorpayOrderId: orderId } });
  if (!intent) throw ApiError.notFound('Order not found');
  if (String(intent.gymId) !== String(gymId)) throw ApiError.forbidden();

  if (user.role === ROLES.MEMBER) {
    const member = await Member.findOne({ where: { userId: user.id, gymId } });
    if (!member || member.id !== intent.memberId) throw ApiError.forbidden();
  }

  let payment = null;
  if (intent.status === PAYMENT_INTENT_STATUS.CAPTURED) {
    payment = await Payment.findOne({ where: { razorpayOrderId: orderId } });
  }

  return {
    status: intent.status,
    subscriptionId: intent.subscriptionId,
    paymentId: payment?.id ?? null,
  };
};

export const finalizeMemberPaymentSideEffects = async ({ paymentId, gymId, gstPercent }) => {
  let invoice = null;
  try {
    invoice = await memberInvoiceService.createInvoiceForPayment({ paymentId, gymId, gstPercent });
  } catch {
    // logged by caller
  }
  return invoice;
};
