import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

export const PAYMENT_INTENT_STATUS = Object.freeze({
  CREATED: 'created',
  CAPTURED: 'captured',
  FAILED: 'failed',
  EXPIRED: 'expired',
});

export class PaymentIntent extends Model {}

PaymentIntent.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    gymId: { type: DataTypes.UUID, allowNull: false, field: 'gym_id' },
    memberId: { type: DataTypes.UUID, allowNull: false, field: 'member_id' },
    planId: { type: DataTypes.UUID, allowNull: false, field: 'plan_id' },
    subscriptionId: { type: DataTypes.UUID, allowNull: true, field: 'subscription_id' },
    amountCents: { type: DataTypes.INTEGER, allowNull: false, field: 'amount_cents' },
    currency: {
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: 'INR',
      set(v) { this.setDataValue('currency', String(v).trim().toUpperCase()); },
    },
    razorpayOrderId: { type: DataTypes.STRING(64), allowNull: false, unique: true, field: 'razorpay_order_id' },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: PAYMENT_INTENT_STATUS.CREATED,
      validate: { isIn: [Object.values(PAYMENT_INTENT_STATUS)] },
    },
  },
  {
    sequelize,
    modelName: 'PaymentIntent',
    tableName: 'payment_intents',
    indexes: [
      { fields: ['gym_id', 'member_id'] },
      { unique: true, fields: ['razorpay_order_id'] },
    ],
  },
);
