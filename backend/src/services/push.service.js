import { PushToken, User } from '../models/index.js';
import { logger } from '../config/logger.js';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

export const registerPushToken = async ({ userId, gymId, token, platform }) => {
  const [row] = await PushToken.findOrCreate({
    where: { userId, token },
    defaults: { userId, gymId, token, platform: platform ?? null, isActive: true },
  });
  if (!row.isActive || String(row.gymId) !== String(gymId)) {
    await row.update({ gymId, isActive: true, platform: platform ?? row.platform });
  }
  return row;
};

export const sendPushToUsers = async ({ userIds, title, body, data }) => {
  if (!userIds?.length) return { sent: 0 };
  const tokens = await PushToken.findAll({
    where: { userId: userIds, isActive: true },
    attributes: ['token'],
  });
  const messages = tokens.map((t) => ({
    to: t.token,
    sound: 'default',
    title,
    body,
    data: data ?? {},
  }));
  if (!messages.length) return { sent: 0 };

  try {
    const res = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(messages),
    });
    if (!res.ok) {
      logger.warn('Expo push failed', { status: res.status, text: await res.text() });
      return { sent: 0, error: 'push_failed' };
    }
    return { sent: messages.length };
  } catch (err) {
    logger.warn('Expo push error', { err: err?.message ?? String(err) });
    return { sent: 0, error: err?.message };
  }
};

export const sendPushToGymMembers = async ({ gymId, title, body, data }) => {
  const users = await User.findAll({ where: { gymId, role: 'member', isActive: true }, attributes: ['id'] });
  return sendPushToUsers({ userIds: users.map((u) => u.id), title, body, data });
};
