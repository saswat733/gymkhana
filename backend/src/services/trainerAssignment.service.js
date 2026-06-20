import { Member, Trainer, User } from '../models/index.js';
import { ApiError } from '../utils/ApiError.js';

export const assignMemberToTrainer = async ({ gymId, trainerId, memberId }) => {
  if (!gymId) throw ApiError.badRequest('gymId is required');
  const trainer = await Trainer.findByPk(trainerId);
  if (!trainer || !trainer.isActive) throw ApiError.notFound('Trainer not found or inactive');
  if (String(trainer.gymId) !== String(gymId)) throw ApiError.forbidden();

  const member = await Member.findByPk(memberId);
  if (!member || !member.isActive) throw ApiError.notFound('Member not found or inactive');
  if (String(member.gymId) !== String(gymId)) throw ApiError.forbidden();

  await trainer.addMember(member);
  return { trainerId, memberId };
};

export const unassignMemberFromTrainer = async ({ gymId, trainerId, memberId }) => {
  if (!gymId) throw ApiError.badRequest('gymId is required');
  const trainer = await Trainer.findByPk(trainerId);
  if (!trainer) throw ApiError.notFound('Trainer not found');
  if (String(trainer.gymId) !== String(gymId)) throw ApiError.forbidden();

  const member = await Member.findByPk(memberId);
  if (!member) throw ApiError.notFound('Member not found');
  if (String(member.gymId) !== String(gymId)) throw ApiError.forbidden();

  await trainer.removeMember(member);
  return { trainerId, memberId };
};

export const listMembersForTrainer = async ({ gymId, trainerId }) => {
  if (!gymId) throw ApiError.badRequest('gymId is required');
  const trainer = await Trainer.findByPk(trainerId, {
    include: [{ model: Member, include: [{ model: User }], where: { gymId }, required: false }],
  });
  if (!trainer) throw ApiError.notFound('Trainer not found');
  if (String(trainer.gymId) !== String(gymId)) throw ApiError.forbidden();
  const members = trainer.Members ?? [];
  return members;
};

