import { Op } from 'sequelize';
import { StaffShift, User } from '../models/index.js';
import { ApiError } from '../utils/ApiError.js';

export const listShifts = async ({ gymId, from, to, userId }) => {
  const where = { gymId };
  if (userId) where.userId = userId;
  if (from || to) {
    where.shiftDate = {};
    if (from) where.shiftDate[Op.gte] = from;
    if (to) where.shiftDate[Op.lte] = to;
  }
  return StaffShift.findAll({
    where,
    include: [{ model: User, attributes: ['id', 'name', 'email', 'role'] }],
    order: [['shiftDate', 'DESC']],
  });
};

export const createShift = async ({ gymId, userId, shiftDate, shiftType, startsAt, endsAt, notes }) => {
  const user = await User.findByPk(userId);
  if (!user || String(user.gymId) !== String(gymId)) throw ApiError.notFound('Staff user not found');

  return StaffShift.create({
    gymId,
    userId,
    shiftDate,
    shiftType,
    startsAt: startsAt ?? null,
    endsAt: endsAt ?? null,
    notes: notes ?? null,
  });
};

export const deleteShift = async ({ gymId, id }) => {
  const shift = await StaffShift.findByPk(id);
  if (!shift || String(shift.gymId) !== String(gymId)) throw ApiError.notFound('Shift not found');
  await shift.destroy();
};
