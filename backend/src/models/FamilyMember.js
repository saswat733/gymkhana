import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

export const FAMILY_RELATIONSHIP = Object.freeze({
  PARENT: 'parent',
  CHILD: 'child',
  SPOUSE: 'spouse',
  MEMBER: 'member',
});

export class FamilyMember extends Model {}

FamilyMember.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    familyGroupId: { type: DataTypes.UUID, allowNull: false, field: 'family_group_id' },
    memberId: { type: DataTypes.UUID, allowNull: false, field: 'member_id' },
    relationship: {
      type: DataTypes.STRING(30),
      allowNull: false,
      defaultValue: FAMILY_RELATIONSHIP.MEMBER,
      validate: { isIn: [Object.values(FAMILY_RELATIONSHIP)] },
    },
  },
  { sequelize, modelName: 'FamilyMember', tableName: 'family_members' },
);
