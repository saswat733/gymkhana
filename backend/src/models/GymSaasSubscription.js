import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';
import { SAAS_BILLING_CYCLE } from './SaasPlan.js';

export const GYM_SAAS_SUBSCRIPTION_STATUS = {
  TRIALING: 'trialing',
  ACTIVE: 'active',
  PAST_DUE: 'past_due',
  CANCELLED: 'cancelled',
};

export class GymSaasSubscription extends Model {}

GymSaasSubscription.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    gymId: { type: DataTypes.UUID, allowNull: false, field: 'gym_id' },
    saasPlanId: { type: DataTypes.UUID, allowNull: false, field: 'saas_plan_id' },

    status: {
      type: DataTypes.ENUM(...Object.values(GYM_SAAS_SUBSCRIPTION_STATUS)),
      allowNull: false,
      defaultValue: GYM_SAAS_SUBSCRIPTION_STATUS.TRIALING,
    },
    billingCycle: {
      type: DataTypes.ENUM(...Object.values(SAAS_BILLING_CYCLE)),
      allowNull: false,
      defaultValue: SAAS_BILLING_CYCLE.MONTHLY,
      field: 'billing_cycle',
    },

    startsAt: { type: DataTypes.DATE, allowNull: false, field: 'starts_at' },
    trialEndsAt: { type: DataTypes.DATE, allowNull: true, field: 'trial_ends_at' },
    currentPeriodEndsAt: { type: DataTypes.DATE, allowNull: true, field: 'current_period_ends_at' },
    cancelledAt: { type: DataTypes.DATE, allowNull: true, field: 'cancelled_at' },
  },
  {
    sequelize,
    modelName: 'GymSaasSubscription',
    tableName: 'gym_saas_subscriptions',
    indexes: [{ unique: true, fields: ['gym_id'], name: 'gym_saas_subscriptions_gym_unique' }, { fields: ['status'] }],
  },
);

