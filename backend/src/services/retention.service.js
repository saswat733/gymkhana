import { Op } from 'sequelize';
import { Attendance, Member, RetentionRule, Subscription, User } from '../models/index.js';
import { RETENTION_TRIGGER, RETENTION_ACTION } from '../models/RetentionRule.js';
import { SUBSCRIPTION_STATUS } from '../models/Subscription.js';
import { ApiError } from '../utils/ApiError.js';
import * as pushService from './push.service.js';
import { emailService } from './email/email.service.js';

export const listRules = async ({ gymId }) =>
  RetentionRule.findAll({ where: { gymId }, order: [['createdAt', 'DESC']] });

export const createRule = async ({ gymId, ...data }) =>
  RetentionRule.create({ gymId, ...data });

export const updateRule = async ({ gymId, id, patch }) => {
  const rule = await RetentionRule.findByPk(id);
  if (!rule || String(rule.gymId) !== String(gymId)) throw ApiError.notFound('Rule not found');
  await rule.update(patch);
  return rule;
};

export const deleteRule = async ({ gymId, id }) => {
  const rule = await RetentionRule.findByPk(id);
  if (!rule || String(rule.gymId) !== String(gymId)) throw ApiError.notFound('Rule not found');
  await rule.destroy();
};

const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
};

export const runRetentionRules = async ({ gymId }) => {
  const rules = await RetentionRule.findAll({ where: { gymId, isActive: true } });
  const results = [];

  for (const rule of rules) {
    if (rule.triggerType === RETENTION_TRIGGER.NO_ATTENDANCE_DAYS) {
      const cutoff = daysAgo(rule.triggerDays);
      const subs = await Subscription.findAll({
        where: { gymId, status: SUBSCRIPTION_STATUS.ACTIVE },
      });
      for (const sub of subs) {
        const last = await Attendance.findOne({
          where: { gymId, memberId: sub.memberId },
          order: [['checkInAt', 'DESC']],
        });
        if (last && last.checkInAt > cutoff) continue;

        const member = await Member.findByPk(sub.memberId, { include: [{ model: User }] });
        if (!member?.User) continue;

        const msg = rule.messageTemplate || `We miss you! It's been ${rule.triggerDays} days since your last visit.`;
        if (rule.actionType === RETENTION_ACTION.PUSH) {
          await pushService.sendPushToUsers({ userIds: [member.User.id], title: 'GymKhana', body: msg });
        } else if (rule.actionType === RETENTION_ACTION.EMAIL && member.User.email) {
          await emailService.send({ to: member.User.email, subject: 'We miss you at the gym', text: msg });
        }
        results.push({ ruleId: rule.id, memberId: sub.memberId, action: rule.actionType });
      }
    }

    if (rule.triggerType === RETENTION_TRIGGER.SUBSCRIPTION_EXPIRING_DAYS) {
      const target = new Date();
      target.setDate(target.getDate() + rule.triggerDays);
      const targetStr = target.toISOString().slice(0, 10);
      const subs = await Subscription.findAll({
        where: { gymId, status: SUBSCRIPTION_STATUS.ACTIVE, endsAt: targetStr },
      });
      for (const sub of subs) {
        const member = await Member.findByPk(sub.memberId, { include: [{ model: User }] });
        if (!member?.User) continue;
        const msg = rule.messageTemplate || `Your membership expires in ${rule.triggerDays} days. Renew today!`;
        if (rule.actionType === RETENTION_ACTION.PUSH) {
          await pushService.sendPushToUsers({ userIds: [member.User.id], title: 'Renewal reminder', body: msg });
        }
        results.push({ ruleId: rule.id, memberId: sub.memberId, action: rule.actionType });
      }
    }

    if (rule.triggerType === RETENTION_TRIGGER.TRIAL_ENDING_DAYS) {
      const target = new Date();
      target.setDate(target.getDate() + rule.triggerDays);
      const targetStr = target.toISOString().slice(0, 10);
      const subs = await Subscription.findAll({
        where: { gymId, status: SUBSCRIPTION_STATUS.ACTIVE, isTrial: true, endsAt: targetStr },
      });
      for (const sub of subs) {
        const member = await Member.findByPk(sub.memberId, { include: [{ model: User }] });
        if (!member?.User) continue;
        const msg = rule.messageTemplate || `Your trial ends in ${rule.triggerDays} day(s). Upgrade to continue!`;
        if (rule.actionType === RETENTION_ACTION.PUSH) {
          await pushService.sendPushToUsers({ userIds: [member.User.id], title: 'Trial ending', body: msg });
        } else if (rule.actionType === RETENTION_ACTION.NOTIFY_STAFF) {
          results.push({ ruleId: rule.id, memberId: sub.memberId, action: 'notify_staff', message: msg });
        }
      }
    }
  }

  return { processed: results.length, results };
};
