'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('gyms', 'qr_secret', {
      type: Sequelize.STRING(64),
      allowNull: true,
    });
    await queryInterface.addColumn('gyms', 'logo_url', {
      type: Sequelize.STRING(500),
      allowNull: true,
    });
    await queryInterface.addColumn('gyms', 'brand_primary_color', {
      type: Sequelize.STRING(20),
      allowNull: true,
    });
    await queryInterface.addColumn('gyms', 'brand_secondary_color', {
      type: Sequelize.STRING(20),
      allowNull: true,
    });
    await queryInterface.addColumn('gyms', 'custom_domain', {
      type: Sequelize.STRING(200),
      allowNull: true,
    });

    await queryInterface.createTable('attendance_zones', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true, allowNull: false },
      gym_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'gyms', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      name: { type: Sequelize.STRING(120), allowNull: false },
      slug: { type: Sequelize.STRING(80), allowNull: false },
      is_active: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      is_default: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      sort_order: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });
    await queryInterface.addIndex('attendance_zones', ['gym_id', 'slug'], { unique: true, name: 'attendance_zones_gym_slug_unique' });

    await queryInterface.addColumn('attendance', 'zone_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'attendance_zones', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });

    await queryInterface.addColumn('plans', 'is_trial', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
    await queryInterface.addColumn('plans', 'trial_days', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
    await queryInterface.addColumn('plans', 'trial_visits_limit', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });

    await queryInterface.addColumn('subscriptions', 'is_trial', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
    await queryInterface.addColumn('subscriptions', 'trial_visits_limit', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
    await queryInterface.addColumn('subscriptions', 'trial_visits_used', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    });
    await queryInterface.addColumn('subscriptions', 'family_group_id', {
      type: Sequelize.UUID,
      allowNull: true,
    });

    await queryInterface.createTable('subscription_freezes', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true, allowNull: false },
      gym_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'gyms', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      subscription_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'subscriptions', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      member_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'members', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      starts_at: { type: Sequelize.DATEONLY, allowNull: false },
      ends_at: { type: Sequelize.DATEONLY, allowNull: false },
      reason: { type: Sequelize.STRING(500), allowNull: true },
      status: { type: Sequelize.STRING(20), allowNull: false, defaultValue: 'active' },
      days_frozen: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      created_by_user_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.createTable('leads', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true, allowNull: false },
      gym_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'gyms', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      name: { type: Sequelize.STRING(160), allowNull: false },
      phone: { type: Sequelize.STRING(30), allowNull: true },
      email: { type: Sequelize.STRING(160), allowNull: true },
      source: { type: Sequelize.STRING(80), allowNull: true },
      status: { type: Sequelize.STRING(30), allowNull: false, defaultValue: 'created' },
      notes: { type: Sequelize.TEXT, allowNull: true },
      follow_up_at: { type: Sequelize.DATE, allowNull: true },
      assigned_to_user_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      converted_member_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'members', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      trial_subscription_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'subscriptions', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });
    await queryInterface.addIndex('leads', ['gym_id', 'status'], { name: 'leads_gym_status_idx' });

    await queryInterface.createTable('family_groups', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true, allowNull: false },
      gym_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'gyms', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      name: { type: Sequelize.STRING(160), allowNull: false },
      payer_member_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'members', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.createTable('family_members', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true, allowNull: false },
      family_group_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'family_groups', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      member_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'members', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      relationship: { type: Sequelize.STRING(30), allowNull: false, defaultValue: 'member' },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });
    await queryInterface.addIndex('family_members', ['family_group_id', 'member_id'], {
      unique: true,
      name: 'family_members_group_member_unique',
    });

    await queryInterface.createTable('staff_shifts', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true, allowNull: false },
      gym_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'gyms', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      shift_date: { type: Sequelize.DATEONLY, allowNull: false },
      shift_type: { type: Sequelize.STRING(30), allowNull: false, defaultValue: 'morning' },
      starts_at: { type: Sequelize.TIME, allowNull: true },
      ends_at: { type: Sequelize.TIME, allowNull: true },
      notes: { type: Sequelize.STRING(500), allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.createTable('retention_rules', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true, allowNull: false },
      gym_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'gyms', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      name: { type: Sequelize.STRING(160), allowNull: false },
      trigger_type: { type: Sequelize.STRING(50), allowNull: false },
      trigger_days: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 3 },
      action_type: { type: Sequelize.STRING(30), allowNull: false, defaultValue: 'push' },
      message_template: { type: Sequelize.TEXT, allowNull: true },
      is_active: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('retention_rules');
    await queryInterface.dropTable('staff_shifts');
    await queryInterface.dropTable('family_members');
    await queryInterface.dropTable('family_groups');
    await queryInterface.dropTable('leads');
    await queryInterface.dropTable('subscription_freezes');
    await queryInterface.removeColumn('subscriptions', 'family_group_id');
    await queryInterface.removeColumn('subscriptions', 'trial_visits_used');
    await queryInterface.removeColumn('subscriptions', 'trial_visits_limit');
    await queryInterface.removeColumn('subscriptions', 'is_trial');
    await queryInterface.removeColumn('plans', 'trial_visits_limit');
    await queryInterface.removeColumn('plans', 'trial_days');
    await queryInterface.removeColumn('plans', 'is_trial');
    await queryInterface.removeColumn('attendance', 'zone_id');
    await queryInterface.dropTable('attendance_zones');
    await queryInterface.removeColumn('gyms', 'custom_domain');
    await queryInterface.removeColumn('gyms', 'brand_secondary_color');
    await queryInterface.removeColumn('gyms', 'brand_primary_color');
    await queryInterface.removeColumn('gyms', 'logo_url');
    await queryInterface.removeColumn('gyms', 'qr_secret');
  },
};
