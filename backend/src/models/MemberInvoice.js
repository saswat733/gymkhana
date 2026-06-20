import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

export class MemberInvoice extends Model {}

MemberInvoice.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    gymId: { type: DataTypes.UUID, allowNull: false, field: 'gym_id' },
    paymentId: { type: DataTypes.UUID, allowNull: false, unique: true, field: 'payment_id' },
    invoiceNumber: { type: DataTypes.STRING(64), allowNull: false, field: 'invoice_number' },
    buyerName: { type: DataTypes.STRING(200), allowNull: false, field: 'buyer_name' },
    buyerEmail: { type: DataTypes.STRING(160), allowNull: true, field: 'buyer_email' },
    buyerGstin: { type: DataTypes.STRING(20), allowNull: true, field: 'buyer_gstin' },
    subtotalCents: { type: DataTypes.INTEGER, allowNull: false, field: 'subtotal_cents' },
    gstPercent: { type: DataTypes.DECIMAL(5, 2), allowNull: true, field: 'gst_percent' },
    gstCents: { type: DataTypes.INTEGER, allowNull: true, field: 'gst_cents' },
    totalCents: { type: DataTypes.INTEGER, allowNull: false, field: 'total_cents' },
    currency: { type: DataTypes.STRING(3), allowNull: false, defaultValue: 'INR' },
    issuedAt: { type: DataTypes.DATE, allowNull: false, field: 'issued_at' },
  },
  {
    sequelize,
    modelName: 'MemberInvoice',
    tableName: 'member_invoices',
    indexes: [
      { unique: true, fields: ['gym_id', 'invoice_number'] },
      { unique: true, fields: ['payment_id'] },
    ],
  },
);
