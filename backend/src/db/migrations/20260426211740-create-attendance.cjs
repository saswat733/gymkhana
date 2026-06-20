'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('attendance', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      member_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'members', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      check_in_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      check_out_at: { type: Sequelize.DATE, allowNull: true },
      source: { type: Sequelize.STRING(30), allowNull: false, defaultValue: 'manual' },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.addIndex('attendance', ['member_id'], { name: 'attendance_member_id_idx' });
    await queryInterface.addIndex('attendance', ['check_in_at'], { name: 'attendance_check_in_at_idx' });
  },

  async down (queryInterface, _Sequelize) {
    await queryInterface.dropTable('attendance');
  }
};

