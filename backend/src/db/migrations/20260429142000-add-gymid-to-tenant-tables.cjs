'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Helper to add gym_id only if missing.
    const addGymId = async (table) => {
      const desc = await queryInterface.describeTable(table);
      if (desc.gym_id) return;

      await queryInterface.addColumn(table, 'gym_id', {
        type: Sequelize.UUID,
        allowNull: true, // will be backfilled, then enforced in later migration
        references: { model: 'gyms', key: 'id' },
        onDelete: 'SET NULL',
      });
      await queryInterface.addIndex(table, ['gym_id'], { name: `${table}_gym_id_idx` });
    };

    // Core tenant-scoped tables
    await addGymId('users');
    await addGymId('members');
    await addGymId('plans');
    await addGymId('subscriptions');
    await addGymId('attendance');
    await addGymId('payments');
    await addGymId('trainers');
    await addGymId('announcements');
    await addGymId('workout_plans');
    await addGymId('audit_logs');
    await addGymId('password_reset_tokens');
  },

  async down(queryInterface) {
    const dropGymId = async (table) => {
      try { await queryInterface.removeIndex(table, `${table}_gym_id_idx`); } catch {}
      const desc = await queryInterface.describeTable(table);
      if (!desc.gym_id) return;
      await queryInterface.removeColumn(table, 'gym_id');
    };

    await dropGymId('password_reset_tokens');
    await dropGymId('audit_logs');
    await dropGymId('workout_plans');
    await dropGymId('announcements');
    await dropGymId('trainers');
    await dropGymId('payments');
    await dropGymId('attendance');
    await dropGymId('subscriptions');
    await dropGymId('plans');
    await dropGymId('members');
    await dropGymId('users');
  },
};

