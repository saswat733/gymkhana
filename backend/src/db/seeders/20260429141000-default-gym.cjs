'use strict';

const { v4: uuidv4 } = require('uuid');
require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') });

const slugify = (s) =>
  String(s || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'default';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const name = process.env.SEED_GYM_NAME || 'Default Gym';
    const slug = process.env.SEED_GYM_SLUG || slugify(name);
    const now = new Date();

    const [existing] = await queryInterface.sequelize.query(
      'SELECT id FROM gyms WHERE slug = :slug LIMIT 1',
      { replacements: { slug } },
    );
    if (existing.length > 0) {
      // eslint-disable-next-line no-console
      console.log(`[seed] Gym already exists (${slug}); skipping.`);
      return;
    }

    await queryInterface.bulkInsert('gyms', [
      {
        id: uuidv4(),
        name,
        slug,
        timezone: process.env.SEED_GYM_TIMEZONE || 'Asia/Kolkata',
        currency: process.env.SEED_GYM_CURRENCY || 'INR',
        is_active: true,
        created_at: now,
        updated_at: now,
      },
    ]);
  },

  async down(queryInterface) {
    const slug = process.env.SEED_GYM_SLUG || 'default-gym';
    await queryInterface.bulkDelete('gyms', { slug });
  },
};

