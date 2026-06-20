import * as leadService from '../../services/lead.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendCreated, sendSuccess } from '../../utils/ApiResponse.js';

export const listLeadsHandler = asyncHandler(async (req, res) => {
  const result = await leadService.listLeads({ gymId: req.gymId, query: req.query });
  return sendSuccess(res, { data: { leads: result.rows }, meta: result.meta });
});

export const createLeadHandler = asyncHandler(async (req, res) => {
  const lead = await leadService.createLead({ gymId: req.gymId, ...req.body });
  return sendCreated(res, { message: 'Lead created', data: { lead } });
});

export const updateLeadHandler = asyncHandler(async (req, res) => {
  const lead = await leadService.updateLead({ gymId: req.gymId, id: req.params.id, patch: req.body });
  return sendSuccess(res, { message: 'Lead updated', data: { lead } });
});

export const startTrialHandler = asyncHandler(async (req, res) => {
  const result = await leadService.startLeadTrial({
    gymId: req.gymId,
    leadId: req.params.id,
    planId: req.body.planId,
    createdByUserId: req.user.id,
  });
  return sendSuccess(res, { message: 'Trial started', data: result });
});

export const convertLeadHandler = asyncHandler(async (req, res) => {
  const lead = await leadService.convertLead({ gymId: req.gymId, leadId: req.params.id, memberId: req.body.memberId });
  return sendSuccess(res, { message: 'Lead converted', data: { lead } });
});
