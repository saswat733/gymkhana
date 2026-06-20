import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

export const ANNOUNCEMENT_AUDIENCE = Object.freeze({
  ALL: 'all',
  MEMBERS: 'members',
  TRAINERS: 'trainers',
  ADMINS: 'admins',
});

export class Announcement extends Model {}

Announcement.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    title: { type: DataTypes.STRING(160), allowNull: false },
    body: { type: DataTypes.TEXT, allowNull: false },
    audience: {
      type: DataTypes.ENUM(...Object.values(ANNOUNCEMENT_AUDIENCE)),
      allowNull: false,
      defaultValue: ANNOUNCEMENT_AUDIENCE.ALL,
    },
    isPublished: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false, field: 'is_published' },
    publishAt: { type: DataTypes.DATE, allowNull: true, field: 'publish_at' },
    expiresAt: { type: DataTypes.DATE, allowNull: true, field: 'expires_at' },
    createdByUserId: { type: DataTypes.UUID, allowNull: true, field: 'created_by_user_id' },
    gymId: { type: DataTypes.UUID, allowNull: true },
    createdAt: { type: DataTypes.DATE, field: 'created_at' },
    updatedAt: { type: DataTypes.DATE, field: 'updated_at' },
  },
  {
    sequelize,
    modelName: 'Announcement',
    tableName: 'announcements',
    indexes: [
      { fields: ['is_published'] },
      { fields: ['audience'] },
      { fields: ['publish_at'] },
      { fields: ['expires_at'] },
    ],
  },
);

