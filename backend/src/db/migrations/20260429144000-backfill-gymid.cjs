'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const [gyms] = await queryInterface.sequelize.query('SELECT id FROM gyms ORDER BY created_at ASC LIMIT 1');
    const gymId = gyms?.[0]?.id ?? null;
    if (!gymId) return;

    const tables = [
      'users',
      'members',
      'plans',
      'subscriptions',
      'attendance',
      'payments',
      'trainers',
      'announcements',
      'workout_plans',
      'audit_logs',
      'password_reset_tokens',
    ];

    for (const t of tables) {
      // eslint-disable-next-line no-await-in-loop
      await queryInterface.sequelize.query(`UPDATE ${t} SET gym_id = :gymId WHERE gym_id IS NULL`, {
        replacements: { gymId },
      });
    }
  },

  async down() {
    // no-op (backfill is irreversible without per-row history)
  },
};

