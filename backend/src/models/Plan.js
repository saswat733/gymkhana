import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

export class Plan extends Model {}

Plan.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(120),
      allowNull: false,
      unique: true,
      validate: { notEmpty: true, len: [2, 120] },
      set(v) { this.setDataValue('name', String(v).trim()); },
    },
    durationMonths: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { min: 1 },
    },
    priceCents: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { min: 0 },
    },
    perks: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    gymId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    isTrial: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false, field: 'is_trial' },
    trialDays: { type: DataTypes.INTEGER, allowNull: true, field: 'trial_days' },
    trialVisitsLimit: { type: DataTypes.INTEGER, allowNull: true, field: 'trial_visits_limit' },
  },
  {
    sequelize,
    modelName: 'Plan',
    tableName: 'plans',
    indexes: [
      { unique: true, fields: ['name'] },
      { fields: ['is_active'] },
    ],
  },
);

