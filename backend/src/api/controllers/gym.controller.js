import * as gymService from '../../services/gym.service.js';
import { issueTokensFor } from '../../utils/jwt.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendCreated, sendSuccess } from '../../utils/ApiResponse.js';

export const onboardGymHandler = asyncHandler(async (req, res) => {
  const { gym, owner } = await gymService.onboardGym(req.body);
  const tokens = issueTokensFor(owner);
  return sendCreated(res, {
    message: 'Gym created',
    data: { gym, owner, ...tokens },
  });
});

export const getMyGymHandler = asyncHandler(async (req, res) => {
  const gym = await gymService.getGymProfile({ gymId: req.gymId });
  return sendSuccess(res, { data: { gym } });
});

export const updateMyGymHandler = asyncHandler(async (req, res) => {
  const gym = await gymService.updateGymProfile({ gymId: req.gymId, patch: req.body });
  return sendSuccess(res, { message: 'Gym updated', data: { gym } });
});
