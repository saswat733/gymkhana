import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

export const ATTENDANCE_SOURCE = Object.freeze({
  MANUAL: 'manual',
  QR: 'qr',
  BIOMETRIC: 'biometric',
});

export class Attendance extends Model {}

Attendance.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    memberId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    checkInAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    checkOutAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    source: {
      type: DataTypes.STRING(30),
      allowNull: false,
      defaultValue: ATTENDANCE_SOURCE.MANUAL,
      validate: { isIn: [Object.values(ATTENDANCE_SOURCE)] },
    },
    gymId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    zoneId: { type: DataTypes.UUID, allowNull: true, field: 'zone_id' },
  },
  {
    sequelize,
    modelName: 'Attendance',
    tableName: 'attendance',
    indexes: [
      { fields: ['member_id'] },
      { fields: ['check_in_at'] },
    ],
  },
);

