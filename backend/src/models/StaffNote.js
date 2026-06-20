import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

export const STAFF_NOTE_ENTITY = Object.freeze({
  MEMBER: 'member',
  LEAD: 'lead',
  SUBSCRIPTION: 'subscription',
});

export class StaffNote extends Model {}

StaffNote.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    gymId: { type: DataTypes.UUID, allowNull: false, field: 'gym_id' },
    entityType: {
      type: DataTypes.STRING(20),
      allowNull: false,
      field: 'entity_type',
      validate: { isIn: [Object.values(STAFF_NOTE_ENTITY)] },
    },
    entityId: { type: DataTypes.UUID, allowNull: false, field: 'entity_id' },
    authorUserId: { type: DataTypes.UUID, allowNull: false, field: 'author_user_id' },
    body: { type: DataTypes.TEXT, allowNull: false },
    pinned: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  },
  {
    sequelize,
    modelName: 'StaffNote',
    tableName: 'staff_notes',
    indexes: [{ fields: ['gym_id', 'entity_type', 'entity_id'] }],
  },
);
