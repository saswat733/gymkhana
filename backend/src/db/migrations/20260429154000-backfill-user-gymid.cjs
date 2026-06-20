'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const [gyms] = await queryInterface.sequelize.query(
      'SELECT id FROM gyms ORDER BY created_at ASC LIMIT 1',
    );
    const gymId = gyms?.[0]?.id;
    if (!gymId) return;

    await queryInterface.sequelize.query(
      'UPDATE users SET gym_id = :gymId WHERE gym_id IS NULL',
      { replacements: { gymId } },
    );
  },

  async down() {
    // Non-reversible: cannot know which users originally had null gym_id.
  },
};
