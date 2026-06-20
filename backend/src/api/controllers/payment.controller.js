import * as paymentService from '../../services/payment.service.js';
import * as memberInvoiceService from '../../services/memberInvoice.service.js';
import { emailService } from '../../services/email/email.service.js';
import { logger } from '../../config/logger.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendCreated, sendSuccess } from '../../utils/ApiResponse.js';

export const createPaymentHandler = asyncHandler(async (req, res) => {
  await paymentService.assertPaymentVisibleToUser({
    user: req.user,
    gymId: req.gymId,
    subscriptionId: req.body.subscriptionId,
  });

  const payment = await paymentService.createPayment({
    idempotencyKey: req.idempotencyKey,
    gymId: req.gymId,
    ...req.body,
  });

  // Non-blocking side effect: best-effort receipt email (console provider in dev).
  try {
    const ctx = await paymentService.getPaymentReceiptContext({ paymentId: payment.id });
    const { to, ...rest } = ctx;
    await emailService.sendPaymentReceipt({
      to,
      correlationId: req.idempotencyKey ?? payment.id,
      ...rest,
    });
  } catch (err) {
    logger.warn('Failed to send payment receipt email', {
      err: err?.message ?? String(err),
      paymentId: payment.id,
    });
  }

  let invoice = null;
  try {
    invoice = await memberInvoiceService.createInvoiceForPayment({
      paymentId: payment.id,
      gymId: req.gymId,
      gstPercent: req.body.gstPercent,
    });
  } catch (err) {
    logger.warn('Failed to create GST invoice', { err: err?.message ?? String(err), paymentId: payment.id });
  }

  return sendCreated(res, { message: 'Payment recorded', data: { payment, invoice } });
});

export const listPaymentsHandler = asyncHandler(async (req, res) => {
  await paymentService.assertPaymentVisibleToUser({
    user: req.user,
    gymId: req.gymId,
    subscriptionId: req.query.subscriptionId,
  });

  const result = await paymentService.listPayments({ ...req.query, gymId: req.gymId });
  return sendSuccess(res, { data: { payments: result.rows }, meta: result.meta });
});
