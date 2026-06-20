'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('member_invoices', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true, allowNull: false },
      gym_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'gyms', key: 'id' },
        onDelete: 'CASCADE',
      },
      payment_id: {
        type: Sequelize.UUID,
        allowNull: false,
        unique: true,
        references: { model: 'payments', key: 'id' },
        onDelete: 'CASCADE',
      },
      invoice_number: { type: Sequelize.STRING(64), allowNull: false },
      buyer_name: { type: Sequelize.STRING(200), allowNull: false },
      buyer_email: { type: Sequelize.STRING(160), allowNull: true },
      buyer_gstin: { type: Sequelize.STRING(20), allowNull: true },
      subtotal_cents: { type: Sequelize.INTEGER, allowNull: false },
      gst_percent: { type: Sequelize.DECIMAL(5, 2), allowNull: true },
      gst_cents: { type: Sequelize.INTEGER, allowNull: true },
      total_cents: { type: Sequelize.INTEGER, allowNull: false },
      currency: { type: Sequelize.STRING(3), allowNull: false, defaultValue: 'INR' },
      issued_at: { type: Sequelize.DATE, allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.addIndex('member_invoices', ['gym_id', 'invoice_number'], {
      unique: true,
      name: 'member_invoices_gym_invoice_unique',
    });
    await queryInterface.addIndex('member_invoices', ['payment_id'], { unique: true, name: 'member_invoices_payment_unique' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('member_invoices');
  },
};
