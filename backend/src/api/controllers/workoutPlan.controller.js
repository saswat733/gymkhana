import * as workoutPlanService from '../../services/workoutPlan.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendCreated, sendSuccess } from '../../utils/ApiResponse.js';

export const createWorkoutPlanHandler = asyncHandler(async (req, res) => {
  const workoutPlan = await workoutPlanService.createWorkoutPlan({ user: req.user, gymId: req.gymId, payload: req.body });
  return sendCreated(res, { message: 'Workout plan created', data: { workoutPlan } });
});

export const listWorkoutPlansHandler = asyncHandler(async (req, res) => {
  const result = await workoutPlanService.listWorkoutPlansForRequester({ user: req.user, gymId: req.gymId, query: req.query });
  return sendSuccess(res, { data: { workoutPlans: result.rows }, meta: result.meta });
});

export const updateWorkoutPlanHandler = asyncHandler(async (req, res) => {
  const workoutPlan = await workoutPlanService.updateWorkoutPlan({
    user: req.user,
    gymId: req.gymId,
    id: req.params.id,
    patch: req.body,
  });
  return sendSuccess(res, { message: 'Workout plan updated', data: { workoutPlan } });
});

export const deleteWorkoutPlanHandler = asyncHandler(async (req, res) => {
  await workoutPlanService.deleteWorkoutPlan({ user: req.user, gymId: req.gymId, id: req.params.id });
  return sendSuccess(res, { message: 'Workout plan deleted' });
});

