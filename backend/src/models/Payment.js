import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

export const PAYMENT_STATUS = Object.freeze({
  PAID: 'paid',
  PENDING: 'pending',
  FAILED: 'failed',
  REFUNDED: 'refunded',
});

export class Payment extends Model {}

Payment.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    subscriptionId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    amountCents: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { min: 0 },
    },
    currency: {
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: 'INR',
      set(v) { this.setDataValue('currency', String(v).trim().toUpperCase()); },
    },
    method: {
      type: DataTypes.STRING(30),
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING(30),
      allowNull: false,
      defaultValue: PAYMENT_STATUS.PAID,
      validate: { isIn: [Object.values(PAYMENT_STATUS)] },
    },
    paidAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    gatewayRef: {
      type: DataTypes.STRING(120),
      allowNull: true,
    },
    razorpayOrderId: {
      type: DataTypes.STRING(64),
      allowNull: true,
      field: 'razorpay_order_id',
    },
    razorpayPaymentId: {
      type: DataTypes.STRING(64),
      allowNull: true,
      field: 'razorpay_payment_id',
    },
    idempotencyKey: {
      type: DataTypes.STRING(120),
      allowNull: true,
      unique: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    gymId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Payment',
    tableName: 'payments',
    indexes: [
      { fields: ['subscription_id'] },
      { fields: ['paid_at'] },
      { unique: true, fields: ['idempotency_key'] },
    ],
  },
);

