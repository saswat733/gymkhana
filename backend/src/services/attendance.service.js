import { Op } from 'sequelize';

import { sequelize } from '../config/database.js';

import { Attendance, AttendanceZone, Member, Subscription, User } from '../models/index.js';

import { SUBSCRIPTION_STATUS } from '../models/Subscription.js';

import { ApiError } from '../utils/ApiError.js';

import { buildMeta, getPagination, getSort } from '../utils/pagination.js';

import { ATTENDANCE_SOURCE } from '../models/Attendance.js';

import { getAttendanceProvider, ATTENDANCE_PROVIDER_TYPES } from './attendance/providers/index.js';

import { findActiveSubscription, isSubscriptionActive } from '../utils/membershipAccess.js';



const startOfUtcDay = (d = new Date()) => {

  const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));

  return x;

};



const endOfUtcDay = (d = new Date()) => {

  const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59, 999));

  return x;

};



const assertMemberAccess = async ({ gymId, memberId }) => {

  const member = await Member.findByPk(memberId);

  if (!member || !member.isActive) throw ApiError.notFound('Member not found or inactive');

  if (String(member.gymId) !== String(gymId)) throw ApiError.forbidden('Cross-tenant member');

  return member;

};



const assertActiveMembership = async ({ gymId, memberId }) => {

  const activeSub = await findActiveSubscription({ gymId, memberId });

  if (!activeSub) {

    throw ApiError.forbidden('No active membership. Subscribe or renew to check in.');

  }

  return activeSub;

};



const incrementTrialVisit = async (sub) => {

  if (!sub.isTrial) return;

  if (sub.trialVisitsLimit == null) return;

  await sub.update({ trialVisitsUsed: (sub.trialVisitsUsed ?? 0) + 1 });

};



export const checkIn = async ({ gymId, memberId, source = ATTENDANCE_SOURCE.MANUAL, zoneId = null, qrPayload = null }) => {

  if (!gymId) throw ApiError.badRequest('gymId is required');

  await assertMemberAccess({ gymId, memberId });



  let resolvedSource = source;

  let resolvedZoneId = zoneId;



  if (qrPayload) {

    const provider = getAttendanceProvider(ATTENDANCE_PROVIDER_TYPES.QR);

    const validated = await provider.validate({ gymId, qrPayload });

    resolvedSource = validated.source;

    resolvedZoneId = validated.zoneId;

  }



  const activeSub = await assertActiveMembership({ gymId, memberId });



  const dayStart = startOfUtcDay();

  const dayEnd = endOfUtcDay();



  const existing = await Attendance.findOne({

    where: {

      gymId,

      memberId,

      checkInAt: { [Op.between]: [dayStart, dayEnd] },

    },

  });

  if (existing) throw ApiError.conflict('Already checked in today');



  return sequelize.transaction(async (t) => {

    const attendance = await Attendance.create(

      { gymId, memberId, source: resolvedSource, zoneId: resolvedZoneId, checkInAt: new Date() },

      { transaction: t },

    );

    await incrementTrialVisit(activeSub);

    return attendance;

  });

};



export const scanGymQrAndCheckIn = async ({ gymId, memberId, qrPayload }) =>

  checkIn({ gymId, memberId, qrPayload });



export const checkOut = async ({ gymId, memberId }) => {

  if (!gymId) throw ApiError.badRequest('gymId is required');

  await assertMemberAccess({ gymId, memberId });



  const dayStart = startOfUtcDay();

  const dayEnd = endOfUtcDay();



  const open = await Attendance.findOne({

    where: {

      gymId,

      memberId,

      checkInAt: { [Op.between]: [dayStart, dayEnd] },

      checkOutAt: null,

    },

    order: [['checkInAt', 'DESC']],

  });

  if (!open) throw ApiError.badRequest('No open check-in found for today');



  open.checkOutAt = new Date();

  await open.save();

  return open;

};



export const listAttendance = async (query) => {

  const { page, pageSize, offset, limit } = getPagination(query);

  const order = getSort(query, { allowed: ['checkInAt', 'createdAt'] });



  const where = {};

  if (!query?.gymId) throw ApiError.badRequest('gymId is required');

  where.gymId = query.gymId;

  if (query?.memberId) where.memberId = query.memberId;

  if (query?.zoneId) where.zoneId = query.zoneId;

  if (query?.from || query?.to) {

    where.checkInAt = {};

    if (query.from) where.checkInAt[Op.gte] = new Date(query.from);

    if (query.to) where.checkInAt[Op.lte] = new Date(query.to);

  }



  const { rows, count } = await Attendance.findAndCountAll({

    where,

    offset,

    limit,

    order,

    include: [{ model: AttendanceZone, attributes: ['id', 'name'], required: false }],

  });

  return { rows, meta: buildMeta({ page, pageSize, total: count }) };

};



const parsePassCode = (passCode) => {

  const raw = String(passCode ?? '').trim();

  const m = raw.match(/^gymkhana:member:([0-9a-f-]{36})$/i);

  return m ? m[1] : null;

};



export const verifyPassAndCheckIn = async ({ gymId, passCode, checkIn = true }) => {

  if (!gymId) throw ApiError.badRequest('gymId is required');

  const memberId = parsePassCode(passCode);

  if (!memberId) throw ApiError.badRequest('Invalid pass code format');



  const member = await Member.findByPk(memberId, { include: [{ model: User }] });

  if (!member || !member.isActive) throw ApiError.notFound('Member not found or inactive');

  if (String(member.gymId) !== String(gymId)) throw ApiError.forbidden('Member belongs to another gym');



  const activeSub = await Subscription.findOne({

    where: { gymId, memberId, status: SUBSCRIPTION_STATUS.ACTIVE },

    order: [['endsAt', 'DESC']],

  });



  const subscriptionValid = activeSub ? await isSubscriptionActive(activeSub, { gymId }) : false;



  let attendance = null;

  if (checkIn && subscriptionValid) {

    try {

      attendance = await checkIn({ gymId, memberId, source: ATTENDANCE_SOURCE.MANUAL });

    } catch (e) {

      if (e?.statusCode !== 409) throw e;

      attendance = await Attendance.findOne({

        where: { gymId, memberId },

        order: [['checkInAt', 'DESC']],

      });

    }

  }



  return {

    member: { id: member.id, name: member.User?.name, email: member.User?.email },

    subscriptionValid,

    subscriptionEndsAt: activeSub?.endsAt ?? null,

    isTrial: Boolean(activeSub?.isTrial),

    checkedIn: Boolean(attendance),

    attendance,

  };

};


