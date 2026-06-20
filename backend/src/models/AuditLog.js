import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

export class AuditLog extends Model {}

AuditLog.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    actorUserId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    action: {
      type: DataTypes.STRING(120),
      allowNull: false,
    },
    entityType: {
      type: DataTypes.STRING(80),
      allowNull: false,
    },
    entityId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    meta: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    gymId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'AuditLog',
    tableName: 'audit_logs',
    indexes: [
      { fields: ['actor_user_id'] },
      { fields: ['entity_type', 'entity_id'] },
      { fields: ['created_at'] },
    ],
  },
);

