'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('saas_plans', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true, allowNull: false },
      code: { type: Sequelize.STRING(40), allowNull: false, unique: true },
      name: { type: Sequelize.STRING(120), allowNull: false },
      description: { type: Sequelize.STRING(400), allowNull: true },
      is_active: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      price_monthly_cents: { type: Sequelize.INTEGER, allowNull: false },
      price_yearly_cents: { type: Sequelize.INTEGER, allowNull: false },
      currency: { type: Sequelize.STRING(3), allowNull: false, defaultValue: 'INR' },
      limit_members: { type: Sequelize.INTEGER, allowNull: true },
      limit_trainers: { type: Sequelize.INTEGER, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.addIndex('saas_plans', ['code'], { unique: true, name: 'saas_plans_code_unique' });
    await queryInterface.addIndex('saas_plans', ['is_active'], { name: 'saas_plans_is_active_idx' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('saas_plans');
  },
};

