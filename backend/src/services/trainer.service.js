import { Op } from 'sequelize';
import { Trainer, User } from '../models/index.js';
import { ApiError } from '../utils/ApiError.js';
import { ROLES } from '../constants/roles.js';
import { buildMeta, getPagination, getSort } from '../utils/pagination.js';
import { assertTrainerLimit } from './saasBilling.service.js';

export const createTrainer = async (payload, { gymId } = {}) => {
  if (!gymId) throw ApiError.badRequest('gymId is required');
  await assertTrainerLimit({ gymId });

  const exists = await User.findOne({ where: { email: payload.email } });
  if (exists) throw ApiError.conflict('Email is already registered');

  const user = await User.createWithPassword({
    name: payload.name,
    email: payload.email,
    phone: payload.phone,
    password: payload.password,
    role: ROLES.TRAINER,
    isActive: payload.isActive ?? true,
    gymId,
  });

  const trainer = await Trainer.create({
    userId: user.id,
    gymId,
    bio: payload.bio ?? null,
    specialization: payload.specialization ?? null,
    isActive: payload.isActive ?? true,
  });

  return { user, trainer };
};

export const listTrainers = async (query, { gymId } = {}) => {
  if (!gymId) throw ApiError.badRequest('gymId is required');
  const { page, pageSize, offset, limit } = getPagination(query);
  const order = getSort(query, { allowed: ['createdAt', 'isActive'] });

  const where = { gymId };
  if (query?.isActive !== undefined) where.isActive = query.isActive;

  const userWhere = {};
  if (query?.q) {
    userWhere[Op.or] = [
      { name: { [Op.like]: `%${query.q}%` } },
      { email: { [Op.like]: `%${query.q}%` } },
    ];
  }

  const { rows, count } = await Trainer.findAndCountAll({
    where,
    include: [{ model: User, where: userWhere, required: true }],
    offset,
    limit,
    order,
  });

  return { rows, meta: buildMeta({ page, pageSize, total: count }) };
};
