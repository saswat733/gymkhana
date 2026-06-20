import * as subscriptionService from '../../services/subscription.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendCreated, sendSuccess } from '../../utils/ApiResponse.js';

export const createSubscriptionHandler = asyncHandler(async (req, res) => {
  const subscription = await subscriptionService.createSubscription({ gymId: req.gymId, ...req.body });
  return sendCreated(res, { message: 'Subscription created', data: { subscription } });
});

export const createSelfSubscriptionHandler = asyncHandler(async (req, res) => {
  const subscription = await subscriptionService.createSubscriptionForSelf({
    user: req.user,
    gymId: req.gymId,
    planId: req.body.planId,
    autoRenew: req.body.autoRenew,
  });
  return sendCreated(res, { message: 'Subscription created', data: { subscription } });
});

export const listSubscriptionsHandler = asyncHandler(async (req, res) => {
  const result = await subscriptionService.listSubscriptionsForRequester({ user: req.user, gymId: req.gymId, query: req.query });
  return sendSuccess(res, { data: { subscriptions: result.rows }, meta: result.meta });
});

export const cancelSubscriptionHandler = asyncHandler(async (req, res) => {
  const subscription = await subscriptionService.cancelSubscription({ gymId: req.gymId, id: req.params.id });
  return sendSuccess(res, { message: 'Subscription cancelled', data: { subscription } });
});

export const renewSubscriptionHandler = asyncHandler(async (req, res) => {
  const subscription = await subscriptionService.renewSubscription({ gymId: req.gymId, id: req.params.id });
  return sendSuccess(res, { message: 'Subscription renewed', data: { subscription } });
});

