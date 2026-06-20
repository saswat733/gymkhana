'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('plans', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      name: { type: Sequelize.STRING(120), allowNull: false, unique: true },
      duration_months: { type: Sequelize.INTEGER, allowNull: false },
      price_cents: { type: Sequelize.INTEGER, allowNull: false },
      perks: { type: Sequelize.TEXT, allowNull: true },
      is_active: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.addIndex('plans', ['name'], { unique: true, name: 'plans_name_unique' });
    await queryInterface.addIndex('plans', ['is_active'], { name: 'plans_is_active_idx' });
  },

  async down (queryInterface, _Sequelize) {
    await queryInterface.dropTable('plans');
  }
};

