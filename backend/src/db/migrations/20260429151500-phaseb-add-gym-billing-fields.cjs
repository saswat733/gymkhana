'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('gyms', 'legal_name', { type: Sequelize.STRING(200), allowNull: true });
    await queryInterface.addColumn('gyms', 'gstin', { type: Sequelize.STRING(20), allowNull: true });
    await queryInterface.addColumn('gyms', 'billing_address_line1', { type: Sequelize.STRING(200), allowNull: true });
    await queryInterface.addColumn('gyms', 'billing_address_line2', { type: Sequelize.STRING(200), allowNull: true });
    await queryInterface.addColumn('gyms', 'billing_city', { type: Sequelize.STRING(80), allowNull: true });
    await queryInterface.addColumn('gyms', 'billing_state', { type: Sequelize.STRING(80), allowNull: true });
    await queryInterface.addColumn('gyms', 'billing_pincode', { type: Sequelize.STRING(12), allowNull: true });

    await queryInterface.addColumn('gyms', 'saas_invoice_prefix', {
      type: Sequelize.STRING(20),
      allowNull: false,
      defaultValue: 'GK',
    });
    await queryInterface.addColumn('gyms', 'saas_invoice_seq', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 1,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('gyms', 'saas_invoice_seq');
    await queryInterface.removeColumn('gyms', 'saas_invoice_prefix');
    await queryInterface.removeColumn('gyms', 'billing_pincode');
    await queryInterface.removeColumn('gyms', 'billing_state');
    await queryInterface.removeColumn('gyms', 'billing_city');
    await queryInterface.removeColumn('gyms', 'billing_address_line2');
    await queryInterface.removeColumn('gyms', 'billing_address_line1');
    await queryInterface.removeColumn('gyms', 'gstin');
    await queryInterface.removeColumn('gyms', 'legal_name');
  },
};

