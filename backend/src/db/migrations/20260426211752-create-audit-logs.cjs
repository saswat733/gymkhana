'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('audit_logs', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      actor_user_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      action: { type: Sequelize.STRING(120), allowNull: false },
      entity_type: { type: Sequelize.STRING(80), allowNull: false },
      entity_id: { type: Sequelize.UUID, allowNull: true },
      meta: { type: Sequelize.JSON, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.addIndex('audit_logs', ['actor_user_id'], { name: 'audit_logs_actor_user_id_idx' });
    await queryInterface.addIndex('audit_logs', ['entity_type', 'entity_id'], { name: 'audit_logs_entity_idx' });
    await queryInterface.addIndex('audit_logs', ['created_at'], { name: 'audit_logs_created_at_idx' });
  },

  async down (queryInterface, _Sequelize) {
    await queryInterface.dropTable('audit_logs');
  }
};

