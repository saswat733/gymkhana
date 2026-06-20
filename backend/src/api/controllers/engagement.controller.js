import * as engagementService from '../../services/engagement.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/ApiResponse.js';

export const getMyEngagementHandler = asyncHandler(async (req, res) => {
  const days = req.query?.days;
  const engagement = await engagementService.getMemberEngagementForRequester({ user: req.user, gymId: req.gymId, days });
  return sendSuccess(res, { data: { engagement } });
});

