import * as memberPaymentService from '../../services/memberPayment.service.js';
import * as paymentService from '../../services/payment.service.js';
import { emailService } from '../../services/email/email.service.js';
import { logger } from '../../config/logger.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendCreated, sendSuccess } from '../../utils/ApiResponse.js';

export const createMemberOrderHandler = asyncHandler(async (req, res) => {
  const result = await memberPaymentService.createMemberOrder({
    user: req.user,
    gymId: req.gymId,
    planId: req.body.planId,
  });
  return sendCreated(res, { message: 'Payment order created', data: result });
});

export const verifyMemberPaymentHandler = asyncHandler(async (req, res) => {
  const { orderId, paymentId, signature } = req.body;
  const result = await memberPaymentService.verifyAndFulfillMemberPayment({
    user: req.user,
    gymId: req.gymId,
    orderId,
    paymentId,
    signature,
  });

  if (result?.payment && !result.alreadyFulfilled) {
    try {
      const ctx = await paymentService.getPaymentReceiptContext({ paymentId: result.payment.id });
      const { to, ...rest } = ctx;
      await emailService.sendPaymentReceipt({ to, correlationId: result.payment.id, ...rest });
    } catch (err) {
      logger.warn('Member payment receipt email failed', { err: err?.message });
    }
    try {
      await memberPaymentService.finalizeMemberPaymentSideEffects({
        paymentId: result.payment.id,
        gymId: req.gymId,
      });
    } catch (err) {
      logger.warn('Member GST invoice failed', { err: err?.message });
    }
  }

  return sendSuccess(res, {
    message: 'Payment verified',
    data: {
      status: result?.intent?.status ?? 'captured',
      subscriptionId: result?.subscriptionId ?? result?.intent?.subscriptionId,
      paymentId: result?.payment?.id,
    },
  });
});

export const getMemberOrderStatusHandler = asyncHandler(async (req, res) => {
  const status = await memberPaymentService.getMemberOrderStatus({
    user: req.user,
    gymId: req.gymId,
    orderId: req.params.orderId,
  });
  return sendSuccess(res, { data: status });
});
