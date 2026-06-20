'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('workout_plans', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true, allowNull: false },
      member_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'members', key: 'id' },
        onDelete: 'CASCADE',
      },
      trainer_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'trainers', key: 'id' },
        onDelete: 'SET NULL',
      },
      title: { type: Sequelize.STRING(160), allowNull: false },
      notes: { type: Sequelize.TEXT, allowNull: true },
      // JSON structure: array of workouts/exercises; kept flexible for Phase 6 prototype.
      plan_json: { type: Sequelize.JSON, allowNull: true },
      is_active: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.addIndex('workout_plans', ['member_id'], { name: 'wp_member_id_idx' });
    await queryInterface.addIndex('workout_plans', ['trainer_id'], { name: 'wp_trainer_id_idx' });
    await queryInterface.addIndex('workout_plans', ['is_active'], { name: 'wp_is_active_idx' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('workout_plans');
  },
};

