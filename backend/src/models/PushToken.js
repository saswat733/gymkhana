import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

export class PushToken extends Model {}

PushToken.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    userId: { type: DataTypes.UUID, allowNull: false, field: 'user_id' },
    gymId: { type: DataTypes.UUID, allowNull: true, field: 'gym_id' },
    token: { type: DataTypes.STRING(255), allowNull: false },
    platform: { type: DataTypes.STRING(20), allowNull: true },
    isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true, field: 'is_active' },
  },
  {
    sequelize,
    modelName: 'PushToken',
    tableName: 'push_tokens',
    indexes: [{ unique: true, fields: ['user_id', 'token'] }],
  },
);
