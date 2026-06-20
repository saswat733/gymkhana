'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('trainers', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        unique: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      bio: { type: Sequelize.TEXT, allowNull: true },
      specialization: { type: Sequelize.STRING(120), allowNull: true },
      is_active: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: 1 },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.addIndex('trainers', ['user_id'], { unique: true, name: 'trainers_user_id_unique' });
    await queryInterface.addIndex('trainers', ['is_active'], { name: 'trainers_is_active_idx' });
  },

  async down (queryInterface, _Sequelize) {
    await queryInterface.dropTable('trainers');
  }
};

