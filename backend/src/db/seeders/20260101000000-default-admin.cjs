'use strict';

const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') });

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const email = (process.env.SEED_ADMIN_EMAIL || 'admin@gymkhana.local').toLowerCase();
    const password = process.env.SEED_ADMIN_PASSWORD || 'Admin@12345';
    const name = process.env.SEED_ADMIN_NAME || 'Super Admin';

    const [existing] = await queryInterface.sequelize.query(
      'SELECT id FROM users WHERE email = :email LIMIT 1',
      { replacements: { email } },
    );
    if (existing.length > 0) {
      // eslint-disable-next-line no-console
      console.log(`[seed] Admin user already exists (${email}); skipping.`);
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const now = new Date();

    // Ensure a default gym exists and attach admin to it.
    const [gyms] = await queryInterface.sequelize.query('SELECT id FROM gyms ORDER BY created_at ASC LIMIT 1');
    const gymId = gyms?.[0]?.id ?? null;

    await queryInterface.bulkInsert('users', [
      {
        id: uuidv4(),
        name,
        email,
        phone: null,
        password_hash: passwordHash,
        role: 'admin',
        is_active: true,
        last_login_at: null,
        gym_id: gymId,
        created_at: now,
        updated_at: now,
      },
    ]);
  },

  async down(queryInterface) {
    const email = (process.env.SEED_ADMIN_EMAIL || 'admin@gymkhana.local').toLowerCase();
    await queryInterface.bulkDelete('users', { email });
  },
};
