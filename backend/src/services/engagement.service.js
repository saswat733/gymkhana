import { Op } from 'sequelize';
import { Attendance, Member, User } from '../models/index.js';
import { ApiError } from '../utils/ApiError.js';
import { ROLES } from '../constants/roles.js';

const startOfUtcDay = (d) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));

const ymdUtc = (d) => {
  const dt = new Date(d);
  const yyyy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(dt.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

export const getMemberEngagementForRequester = async ({ user, gymId, days = 60 }) => {
  if (!gymId) throw ApiError.badRequest('gymId is required');
  if (user.role !== ROLES.MEMBER) throw ApiError.forbidden('Only members can view engagement');

  const member = await Member.findOne({ where: { userId: user.id, gymId }, include: [{ model: User }] });
  if (!member) throw ApiError.notFound('Member profile not found');

  const n = Math.max(7, Math.min(365, Number(days) || 60));
  const today = startOfUtcDay(new Date());
  const from = new Date(today);
  from.setUTCDate(from.getUTCDate() - (n - 1));

  const rows = await Attendance.findAll({
    where: { gymId, memberId: member.id, checkInAt: { [Op.gte]: from } },
    order: [['checkInAt', 'DESC']],
  });

  // Build unique day set (UTC)
  const daySet = new Set(rows.map((r) => ymdUtc(r.checkInAt)));

  // Streak: consecutive days ending today (if checked in today)
  let streak = 0;
  const cursor = new Date(today);
  while (true) {
    const key = ymdUtc(cursor);
    if (!daySet.has(key)) break;
    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  const lastVisitAt = rows[0]?.checkInAt ?? null;
  const visitsLast7 = [...daySet].filter((dStr) => {
    const [y, m, d] = dStr.split('-').map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d));
    const diffDays = Math.floor((today.getTime() - dt.getTime()) / 86400000);
    return diffDays >= 0 && diffDays < 7;
  }).length;

  const visitsLast30 = [...daySet].filter((dStr) => {
    const [y, m, d] = dStr.split('-').map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d));
    const diffDays = Math.floor((today.getTime() - dt.getTime()) / 86400000);
    return diffDays >= 0 && diffDays < 30;
  }).length;

  return {
    memberId: member.id,
    streakDays: streak,
    lastVisitAt,
    visitsLast7Days: visitsLast7,
    visitsLast30Days: visitsLast30,
    computedAt: new Date().toISOString(),
  };
};

