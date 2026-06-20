import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

export class AttendanceZone extends Model {}

AttendanceZone.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    gymId: { type: DataTypes.UUID, allowNull: false, field: 'gym_id' },
    name: { type: DataTypes.STRING(120), allowNull: false },
    slug: { type: DataTypes.STRING(80), allowNull: false },
    isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true, field: 'is_active' },
    isDefault: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false, field: 'is_default' },
    sortOrder: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, field: 'sort_order' },
  },
  { sequelize, modelName: 'AttendanceZone', tableName: 'attendance_zones' },
);
