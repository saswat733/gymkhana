'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('push_tokens', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true, allowNull: false },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      gym_id: { type: Sequelize.UUID, allowNull: true },
      token: { type: Sequelize.STRING(255), allowNull: false },
      platform: { type: Sequelize.STRING(20), allowNull: true },
      is_active: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.addIndex('push_tokens', ['user_id', 'token'], { unique: true, name: 'push_tokens_user_token_unique' });
    await queryInterface.addIndex('push_tokens', ['gym_id'], { name: 'push_tokens_gym_idx' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('push_tokens');
  },
};
