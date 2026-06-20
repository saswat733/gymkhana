import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

export class FamilyGroup extends Model {}

FamilyGroup.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    gymId: { type: DataTypes.UUID, allowNull: false, field: 'gym_id' },
    name: { type: DataTypes.STRING(160), allowNull: false },
    payerMemberId: { type: DataTypes.UUID, allowNull: false, field: 'payer_member_id' },
  },
  { sequelize, modelName: 'FamilyGroup', tableName: 'family_groups' },
);
