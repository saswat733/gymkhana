import { Op } from 'sequelize';
import { Lead, Member, Plan, Subscription, User } from '../models/index.js';
import { LEAD_STATUS } from '../models/Lead.js';
import { ApiError } from '../utils/ApiError.js';
import { buildMeta, getPagination } from '../utils/pagination.js';
import * as subscriptionService from './subscription.service.js';

export const listLeads = async ({ gymId, query }) => {
  const { page, pageSize, offset, limit } = getPagination(query);
  const where = { gymId };
  if (query?.status) where.status = query.status;
  if (query?.q) {
    const q = String(query.q).trim();
    where[Op.or] = [
      { name: { [Op.like]: `%${q}%` } },
      { email: { [Op.like]: `%${q}%` } },
      { phone: { [Op.like]: `%${q}%` } },
    ];
  }
  const { rows, count } = await Lead.findAndCountAll({
    where,
    offset,
    limit,
    order: [['createdAt', 'DESC']],
  });
  return { rows, meta: buildMeta({ page, pageSize, total: count }) };
};

export const createLead = async ({ gymId, ...data }) => {
  return Lead.create({
    gymId,
    name: data.name,
    phone: data.phone ?? null,
    email: data.email ?? null,
    source: data.source ?? 'walk-in',
    status: LEAD_STATUS.CREATED,
    notes: data.notes ?? null,
    followUpAt: data.followUpAt ?? null,
    assignedToUserId: data.assignedToUserId ?? null,
  });
};

export const updateLead = async ({ gymId, id, patch }) => {
  const lead = await Lead.findByPk(id);
  if (!lead || String(lead.gymId) !== String(gymId)) throw ApiError.notFound('Lead not found');
  await lead.update(patch);
  return lead;
};

export const startLeadTrial = async ({ gymId, leadId, planId, createdByUserId }) => {
  const lead = await Lead.findByPk(leadId);
  if (!lead || String(lead.gymId) !== String(gymId)) throw ApiError.notFound('Lead not found');

  const plan = await Plan.findOne({ where: { id: planId, gymId, isActive: true, isTrial: true } });
  if (!plan) throw ApiError.badRequest('Trial plan not found');

  let member = null;
  if (lead.email) {
    const user = await User.findOne({ where: { email: lead.email.toLowerCase(), gymId } });
    if (user) member = await Member.findOne({ where: { userId: user.id, gymId } });
  }

  if (!member) {
    throw ApiError.badRequest('Create a member account for this lead before starting a trial');
  }

  const sub = await subscriptionService.createTrialSubscription({
    gymId,
    memberId: member.id,
    planId: plan.id,
  });

  await lead.update({
    status: LEAD_STATUS.TRIAL_SCHEDULED,
    trialSubscriptionId: sub.id,
  });

  return { lead, subscription: sub };
};

export const convertLead = async ({ gymId, leadId, memberId }) => {
  const lead = await Lead.findByPk(leadId);
  if (!lead || String(lead.gymId) !== String(gymId)) throw ApiError.notFound('Lead not found');

  const member = await Member.findByPk(memberId);
  if (!member || String(member.gymId) !== String(gymId)) throw ApiError.notFound('Member not found');

  await lead.update({
    status: LEAD_STATUS.CONVERTED,
    convertedMemberId: memberId,
  });
  return lead;
};
