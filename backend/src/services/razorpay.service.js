import Razorpay from 'razorpay';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import { SaasInvoice } from '../models/index.js';
import * as saasBillingService from './saasBilling.service.js';
import * as memberPaymentService from './memberPayment.service.js';

let client = null;

const getClient = () => {
  if (!env.razorpay.keyId || !env.razorpay.keySecret) {
    throw ApiError.badRequest('Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.');
  }
  client ??= new Razorpay({ key_id: env.razorpay.keyId, key_secret: env.razorpay.keySecret });
  return client;
};

export const createSaasInvoiceOrder = async ({ gymId, invoiceId }) => {
  const inv = await SaasInvoice.findByPk(invoiceId);
  if (!inv) throw ApiError.notFound('Invoice not found');
  if (String(inv.gymId) !== String(gymId)) throw ApiError.forbidden();
  if (inv.status === 'paid') throw ApiError.badRequest('Invoice already paid');

  const rz = getClient();
  const order = await rz.orders.create({
    amount: inv.totalCents,
    currency: inv.currency || 'INR',
    receipt: inv.invoiceNumber,
    notes: { gymId, invoiceId: inv.id, type: 'saas_invoice' },
  });

  await inv.update({ razorpayOrderId: order.id });
  return { orderId: order.id, amount: order.amount, currency: order.currency, keyId: env.razorpay.keyId };
};

export const handlePaymentCaptured = async ({ orderId, paymentId }) => {
  const inv = await SaasInvoice.findOne({ where: { razorpayOrderId: orderId } });
  if (inv) {
    if (inv.status === 'paid') return { type: 'saas_invoice', invoice: inv };
    await saasBillingService.markSaasInvoicePaid({ gymId: inv.gymId, invoiceId: inv.id });
    await inv.update({ notes: `razorpay:${paymentId}` });
    return { type: 'saas_invoice', invoice: inv };
  }

  const memberResult = await memberPaymentService.fulfillMemberOrder({ orderId, paymentId });
  if (memberResult) return { type: 'member_subscription', ...memberResult };

  return null;
};

export { verifyWebhookSignature, verifyCheckoutSignature } from '../utils/razorpay.util.js';
