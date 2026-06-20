import * as memberService from '../../services/member.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendCreated, sendSuccess } from '../../utils/ApiResponse.js';

export const createMemberHandler = asyncHandler(async (req, res) => {
  const result = await memberService.createMember(req.body, { gymId: req.gymId });
  return sendCreated(res, { message: 'Member created', data: result });
});

export const listMembersHandler = asyncHandler(async (req, res) => {
  const result = await memberService.listMembers(req.query, { gymId: req.gymId });
  return sendSuccess(res, { data: { members: result.rows }, meta: result.meta });
});

export const getMemberHandler = asyncHandler(async (req, res) => {
  const member = await memberService.getMemberById(req.params.id);
  return sendSuccess(res, { data: { member } });
});

export const updateMemberHandler = asyncHandler(async (req, res) => {
  const member = await memberService.updateMember(req.params.id, req.body);
  return sendSuccess(res, { message: 'Member updated', data: { member } });
});

export const setMemberActiveHandler = asyncHandler(async (req, res) => {
  const member = await memberService.setMemberActive(req.params.id, req.body.isActive);
  return sendSuccess(res, { message: 'Member updated', data: { member } });
});

