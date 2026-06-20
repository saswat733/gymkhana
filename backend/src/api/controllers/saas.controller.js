import * as saasBillingService from '../../services/saasBilling.service.js';
import * as razorpayService from '../../services/razorpay.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendCreated, sendSuccess } from '../../utils/ApiResponse.js';

export const listSaasPlansHandler = asyncHandler(async (_req, res) => {
  const plans = await saasBillingService.listSaasPlans();
  return sendSuccess(res, { data: { plans } });
});

export const getMyGymSaasSubscriptionHandler = asyncHandler(async (req, res) => {
  const subscription = await saasBillingService.getGymSaasSubscription({ gymId: req.gymId });
  return sendSuccess(res, { data: { subscription } });
});

export const startMyGymSaasSubscriptionHandler = asyncHandler(async (req, res) => {
  const subscription = await saasBillingService.startOrChangeGymSubscription({
    gymId: req.gymId,
    planCode: req.body.planCode,
    billingCycle: req.body.billingCycle,
    trialDays: req.body.trialDays,
  });
  return sendCreated(res, { message: 'SaaS subscription started', data: { subscription } });
});

export const cancelMyGymSaasSubscriptionHandler = asyncHandler(async (req, res) => {
  const subscription = await saasBillingService.cancelGymSubscription({ gymId: req.gymId });
  return sendSuccess(res, { message: 'SaaS subscription cancelled', data: { subscription } });
});

export const generateMyGymSaasInvoiceHandler = asyncHandler(async (req, res) => {
  const invoice = await saasBillingService.generateSaasInvoiceForCurrentPeriod({
    gymId: req.gymId,
    dueDays: req.body?.dueDays,
    gstPercent: req.body?.gstPercent,
  });
  return sendCreated(res, { message: 'Invoice generated', data: { invoice } });
});

export const listMyGymSaasInvoicesHandler = asyncHandler(async (req, res) => {
  const invoices = await saasBillingService.listSaasInvoicesForGym({ gymId: req.gymId });
  return sendSuccess(res, { data: { invoices } });
});

export const markMyGymSaasInvoicePaidHandler = asyncHandler(async (req, res) => {
  const invoice = await saasBillingService.markSaasInvoicePaid({ gymId: req.gymId, invoiceId: req.params.id });
  return sendSuccess(res, { message: 'Invoice marked paid', data: { invoice } });
});

export const createSaasInvoiceRazorpayOrderHandler = asyncHandler(async (req, res) => {
  const order = await razorpayService.createSaasInvoiceOrder({ gymId: req.gymId, invoiceId: req.params.id });
  return sendSuccess(res, { data: { razorpay: order } });
});

