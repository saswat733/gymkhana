import { Op } from 'sequelize';
import { Member, Trainer, WorkoutPlan } from '../models/index.js';
import { ApiError } from '../utils/ApiError.js';
import { ROLES } from '../constants/roles.js';
import { buildMeta, getPagination, getSort } from '../utils/pagination.js';

export const createWorkoutPlan = async ({ user, gymId, payload }) => {
  if (!gymId) throw ApiError.badRequest('gymId is required');
  if (user.role !== ROLES.ADMIN && user.role !== ROLES.TRAINER) throw ApiError.forbidden();

  const member = await Member.findByPk(payload.memberId);
  if (!member || !member.isActive) throw ApiError.notFound('Member not found or inactive');
  if (String(member.gymId) !== String(gymId)) throw ApiError.forbidden('Cross-tenant member');

  if (payload.trainerId) {
    const trainer = await Trainer.findByPk(payload.trainerId);
    if (!trainer || !trainer.isActive) throw ApiError.notFound('Trainer not found or inactive');
    if (String(trainer.gymId) !== String(gymId)) throw ApiError.forbidden('Cross-tenant trainer');
  }

  return WorkoutPlan.create({
    gymId,
    memberId: payload.memberId,
    trainerId: payload.trainerId ?? null,
    title: payload.title,
    notes: payload.notes ?? null,
    planJson: payload.planJson ?? null,
    isActive: payload.isActive ?? true,
  });
};

export const updateWorkoutPlan = async ({ user, gymId, id, patch }) => {
  if (!gymId) throw ApiError.badRequest('gymId is required');
  if (user.role !== ROLES.ADMIN && user.role !== ROLES.TRAINER) throw ApiError.forbidden();
  const wp = await WorkoutPlan.findByPk(id);
  if (!wp) throw ApiError.notFound('Workout plan not found');
  if (String(wp.gymId) !== String(gymId)) throw ApiError.forbidden();
  await wp.update(patch);
  return wp;
};

export const deleteWorkoutPlan = async ({ user, gymId, id }) => {
  if (!gymId) throw ApiError.badRequest('gymId is required');
  if (user.role !== ROLES.ADMIN && user.role !== ROLES.TRAINER) throw ApiError.forbidden();
  const wp = await WorkoutPlan.findByPk(id);
  if (!wp) throw ApiError.notFound('Workout plan not found');
  if (String(wp.gymId) !== String(gymId)) throw ApiError.forbidden();
  await wp.destroy();
};

export const listWorkoutPlansForRequester = async ({ user, gymId, query }) => {
  if (!gymId) throw ApiError.badRequest('gymId is required');
  const scoped = { ...query };
  scoped.gymId = gymId;
  if (user.role === ROLES.MEMBER) {
    const member = await Member.findOne({ where: { userId: user.id, gymId } });
    if (!member) throw ApiError.notFound('Member profile not found');
    scoped.memberId = member.id;
  }
  return listWorkoutPlans(scoped);
};

export const listWorkoutPlans = async (query) => {
  const { page, pageSize, offset, limit } = getPagination(query);
  const order = getSort(query, { allowed: ['createdAt', 'updatedAt', 'title', 'isActive'] });

  const where = {};
  if (!query?.gymId) throw ApiError.badRequest('gymId is required');
  where.gymId = query.gymId;
  if (query?.memberId) where.memberId = query.memberId;
  if (query?.trainerId) where.trainerId = query.trainerId;
  if (query?.isActive !== undefined) where.isActive = query.isActive;
  if (query?.q) {
    const q = String(query.q).trim();
    where[Op.or] = [{ title: { [Op.like]: `%${q}%` } }];
  }

  const { rows, count } = await WorkoutPlan.findAndCountAll({ where, offset, limit, order });
  return { rows, meta: buildMeta({ page, pageSize, total: count }) };
};

