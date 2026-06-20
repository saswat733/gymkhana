import { Announcement } from '../models/index.js';
import { ApiError } from '../utils/ApiError.js';
import { buildMeta, getPagination, getSort } from '../utils/pagination.js';
import { ANNOUNCEMENT_AUDIENCE } from '../models/Announcement.js';
import { ROLES } from '../constants/roles.js';

const now = () => new Date();

const isVisibleToUser = (a, user) => {
  if (!a.isPublished) return false;
  const t = now();
  const publishAt = a.publishAt ? new Date(a.publishAt) : null;
  const expiresAt = a.expiresAt ? new Date(a.expiresAt) : null;
  if (publishAt && publishAt.getTime() > t.getTime()) return false;
  if (expiresAt && expiresAt.getTime() < t.getTime()) return false;

  if (a.audience === ANNOUNCEMENT_AUDIENCE.ALL) return true;
  if (a.audience === ANNOUNCEMENT_AUDIENCE.MEMBERS) return user.role === ROLES.MEMBER;
  if (a.audience === ANNOUNCEMENT_AUDIENCE.TRAINERS) return user.role === ROLES.TRAINER;
  if (a.audience === ANNOUNCEMENT_AUDIENCE.ADMINS) return user.role === ROLES.ADMIN;
  return false;
};

export const createAnnouncement = async ({ user, gymId, payload }) => {
  if (!gymId) throw ApiError.badRequest('gymId is required');
  const announcement = await Announcement.create({ ...payload, gymId, createdByUserId: user.id });
  return announcement;
};

export const updateAnnouncement = async ({ id, gymId, patch }) => {
  if (!gymId) throw ApiError.badRequest('gymId is required');
  const a = await Announcement.findByPk(id);
  if (!a) throw ApiError.notFound('Announcement not found');
  if (String(a.gymId) !== String(gymId)) throw ApiError.forbidden();
  await a.update(patch);
  return a;
};

export const deleteAnnouncement = async ({ id, gymId }) => {
  if (!gymId) throw ApiError.badRequest('gymId is required');
  const a = await Announcement.findByPk(id);
  if (!a) throw ApiError.notFound('Announcement not found');
  if (String(a.gymId) !== String(gymId)) throw ApiError.forbidden();
  await a.destroy();
};

export const listAnnouncements = async (query) => {
  const { page, pageSize, offset, limit } = getPagination(query);
  const order = getSort(query, { allowed: ['createdAt', 'publishAt', 'expiresAt', 'isPublished', 'audience'] });

  const where = {};
  if (!query?.gymId) throw ApiError.badRequest('gymId is required');
  where.gymId = query.gymId;
  if (query?.audience) where.audience = query.audience;
  if (query?.isPublished !== undefined) where.isPublished = query.isPublished;

  const { rows, count } = await Announcement.findAndCountAll({ where, offset, limit, order });
  return { rows, meta: buildMeta({ page, pageSize, total: count }) };
};

export const listInboxForUser = async ({ user, gymId, query }) => {
  if (!gymId) throw ApiError.badRequest('gymId is required');
  const { page, pageSize, offset, limit } = getPagination(query);
  const order = getSort(query, { allowed: ['publishAt', 'createdAt'] });

  // Keep SQL filter simple; apply audience + timing checks in JS (OK for Phase 6).
  const where = { gymId, isPublished: true };
  const rows = await Announcement.findAll({ where, offset, limit, order });
  const visible = rows.filter((a) => isVisibleToUser(a, user));

  return { rows: visible, meta: buildMeta({ page, pageSize, total: visible.length }) };
};

