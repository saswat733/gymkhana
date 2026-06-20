'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('trainer_members', {
      trainer_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'trainers', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        primaryKey: true,
      },
      member_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'members', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        primaryKey: true,
      },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.addIndex('trainer_members', ['trainer_id'], { name: 'trainer_members_trainer_id_idx' });
    await queryInterface.addIndex('trainer_members', ['member_id'], { name: 'trainer_members_member_id_idx' });
  },

  async down (queryInterface, _Sequelize) {
    await queryInterface.dropTable('trainer_members');
  }
};

