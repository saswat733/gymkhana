import * as authService from '../../services/auth.service.js';
import { emailService } from '../../services/email/email.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendCreated, sendSuccess } from '../../utils/ApiResponse.js';

export const registerHandler = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body);
  return sendCreated(res, {
    message: 'Registered successfully',
    data: {
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    },
  });
});

export const loginHandler = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body);
  return sendSuccess(res, {
    message: 'Logged in',
    data: {
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    },
  });
});

export const refreshHandler = asyncHandler(async (req, res) => {
  const tokens = await authService.refresh(req.body);
  return sendSuccess(res, { message: 'Token refreshed', data: tokens });
});

export const meHandler = asyncHandler(async (req, res) => {
  const user = await authService.me(req.user.id);
  return sendSuccess(res, { data: { user } });
});

export const changePasswordHandler = asyncHandler(async (req, res) => {
  const result = await authService.changePassword({
    userId: req.user.id,
    currentPassword: req.body.currentPassword,
    newPassword: req.body.newPassword,
  });
  return sendSuccess(res, {
    message: 'Password updated',
    data: {
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    },
  });
});

export const forgotPasswordHandler = asyncHandler(async (req, res) => {
  const result = await authService.requestPasswordReset({ email: req.body.email });

  // Best-effort side effect: send token in dev via console provider.
  if (result?.email && result?.token) {
    await emailService.send({
      to: result.email,
      subject: 'Reset your GymKhana password',
      text: `Use this token to reset your password (dev):\n\n${result.token}\n\nThis token expires in 30 minutes.`,
      tags: ['auth', 'password-reset'],
      correlationId: result.token,
    });
  }

  // Always return OK to avoid leaking whether an email exists.
  return sendSuccess(res, { message: 'If the email exists, reset instructions were sent.' });
});

export const resetPasswordHandler = asyncHandler(async (req, res) => {
  await authService.resetPassword({ token: req.body.token, newPassword: req.body.newPassword });
  return sendSuccess(res, { message: 'Password reset successful. You can now log in.' });
});
