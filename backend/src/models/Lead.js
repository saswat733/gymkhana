import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

export const LEAD_STATUS = Object.freeze({
  CREATED: 'created',
  TRIAL_SCHEDULED: 'trial_scheduled',
  TRIAL_COMPLETED: 'trial_completed',
  CONVERTED: 'converted',
  LOST: 'lost',
});

export class Lead extends Model {}

Lead.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    gymId: { type: DataTypes.UUID, allowNull: false, field: 'gym_id' },
    name: { type: DataTypes.STRING(160), allowNull: false },
    phone: { type: DataTypes.STRING(30), allowNull: true },
    email: { type: DataTypes.STRING(160), allowNull: true },
    source: { type: DataTypes.STRING(80), allowNull: true },
    status: {
      type: DataTypes.STRING(30),
      allowNull: false,
      defaultValue: LEAD_STATUS.CREATED,
      validate: { isIn: [Object.values(LEAD_STATUS)] },
    },
    notes: { type: DataTypes.TEXT, allowNull: true },
    followUpAt: { type: DataTypes.DATE, allowNull: true, field: 'follow_up_at' },
    followUpNote: { type: DataTypes.STRING(500), allowNull: true, field: 'follow_up_note' },
    assignedToUserId: { type: DataTypes.UUID, allowNull: true, field: 'assigned_to_user_id' },
    convertedMemberId: { type: DataTypes.UUID, allowNull: true, field: 'converted_member_id' },
    trialSubscriptionId: { type: DataTypes.UUID, allowNull: true, field: 'trial_subscription_id' },
  },
  { sequelize, modelName: 'Lead', tableName: 'leads' },
);
