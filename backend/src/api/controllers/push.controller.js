import * as pushService from '../../services/push.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/ApiResponse.js';

export const registerPushTokenHandler = asyncHandler(async (req, res) => {
  const row = await pushService.registerPushToken({
    userId: req.user.id,
    gymId: req.gymId,
    token: req.body.token,
    platform: req.body.platform,
  });
  return sendSuccess(res, { message: 'Push token registered', data: { pushToken: row } });
});
