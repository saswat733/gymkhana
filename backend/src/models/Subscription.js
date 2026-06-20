import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

export const SUBSCRIPTION_STATUS = Object.freeze({
  ACTIVE: 'active',
  EXPIRED: 'expired',
  CANCELLED: 'cancelled',
});

export class Subscription extends Model {}

Subscription.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    memberId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    planId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    startsAt: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    endsAt: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING(30),
      allowNull: false,
      defaultValue: SUBSCRIPTION_STATUS.ACTIVE,
      validate: { isIn: [Object.values(SUBSCRIPTION_STATUS)] },
    },
    autoRenew: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    cancelledAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    gymId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    isTrial: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false, field: 'is_trial' },
    trialVisitsLimit: { type: DataTypes.INTEGER, allowNull: true, field: 'trial_visits_limit' },
    trialVisitsUsed: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, field: 'trial_visits_used' },
    familyGroupId: { type: DataTypes.UUID, allowNull: true, field: 'family_group_id' },
  },
  {
    sequelize,
    modelName: 'Subscription',
    tableName: 'subscriptions',
    indexes: [
      { fields: ['member_id'] },
      { fields: ['plan_id'] },
      { fields: ['status'] },
      { fields: ['ends_at'] },
    ],
  },
);

