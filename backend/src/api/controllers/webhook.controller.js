import * as razorpayService from '../../services/razorpay.service.js';
import * as memberPaymentService from '../../services/memberPayment.service.js';
import * as paymentService from '../../services/payment.service.js';
import { emailService } from '../../services/email/email.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/ApiResponse.js';
import { logger } from '../../config/logger.js';

const runMemberPaymentSideEffects = async ({ result, gymId }) => {
  if (!result?.payment || result.alreadyFulfilled) return;
  try {
    const ctx = await paymentService.getPaymentReceiptContext({ paymentId: result.payment.id });
    const { to, ...rest } = ctx;
    await emailService.sendPaymentReceipt({ to, correlationId: result.payment.id, ...rest });
  } catch (err) {
    logger.warn('Webhook: member payment receipt email failed', { err: err?.message });
  }
  try {
    await memberPaymentService.finalizeMemberPaymentSideEffects({
      paymentId: result.payment.id,
      gymId,
    });
  } catch (err) {
    logger.warn('Webhook: member GST invoice failed', { err: err?.message });
  }
};

export const razorpayWebhookHandler = asyncHandler(async (req, res) => {
  const signature = req.headers['x-razorpay-signature'];
  const rawBody = req.rawBody ?? JSON.stringify(req.body);

  if (!razorpayService.verifyWebhookSignature({ body: rawBody, signature })) {
    logger.warn('Razorpay webhook signature mismatch');
    return res.status(400).json({ success: false, message: 'Invalid signature' });
  }

  const event = req.body?.event;
  const payload = req.body?.payload?.payment?.entity;
  if (event === 'payment.captured' && payload?.order_id) {
    const result = await razorpayService.handlePaymentCaptured({
      orderId: payload.order_id,
      paymentId: payload.id,
    });
    if (result?.type === 'member_subscription') {
      await runMemberPaymentSideEffects({
        result,
        gymId: result.intent?.gymId,
      });
    }
  }

  return sendSuccess(res, { message: 'ok' });
});
