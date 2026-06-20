import { Op } from 'sequelize';
import { Member, User } from '../models/index.js';
import { ApiError } from '../utils/ApiError.js';
import { ROLES } from '../constants/roles.js';
import { buildMeta, getPagination, getSort } from '../utils/pagination.js';
import { assertMemberLimit } from './saasBilling.service.js';

export const createMember = async (payload, { gymId } = {}) => {
  if (!gymId) throw ApiError.badRequest('gymId is required');
  await assertMemberLimit({ gymId });
  const exists = await User.findOne({ where: { email: payload.email } });
  if (exists) throw ApiError.conflict('Email is already registered');

  const user = await User.createWithPassword({
    name: payload.name,
    email: payload.email,
    phone: payload.phone,
    password: payload.password,
    role: ROLES.MEMBER,
    isActive: payload.isActive ?? true,
    gymId,
  });

  const member = await Member.create({
    userId: user.id,
    gymId,
    dob: payload.dob ?? null,
    gender: payload.gender ?? null,
    address: payload.address ?? null,
    emergencyContactName: payload.emergencyContactName ?? null,
    emergencyContactPhone: payload.emergencyContactPhone ?? null,
    joinedAt: payload.joinedAt ?? undefined,
    notes: payload.notes ?? null,
    isActive: payload.isActive ?? true,
  });

  return { user, member };
};

export const listMembers = async (query, { gymId } = {}) => {
  if (!gymId) throw ApiError.badRequest('gymId is required');
  const { page, pageSize, offset, limit } = getPagination(query);
  const order = getSort(query, { allowed: ['createdAt', 'joinedAt', 'isActive'] });

  const where = {};
  where.gymId = gymId;
  if (query?.isActive !== undefined) where.isActive = query.isActive;

  const userWhere = {};
  if (query?.q) {
    userWhere[Op.or] = [
      { name: { [Op.like]: `%${query.q}%` } },
      { email: { [Op.like]: `%${query.q}%` } },
      { phone: { [Op.like]: `%${query.q}%` } },
    ];
  }

  const { rows, count } = await Member.findAndCountAll({
    where,
    include: [{ model: User, where: userWhere, required: true }],
    offset,
    limit,
    order,
  });

  return { rows, meta: buildMeta({ page, pageSize, total: count }) };
};

export const getMemberById = async (id) => {
  const member = await Member.findByPk(id, { include: [{ model: User }] });
  if (!member) throw ApiError.notFound('Member not found');
  return member;
};

export const updateMember = async (id, patch) => {
  const member = await Member.findByPk(id, { include: [{ model: User }] });
  if (!member) throw ApiError.notFound('Member not found');

  if (patch.email && patch.email !== member.User.email) {
    const exists = await User.findOne({ where: { email: patch.email } });
    if (exists) throw ApiError.conflict('Email is already registered');
  }

  const userPatch = {};
  if (patch.name !== undefined) userPatch.name = patch.name;
  if (patch.email !== undefined) userPatch.email = patch.email;
  if (patch.phone !== undefined) userPatch.phone = patch.phone;
  if (patch.isActive !== undefined) userPatch.isActive = patch.isActive;

  const memberPatch = { ...patch };
  delete memberPatch.name;
  delete memberPatch.email;
  delete memberPatch.phone;
  delete memberPatch.password;

  if (Object.keys(userPatch).length) await member.User.update(userPatch);
  await member.update(memberPatch);

  return getMemberById(id);
};

export const setMemberActive = async (id, isActive) => {
  const member = await Member.findByPk(id, { include: [{ model: User }] });
  if (!member) throw ApiError.notFound('Member not found');
  await member.update({ isActive: Boolean(isActive) });
  await member.User.update({ isActive: Boolean(isActive) });
  return getMemberById(id);
};

