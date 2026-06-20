'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('subscriptions', {
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
      plan_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'plans', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      starts_at: { type: Sequelize.DATEONLY, allowNull: false },
      ends_at: { type: Sequelize.DATEONLY, allowNull: false },
      status: { type: Sequelize.STRING(30), allowNull: false, defaultValue: 'active' },
      auto_renew: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: 0 },
      cancelled_at: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.addIndex('subscriptions', ['member_id'], { name: 'subscriptions_member_id_idx' });
    await queryInterface.addIndex('subscriptions', ['plan_id'], { name: 'subscriptions_plan_id_idx' });
    await queryInterface.addIndex('subscriptions', ['status'], { name: 'subscriptions_status_idx' });
    await queryInterface.addIndex('subscriptions', ['ends_at'], { name: 'subscriptions_ends_at_idx' });
  },

  async down (queryInterface, _Sequelize) {
    await queryInterface.dropTable('subscriptions');
  }
};

