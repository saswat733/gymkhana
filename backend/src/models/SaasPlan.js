import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

export const SAAS_BILLING_CYCLE = {
  MONTHLY: 'monthly',
  YEARLY: 'yearly',
};

export class SaasPlan extends Model {}

SaasPlan.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    code: { type: DataTypes.STRING(40), allowNull: false, unique: true },
    name: { type: DataTypes.STRING(120), allowNull: false },
    description: { type: DataTypes.STRING(400), allowNull: true },
    isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true, field: 'is_active' },

    // Prices are in INR paise/cents for consistency with member payments.
    priceMonthlyCents: { type: DataTypes.INTEGER, allowNull: false, field: 'price_monthly_cents' },
    priceYearlyCents: { type: DataTypes.INTEGER, allowNull: false, field: 'price_yearly_cents' },
    currency: { type: DataTypes.STRING(3), allowNull: false, defaultValue: 'INR' },

    // Usage limits (simple Phase B.1)
    limitMembers: { type: DataTypes.INTEGER, allowNull: true, field: 'limit_members' },
    limitTrainers: { type: DataTypes.INTEGER, allowNull: true, field: 'limit_trainers' },
  },
  {
    sequelize,
    modelName: 'SaasPlan',
    tableName: 'saas_plans',
    indexes: [{ unique: true, fields: ['code'] }, { fields: ['is_active'] }],
  },
);

