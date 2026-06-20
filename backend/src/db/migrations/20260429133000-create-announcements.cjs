'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('announcements', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      title: { type: Sequelize.STRING(160), allowNull: false },
      body: { type: Sequelize.TEXT, allowNull: false },
      audience: {
        type: Sequelize.ENUM('all', 'members', 'trainers', 'admins'),
        allowNull: false,
        defaultValue: 'all',
      },
      is_published: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      publish_at: { type: Sequelize.DATE, allowNull: true },
      expires_at: { type: Sequelize.DATE, allowNull: true },
      created_by_user_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
      },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.addIndex('announcements', ['is_published'], { name: 'ann_is_published_idx' });
    await queryInterface.addIndex('announcements', ['audience'], { name: 'ann_audience_idx' });
    await queryInterface.addIndex('announcements', ['publish_at'], { name: 'ann_publish_at_idx' });
    await queryInterface.addIndex('announcements', ['expires_at'], { name: 'ann_expires_at_idx' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('announcements');
    if (queryInterface.sequelize.getDialect() === 'postgres') {
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS \"enum_announcements_audience\";');
    }
  },
};

