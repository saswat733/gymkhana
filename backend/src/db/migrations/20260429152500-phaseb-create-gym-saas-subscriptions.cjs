'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('gym_saas_subscriptions', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true, allowNull: false },
      gym_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'gyms', key: 'id' },
        onDelete: 'CASCADE',
      },
      saas_plan_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'saas_plans', key: 'id' },
        onDelete: 'RESTRICT',
      },
      status: {
        type: Sequelize.ENUM('trialing', 'active', 'past_due', 'cancelled'),
        allowNull: false,
        defaultValue: 'trialing',
      },
      billing_cycle: {
        type: Sequelize.ENUM('monthly', 'yearly'),
        allowNull: false,
        defaultValue: 'monthly',
      },
      starts_at: { type: Sequelize.DATE, allowNull: false },
      trial_ends_at: { type: Sequelize.DATE, allowNull: true },
      current_period_ends_at: { type: Sequelize.DATE, allowNull: true },
      cancelled_at: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.addIndex('gym_saas_subscriptions', ['gym_id'], {
      unique: true,
      name: 'gym_saas_subscriptions_gym_unique',
    });
    await queryInterface.addIndex('gym_saas_subscriptions', ['status'], { name: 'gym_saas_subscriptions_status_idx' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('gym_saas_subscriptions');
  },
};

