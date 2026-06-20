import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

export const SAAS_INVOICE_STATUS = {
  DRAFT: 'draft',
  ISSUED: 'issued',
  PAID: 'paid',
  VOID: 'void',
};

export class SaasInvoice extends Model {}

SaasInvoice.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    gymId: { type: DataTypes.UUID, allowNull: false, field: 'gym_id' },
    gymSaasSubscriptionId: { type: DataTypes.UUID, allowNull: false, field: 'gym_saas_subscription_id' },

    invoiceNumber: { type: DataTypes.STRING(64), allowNull: false, field: 'invoice_number' },
    status: {
      type: DataTypes.ENUM(...Object.values(SAAS_INVOICE_STATUS)),
      allowNull: false,
      defaultValue: SAAS_INVOICE_STATUS.ISSUED,
    },

    currency: { type: DataTypes.STRING(3), allowNull: false, defaultValue: 'INR' },
    amountCents: { type: DataTypes.INTEGER, allowNull: false, field: 'amount_cents' },

    // GST fields (Phase B.2)
    gstPercent: { type: DataTypes.DECIMAL(5, 2), allowNull: true, field: 'gst_percent' },
    gstCents: { type: DataTypes.INTEGER, allowNull: true, field: 'gst_cents' },
    totalCents: { type: DataTypes.INTEGER, allowNull: false, field: 'total_cents' },

    issuedAt: { type: DataTypes.DATE, allowNull: false, field: 'issued_at' },
    dueAt: { type: DataTypes.DATE, allowNull: true, field: 'due_at' },
    paidAt: { type: DataTypes.DATE, allowNull: true, field: 'paid_at' },
    notes: { type: DataTypes.STRING(1000), allowNull: true },
    razorpayOrderId: { type: DataTypes.STRING(64), allowNull: true, field: 'razorpay_order_id' },
  },
  {
    sequelize,
    modelName: 'SaasInvoice',
    tableName: 'saas_invoices',
    indexes: [
      { unique: true, fields: ['gym_id', 'invoice_number'], name: 'saas_invoices_gym_invoice_unique' },
      { fields: ['gym_id'] },
      { fields: ['status'] },
      { fields: ['issued_at'] },
    ],
  },
);

