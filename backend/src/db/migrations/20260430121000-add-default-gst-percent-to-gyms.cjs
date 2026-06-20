'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('gyms', 'default_gst_percent', {
      type: Sequelize.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 18,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('gyms', 'default_gst_percent');
  },
};
