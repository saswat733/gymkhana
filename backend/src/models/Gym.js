import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

export class Gym extends Model {}

Gym.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING(160), allowNull: false },
    slug: { type: DataTypes.STRING(80), allowNull: false, unique: true },
    timezone: { type: DataTypes.STRING(64), allowNull: false, defaultValue: 'Asia/Kolkata' },
    currency: { type: DataTypes.STRING(3), allowNull: false, defaultValue: 'INR' },
    isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true, field: 'is_active' },

    // Phase B.2 (Invoice/GST): optional until configured by gym owner.
    legalName: { type: DataTypes.STRING(200), allowNull: true, field: 'legal_name' },
    gstin: { type: DataTypes.STRING(20), allowNull: true },
    billingAddressLine1: { type: DataTypes.STRING(200), allowNull: true, field: 'billing_address_line1' },
    billingAddressLine2: { type: DataTypes.STRING(200), allowNull: true, field: 'billing_address_line2' },
    billingCity: { type: DataTypes.STRING(80), allowNull: true, field: 'billing_city' },
    billingState: { type: DataTypes.STRING(80), allowNull: true, field: 'billing_state' },
    billingPincode: { type: DataTypes.STRING(12), allowNull: true, field: 'billing_pincode' },

    // Phase B.1/B.2: invoice numbering per gym
    saasInvoicePrefix: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'GK', field: 'saas_invoice_prefix' },
    saasInvoiceSeq: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1, field: 'saas_invoice_seq' },
    memberInvoicePrefix: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'INV', field: 'member_invoice_prefix' },
    memberInvoiceSeq: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1, field: 'member_invoice_seq' },
    defaultGstPercent: { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 18, field: 'default_gst_percent' },

    qrSecret: { type: DataTypes.STRING(64), allowNull: true, field: 'qr_secret' },
    logoUrl: { type: DataTypes.STRING(500), allowNull: true, field: 'logo_url' },
    brandPrimaryColor: { type: DataTypes.STRING(20), allowNull: true, field: 'brand_primary_color' },
    brandSecondaryColor: { type: DataTypes.STRING(20), allowNull: true, field: 'brand_secondary_color' },
    customDomain: { type: DataTypes.STRING(200), allowNull: true, field: 'custom_domain' },
  },
  {
    sequelize,
    modelName: 'Gym',
    tableName: 'gyms',
    indexes: [{ unique: true, fields: ['slug'] }, { fields: ['is_active'] }],
  },
);

