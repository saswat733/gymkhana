'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('gyms', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true, allowNull: false },
      name: { type: Sequelize.STRING(160), allowNull: false },
      slug: { type: Sequelize.STRING(80), allowNull: false, unique: true },
      timezone: { type: Sequelize.STRING(64), allowNull: false, defaultValue: 'Asia/Kolkata' },
      currency: { type: Sequelize.STRING(3), allowNull: false, defaultValue: 'INR' },
      is_active: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.addIndex('gyms', ['slug'], { unique: true, name: 'gyms_slug_unique' });
    await queryInterface.addIndex('gyms', ['is_active'], { name: 'gyms_is_active_idx' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('gyms');
  },
};

