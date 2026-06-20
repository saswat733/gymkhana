import * as trainerAssignmentService from '../../services/trainerAssignment.service.js';
import * as trainerService from '../../services/trainer.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendCreated, sendSuccess } from '../../utils/ApiResponse.js';

export const listTrainersHandler = asyncHandler(async (req, res) => {
  const result = await trainerService.listTrainers(req.query, { gymId: req.gymId });
  return sendSuccess(res, { data: { trainers: result.rows }, meta: result.meta });
});

export const createTrainerHandler = asyncHandler(async (req, res) => {
  const result = await trainerService.createTrainer(req.body, { gymId: req.gymId });
  return sendCreated(res, { message: 'Trainer created', data: result });
});

export const assignTrainerMemberHandler = asyncHandler(async (req, res) => {
  const result = await trainerAssignmentService.assignMemberToTrainer({
    gymId: req.gymId,
    trainerId: req.params.trainerId,
    memberId: req.body.memberId,
  });
  return sendSuccess(res, { message: 'Member assigned to trainer', data: result });
});

export const unassignTrainerMemberHandler = asyncHandler(async (req, res) => {
  const result = await trainerAssignmentService.unassignMemberFromTrainer({
    gymId: req.gymId,
    trainerId: req.params.trainerId,
    memberId: req.params.memberId,
  });
  return sendSuccess(res, { message: 'Member unassigned from trainer', data: result });
});

export const listTrainerMembersHandler = asyncHandler(async (req, res) => {
  const members = await trainerAssignmentService.listMembersForTrainer({ gymId: req.gymId, trainerId: req.params.trainerId });
  return sendSuccess(res, { data: { members } });
});

