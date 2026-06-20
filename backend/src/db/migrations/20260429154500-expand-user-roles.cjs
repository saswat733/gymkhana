'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const dialect = queryInterface.sequelize.getDialect();
    const roles = ['owner', 'admin', 'manager', 'receptionist', 'trainer', 'member'];

    if (dialect === 'mysql') {
      await queryInterface.changeColumn('users', 'role', {
        type: Sequelize.ENUM(...roles),
        allowNull: false,
        defaultValue: 'member',
      });
      return;
    }

    if (dialect === 'postgres') {
      await queryInterface.sequelize.query("ALTER TYPE \"enum_users_role\" ADD VALUE IF NOT EXISTS 'owner'");
      await queryInterface.sequelize.query("ALTER TYPE \"enum_users_role\" ADD VALUE IF NOT EXISTS 'manager'");
      await queryInterface.sequelize.query("ALTER TYPE \"enum_users_role\" ADD VALUE IF NOT EXISTS 'receptionist'");
    }
  },

  async down() {
    // Non-reversible for MySQL ENUM shrink.
  },
};
