'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('saas_invoices', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true, allowNull: false },
      gym_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'gyms', key: 'id' },
        onDelete: 'CASCADE',
      },
      gym_saas_subscription_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'gym_saas_subscriptions', key: 'id' },
        onDelete: 'CASCADE',
      },
      invoice_number: { type: Sequelize.STRING(64), allowNull: false },
      status: {
        type: Sequelize.ENUM('draft', 'issued', 'paid', 'void'),
        allowNull: false,
        defaultValue: 'issued',
      },
      currency: { type: Sequelize.STRING(3), allowNull: false, defaultValue: 'INR' },
      amount_cents: { type: Sequelize.INTEGER, allowNull: false },
      gst_percent: { type: Sequelize.DECIMAL(5, 2), allowNull: true },
      gst_cents: { type: Sequelize.INTEGER, allowNull: true },
      total_cents: { type: Sequelize.INTEGER, allowNull: false },
      issued_at: { type: Sequelize.DATE, allowNull: false },
      due_at: { type: Sequelize.DATE, allowNull: true },
      paid_at: { type: Sequelize.DATE, allowNull: true },
      notes: { type: Sequelize.STRING(1000), allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.addIndex('saas_invoices', ['gym_id', 'invoice_number'], {
      unique: true,
      name: 'saas_invoices_gym_invoice_unique',
    });
    await queryInterface.addIndex('saas_invoices', ['gym_id'], { name: 'saas_invoices_gym_idx' });
    await queryInterface.addIndex('saas_invoices', ['status'], { name: 'saas_invoices_status_idx' });
    await queryInterface.addIndex('saas_invoices', ['issued_at'], { name: 'saas_invoices_issued_at_idx' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('saas_invoices');
  },
};

