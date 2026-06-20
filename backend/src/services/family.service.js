import { FamilyGroup, FamilyMember, Member, User } from '../models/index.js';
import { ApiError } from '../utils/ApiError.js';

export const createFamilyGroup = async ({ gymId, name, payerMemberId, members }) => {
  const payer = await Member.findByPk(payerMemberId);
  if (!payer || String(payer.gymId) !== String(gymId)) throw ApiError.notFound('Payer member not found');

  const group = await FamilyGroup.create({ gymId, name, payerMemberId });
  const rows = [{ familyGroupId: group.id, memberId: payerMemberId, relationship: 'parent' }];
  for (const m of members ?? []) {
    const mem = await Member.findByPk(m.memberId);
    if (!mem || String(mem.gymId) !== String(gymId)) throw ApiError.badRequest(`Invalid member ${m.memberId}`);
    rows.push({ familyGroupId: group.id, memberId: m.memberId, relationship: m.relationship ?? 'member' });
  }
  await FamilyMember.bulkCreate(rows);
  return group;
};

export const listFamilyGroups = async ({ gymId }) => {
  const groups = await FamilyGroup.findAll({ where: { gymId }, order: [['createdAt', 'DESC']] });
  const result = [];
  for (const g of groups) {
    const links = await FamilyMember.findAll({ where: { familyGroupId: g.id } });
    const memberIds = links.map((l) => l.memberId);
    const members = await Member.findAll({
      where: { id: memberIds },
      include: [{ model: User }],
    });
    result.push({
      group: g,
      members: links.map((l) => ({
        ...l.get(),
        member: members.find((m) => m.id === l.memberId),
      })),
    });
  }
  return result;
};
