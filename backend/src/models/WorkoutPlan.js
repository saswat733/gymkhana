import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

export class WorkoutPlan extends Model {}

WorkoutPlan.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    memberId: { type: DataTypes.UUID, allowNull: false, field: 'member_id' },
    trainerId: { type: DataTypes.UUID, allowNull: true, field: 'trainer_id' },
    title: { type: DataTypes.STRING(160), allowNull: false },
    notes: { type: DataTypes.TEXT, allowNull: true },
    planJson: { type: DataTypes.JSON, allowNull: true, field: 'plan_json' },
    isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true, field: 'is_active' },
    gymId: { type: DataTypes.UUID, allowNull: true },
    createdAt: { type: DataTypes.DATE, field: 'created_at' },
    updatedAt: { type: DataTypes.DATE, field: 'updated_at' },
  },
  {
    sequelize,
    modelName: 'WorkoutPlan',
    tableName: 'workout_plans',
    indexes: [{ fields: ['member_id'] }, { fields: ['trainer_id'] }, { fields: ['is_active'] }],
  },
);

