import { Op, fn, col } from 'sequelize';
import { Attendance, AttendanceZone, Member, Payment, Plan, Subscription } from '../models/index.js';
import { PAYMENT_STATUS } from '../models/Payment.js';
import { SUBSCRIPTION_STATUS } from '../models/Subscription.js';

const startOfDay = (d) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

const addDays = (d, days) => {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
};

const startOfMonth = (d) => new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
const startOfNextMonth = (d) => new Date(d.getFullYear(), d.getMonth() + 1, 1, 0, 0, 0, 0);

const ymd = (d) => {
  const dt = new Date(d);
  const yyyy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  const dd = String(dt.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

export const getDashboardKpis = async ({ gymId } = {}) => {
  if (!gymId) throw new Error('gymId is required');
  const now = new Date();

  const revenueFrom = startOfMonth(now);
  const revenueTo = startOfNextMonth(now);

  const todayFrom = startOfDay(now);
  const todayTo = addDays(todayFrom, 1);

  const expiringFrom = new Date(now);
  const expiringTo = addDays(now, 7);
  const expFromDateOnly = expiringFrom.toISOString().slice(0, 10);
  const expToDateOnly = expiringTo.toISOString().slice(0, 10);

  const [activeSubs, revenueRow, todayCheckIns, expiringSoon] = await Promise.all([
    Subscription.count({ where: { gymId, status: SUBSCRIPTION_STATUS.ACTIVE } }),
    Payment.findOne({
      attributes: [[fn('COALESCE', fn('SUM', col('amount_cents')), 0), 'sumCents']],
      where: {
        gymId,
        status: PAYMENT_STATUS.PAID,
        paidAt: { [Op.gte]: revenueFrom, [Op.lt]: revenueTo },
      },
      raw: true,
    }),
    Attendance.count({ where: { gymId, checkInAt: { [Op.gte]: todayFrom, [Op.lt]: todayTo } } }),
    Subscription.count({
      where: {
        gymId,
        status: SUBSCRIPTION_STATUS.ACTIVE,
        endsAt: { [Op.gte]: expFromDateOnly, [Op.lte]: expToDateOnly },
      },
    }),
  ]);

  const revenueMtdCents = Number(revenueRow?.sumCents ?? 0) || 0;

  return {
    activeSubscriptions: activeSubs,
    revenueMtdCents,
    todayCheckIns,
    expiringSoon,
    currency: 'INR',
    computedAt: now.toISOString(),
  };
};

export const getRevenueTrend = async ({ gymId, days = 30 }) => {
  if (!gymId) throw new Error('gymId is required');
  const n = Math.max(7, Math.min(365, Number(days) || 30));
  const now = new Date();
  const from = startOfDay(addDays(now, -n + 1));
  const to = addDays(startOfDay(now), 1);

  const rows = await Payment.findAll({
    attributes: [
      [fn('DATE', col('paid_at')), 'day'],
      [fn('COALESCE', fn('SUM', col('amount_cents')), 0), 'sumCents'],
    ],
    where: {
      gymId,
      status: PAYMENT_STATUS.PAID,
      paidAt: { [Op.gte]: from, [Op.lt]: to },
    },
    group: [fn('DATE', col('paid_at'))],
    raw: true,
  });

  const map = new Map(rows.map((r) => [String(r.day), Number(r.sumCents) || 0]));
  const series = [];
  for (let i = n - 1; i >= 0; i -= 1) {
    const day = ymd(addDays(now, -i));
    series.push({ day, revenueCents: map.get(day) ?? 0 });
  }

  return { days: n, currency: 'INR', series };
};

export const getAttendanceHeatmap = async ({ gymId, days = 56 }) => {
  if (!gymId) throw new Error('gymId is required');
  const n = Math.max(14, Math.min(365, Number(days) || 56));
  const now = new Date();
  const from = startOfDay(addDays(now, -n + 1));
  const to = addDays(startOfDay(now), 1);

  const rows = await Attendance.findAll({
    attributes: [
      [fn('DATE', col('check_in_at')), 'day'],
      [fn('COUNT', col('id')), 'count'],
    ],
    where: { gymId, checkInAt: { [Op.gte]: from, [Op.lt]: to } },
    group: [fn('DATE', col('check_in_at'))],
    raw: true,
  });

  const map = new Map(rows.map((r) => [String(r.day), Number(r.count) || 0]));
  const series = [];
  for (let i = n - 1; i >= 0; i -= 1) {
    const day = ymd(addDays(now, -i));
    series.push({ day, count: map.get(day) ?? 0 });
  }
  return { days: n, series };
};

export const getMrrAndRetention = async ({ gymId } = {}) => {
  if (!gymId) throw new Error('gymId is required');
  const now = new Date();
  const monthStart = startOfMonth(now);

  const activeSubs = await Subscription.findAll({
    where: { gymId, status: SUBSCRIPTION_STATUS.ACTIVE },
    include: [{ model: Plan }],
  });

  let mrrCents = 0;
  for (const sub of activeSubs) {
    const plan = sub.Plan;
    if (!plan) continue;
    const monthly = Math.round(plan.priceCents / Math.max(1, plan.durationMonths));
    mrrCents += monthly;
  }

  const totalMembers = await Member.count({ where: { gymId, isActive: true } });
  const renewedThisMonth = await Subscription.count({
    where: {
      gymId,
      status: SUBSCRIPTION_STATUS.ACTIVE,
      createdAt: { [Op.gte]: monthStart },
    },
  });

  const renewalRate = totalMembers > 0 ? Math.round((renewedThisMonth / totalMembers) * 100) : 0;

  const paidPayments = await Payment.count({
    where: { gymId, status: PAYMENT_STATUS.PAID, paidAt: { [Op.gte]: monthStart } },
  });

  return {
    mrrCents,
    arrCents: mrrCents * 12,
    activeSubscriptions: activeSubs.length,
    totalMembers,
    renewalsThisMonth: renewedThisMonth,
    renewalRatePercent: renewalRate,
    paymentsThisMonth: paidPayments,
    currency: 'INR',
    computedAt: now.toISOString(),
  };
};

export const getZoneAttendanceStats = async ({ gymId, days = 30 } = {}) => {
  if (!gymId) throw new Error('gymId is required');
  const n = Math.min(Math.max(Number(days) || 30, 7), 90);
  const from = addDays(new Date(), -n);

  const zones = await AttendanceZone.findAll({ where: { gymId, isActive: true } });
  const rows = await Attendance.findAll({
    attributes: ['zoneId', [fn('COUNT', col('id')), 'count']],
    where: { gymId, checkInAt: { [Op.gte]: from }, zoneId: { [Op.ne]: null } },
    group: ['zoneId'],
    raw: true,
  });

  const map = new Map(rows.map((r) => [String(r.zoneId), Number(r.count) || 0]));
  const total = [...map.values()].reduce((a, b) => a + b, 0);

  const series = zones.map((z) => ({
    zoneId: z.id,
    zoneName: z.name,
    count: map.get(String(z.id)) ?? 0,
    percent: total ? Math.round(((map.get(String(z.id)) ?? 0) / total) * 100) : 0,
  }));

  return { days: n, total, series };
};

