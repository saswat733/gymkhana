import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

export const SHIFT_TYPE = Object.freeze({
  MORNING: 'morning',
  EVENING: 'evening',
  CUSTOM: 'custom',
});

export class StaffShift extends Model {}

StaffShift.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    gymId: { type: DataTypes.UUID, allowNull: false, field: 'gym_id' },
    userId: { type: DataTypes.UUID, allowNull: false, field: 'user_id' },
    shiftDate: { type: DataTypes.DATEONLY, allowNull: false, field: 'shift_date' },
    shiftType: {
      type: DataTypes.STRING(30),
      allowNull: false,
      defaultValue: SHIFT_TYPE.MORNING,
      field: 'shift_type',
      validate: { isIn: [Object.values(SHIFT_TYPE)] },
    },
    startsAt: { type: DataTypes.TIME, allowNull: true, field: 'starts_at' },
    endsAt: { type: DataTypes.TIME, allowNull: true, field: 'ends_at' },
    notes: { type: DataTypes.STRING(500), allowNull: true },
  },
  { sequelize, modelName: 'StaffShift', tableName: 'staff_shifts' },
);
