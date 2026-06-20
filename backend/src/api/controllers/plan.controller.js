import * as planService from '../../services/plan.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendCreated, sendSuccess } from '../../utils/ApiResponse.js';

export const createPlanHandler = asyncHandler(async (req, res) => {
  const plan = await planService.createPlan({ ...req.body, gymId: req.gymId });
  return sendCreated(res, { message: 'Plan created', data: { plan } });
});

export const listPlansHandler = asyncHandler(async (req, res) => {
  const result = await planService.listPlans(req.query, { gymId: req.gymId });
  return sendSuccess(res, { data: { plans: result.rows }, meta: result.meta });
});

export const getPlanHandler = asyncHandler(async (req, res) => {
  const plan = await planService.getPlanById(req.params.id);
  return sendSuccess(res, { data: { plan } });
});

export const updatePlanHandler = asyncHandler(async (req, res) => {
  const plan = await planService.updatePlan(req.params.id, req.body);
  return sendSuccess(res, { message: 'Plan updated', data: { plan } });
});

export const setPlanActiveHandler = asyncHandler(async (req, res) => {
  const plan = await planService.setPlanActive(req.params.id, req.body.isActive);
  return sendSuccess(res, { message: 'Plan updated', data: { plan } });
});

