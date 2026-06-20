import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

export const RETENTION_TRIGGER = Object.freeze({
  NO_ATTENDANCE_DAYS: 'no_attendance_days',
  SUBSCRIPTION_EXPIRING_DAYS: 'subscription_expiring_days',
  TRIAL_ENDING_DAYS: 'trial_ending_days',
});

export const RETENTION_ACTION = Object.freeze({
  PUSH: 'push',
  EMAIL: 'email',
  NOTIFY_STAFF: 'notify_staff',
});

export class RetentionRule extends Model {}

RetentionRule.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    gymId: { type: DataTypes.UUID, allowNull: false, field: 'gym_id' },
    name: { type: DataTypes.STRING(160), allowNull: false },
    triggerType: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'trigger_type',
      validate: { isIn: [Object.values(RETENTION_TRIGGER)] },
    },
    triggerDays: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 3, field: 'trigger_days' },
    actionType: {
      type: DataTypes.STRING(30),
      allowNull: false,
      defaultValue: RETENTION_ACTION.PUSH,
      field: 'action_type',
      validate: { isIn: [Object.values(RETENTION_ACTION)] },
    },
    messageTemplate: { type: DataTypes.TEXT, allowNull: true, field: 'message_template' },
    isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true, field: 'is_active' },
  },
  { sequelize, modelName: 'RetentionRule', tableName: 'retention_rules' },
);
