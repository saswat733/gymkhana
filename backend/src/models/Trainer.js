import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

export class Trainer extends Model {}

Trainer.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
    },
    bio: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    specialization: {
      type: DataTypes.STRING(120),
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
  },
  {
    sequelize,
    modelName: 'Trainer',
    tableName: 'trainers',
    indexes: [
      { unique: true, fields: ['user_id'] },
      { fields: ['is_active'] },
    ],
  },
);

