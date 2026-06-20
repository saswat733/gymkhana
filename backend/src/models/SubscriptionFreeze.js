import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

export const FREEZE_STATUS = Object.freeze({
  ACTIVE: 'active',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
});

export class SubscriptionFreeze extends Model {}

SubscriptionFreeze.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    gymId: { type: DataTypes.UUID, allowNull: false, field: 'gym_id' },
    subscriptionId: { type: DataTypes.UUID, allowNull: false, field: 'subscription_id' },
    memberId: { type: DataTypes.UUID, allowNull: false, field: 'member_id' },
    startsAt: { type: DataTypes.DATEONLY, allowNull: false, field: 'starts_at' },
    endsAt: { type: DataTypes.DATEONLY, allowNull: false, field: 'ends_at' },
    reason: { type: DataTypes.STRING(500), allowNull: true },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: FREEZE_STATUS.ACTIVE,
      validate: { isIn: [Object.values(FREEZE_STATUS)] },
    },
    daysFrozen: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, field: 'days_frozen' },
    createdByUserId: { type: DataTypes.UUID, allowNull: true, field: 'created_by_user_id' },
  },
  { sequelize, modelName: 'SubscriptionFreeze', tableName: 'subscription_freezes' },
);
