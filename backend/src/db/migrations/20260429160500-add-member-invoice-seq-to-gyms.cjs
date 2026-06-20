'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('gyms', 'member_invoice_prefix', {
      type: Sequelize.STRING(20),
      allowNull: false,
      defaultValue: 'INV',
    });
    await queryInterface.addColumn('gyms', 'member_invoice_seq', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 1,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('gyms', 'member_invoice_seq');
    await queryInterface.removeColumn('gyms', 'member_invoice_prefix');
  },
};
