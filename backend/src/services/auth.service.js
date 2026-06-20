import crypto from 'crypto';
import { Member, PasswordResetToken, User } from '../models/index.js';
import { ApiError } from '../utils/ApiError.js';
import { issueTokensFor, verifyRefreshToken } from '../utils/jwt.js';
import { ROLES } from '../constants/roles.js';
import { getDefaultGym } from './gym.service.js';
import { assertMemberLimit } from './saasBilling.service.js';

export const register = async ({ name, email, phone, password }) => {
  const existing = await User.findOne({ where: { email } });
  if (existing) throw ApiError.conflict('Email is already registered');

  const gym = await getDefaultGym();
  await assertMemberLimit({ gymId: gym.id });

  // Self-service registration always defaults to MEMBER.
  // Admins/trainers are created via admin endpoints (added in Phase 2).
  const user = await User.createWithPassword({
    name,
    email,
    phone,
    password,
    role: ROLES.MEMBER,
    gymId: gym.id,
  });

  // Create the member profile immediately so mobile/app flows have a stable memberId.
  await Member.create({ userId: user.id, gymId: gym.id });

  const tokens = issueTokensFor(user);
  const userPayload = await me(user.id);
  return { user: userPayload, ...tokens };
};

const ensureUserHasGym = async (user) => {
  if (user.gymId) return user;
  const gym = await getDefaultGym();
  await user.update({ gymId: gym.id });
  return user;
};

export const login = async ({ email, password }) => {
  const user = await User.findOne({ where: { email } });
  if (!user || !user.isActive) throw ApiError.unauthorized('Invalid credentials');

  const ok = await user.comparePassword(password);
  if (!ok) throw ApiError.unauthorized('Invalid credentials');

  await ensureUserHasGym(user);
  user.lastLoginAt = new Date();
  await user.save();

  const tokens = issueTokensFor(user);
  const userPayload = await me(user.id);
  return { user: userPayload, ...tokens };
};

export const refresh = async ({ refreshToken }) => {
  const decoded = verifyRefreshToken(refreshToken);
  const user = await User.findByPk(decoded.sub);
  if (!user || !user.isActive) throw ApiError.unauthorized('Account no longer active');
  await ensureUserHasGym(user);
  return issueTokensFor(user);
};

export const me = async (userId) => {
  const user = await User.findByPk(userId);
  if (!user) throw ApiError.notFound('User not found');
  const payload = user.toJSON();
  if (user.role === ROLES.MEMBER) {
    const member = await Member.findOne({ where: { userId: user.id } });
    return { ...payload, memberId: member?.id ?? null };
  }
  return payload;
};

export const changePassword = async ({ userId, currentPassword, newPassword }) => {
  const user = await User.findByPk(userId);
  if (!user || !user.isActive) throw ApiError.unauthorized('Invalid credentials');

  if (newPassword === currentPassword) {
    throw ApiError.badRequest('New password must differ from current password');
  }

  const ok = await user.comparePassword(currentPassword);
  if (!ok) throw ApiError.unauthorized('Current password is incorrect');

  const passwordHash = await User.hashPassword(newPassword);
  await user.update({ passwordHash });

  const tokens = issueTokensFor(user);
  const userPayload = await me(user.id);
  return { user: userPayload, ...tokens };
};

const RESET_TOKEN_TTL_MINUTES = 30;

const hashResetToken = (token) => crypto.createHash('sha256').update(String(token)).digest('hex');

/**
 * Generates a password reset token and stores only a hash.
 * Returns the plaintext token for delivery via email (console provider in dev).
 */
export const requestPasswordReset = async ({ email }) => {
  const normalized = String(email ?? '').trim().toLowerCase();
  if (!normalized) throw ApiError.badRequest('Email is required');

  const user = await User.findOne({ where: { email: normalized } });
  if (!user || !user.isActive) {
    // Avoid leaking account existence.
    return { email: normalized, token: null };
  }

  const token = crypto.randomBytes(32).toString('hex'); // 64 chars
  const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MINUTES * 60_000);
  await PasswordResetToken.create({
    userId: user.id,
    tokenHash: hashResetToken(token),
    expiresAt,
  });

  return { email: user.email, token };
};

export const resetPassword = async ({ token, newPassword }) => {
  const tok = String(token ?? '').trim();
  if (!tok) throw ApiError.badRequest('Token is required');
  if (!newPassword) throw ApiError.badRequest('New password is required');

  const tokenHash = hashResetToken(tok);
  const record = await PasswordResetToken.findOne({ where: { tokenHash } });
  if (!record) throw ApiError.badRequest('Invalid or expired reset token');
  if (record.usedAt) throw ApiError.badRequest('Reset token already used');
  if (new Date(record.expiresAt).getTime() < Date.now()) throw ApiError.badRequest('Invalid or expired reset token');

  const user = await User.findByPk(record.userId);
  if (!user || !user.isActive) throw ApiError.badRequest('Invalid reset token');

  const passwordHash = await User.hashPassword(newPassword);
  await user.update({ passwordHash });
  await record.update({ usedAt: new Date() });
};
