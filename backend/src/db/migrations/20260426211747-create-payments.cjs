'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('payments', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      subscription_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'subscriptions', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      amount_cents: { type: Sequelize.INTEGER, allowNull: false },
      currency: { type: Sequelize.STRING(10), allowNull: false, defaultValue: 'INR' },
      method: { type: Sequelize.STRING(30), allowNull: false },
      status: { type: Sequelize.STRING(30), allowNull: false, defaultValue: 'paid' },
      paid_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      gateway_ref: { type: Sequelize.STRING(120), allowNull: true },
      idempotency_key: { type: Sequelize.STRING(120), allowNull: true, unique: true },
      notes: { type: Sequelize.TEXT, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.addIndex('payments', ['subscription_id'], { name: 'payments_subscription_id_idx' });
    await queryInterface.addIndex('payments', ['paid_at'], { name: 'payments_paid_at_idx' });
    await queryInterface.addIndex('payments', ['idempotency_key'], { unique: true, name: 'payments_idempotency_key_unique' });
  },

  async down (queryInterface, _Sequelize) {
    await queryInterface.dropTable('payments');
  }
};

