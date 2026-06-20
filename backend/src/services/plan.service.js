import { Op } from 'sequelize';
import { Plan } from '../models/index.js';
import { ApiError } from '../utils/ApiError.js';
import { getPagination, getSort, buildMeta } from '../utils/pagination.js';
import { cache } from './cache/cache.service.js';
import { env } from '../config/env.js';

export const createPlan = async (payload) => {
  if (!payload?.gymId) throw ApiError.badRequest('gymId is required');
  const existing = await Plan.findOne({ where: { gymId: payload.gymId, name: payload.name } });
  if (existing) throw ApiError.conflict('Plan name already exists');
  const created = await Plan.create(payload);
  await cache.del('plans:list:all').catch(() => undefined);
  return created;
};

export const listPlans = async (query, { gymId } = {}) => {
  if (!gymId) throw ApiError.badRequest('gymId is required');
  const cacheKey = query?.q || query?.isActive !== undefined || query?.page || query?.pageSize || query?.sort
    ? null
    : 'plans:list:all';
  if (cacheKey) {
    const hit = await cache.getJson(cacheKey).catch(() => null);
    if (hit) return hit;
  }

  const { page, pageSize, offset, limit } = getPagination(query);
  const order = getSort(query, { allowed: ['createdAt', 'name', 'priceCents', 'durationMonths', 'isActive'] });

  const where = {};
  where.gymId = gymId;
  if (query?.q) {
    where.name = { [Op.like]: `%${query.q}%` };
  }
  if (query?.isActive !== undefined) where.isActive = query.isActive;

  const { rows, count } = await Plan.findAndCountAll({ where, offset, limit, order });
  const result = { rows, meta: buildMeta({ page, pageSize, total: count }) };
  if (cacheKey) await cache.setJson(cacheKey, result, { ttlSeconds: env.cache.ttlSeconds }).catch(() => undefined);
  return result;
};

export const getPlanById = async (id) => {
  const plan = await Plan.findByPk(id);
  if (!plan) throw ApiError.notFound('Plan not found');
  return plan;
};

export const updatePlan = async (id, patch) => {
  const plan = await getPlanById(id);
  if (patch.name && patch.name !== plan.name) {
    const exists = await Plan.findOne({ where: { name: patch.name } });
    if (exists) throw ApiError.conflict('Plan name already exists');
  }
  await plan.update(patch);
  await cache.del('plans:list:all').catch(() => undefined);
  return plan;
};

export const setPlanActive = async (id, isActive) => {
  const plan = await getPlanById(id);
  await plan.update({ isActive: Boolean(isActive) });
  await cache.del('plans:list:all').catch(() => undefined);
  return plan;
};

