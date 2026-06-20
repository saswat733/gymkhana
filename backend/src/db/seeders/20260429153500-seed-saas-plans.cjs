'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert('saas_plans', [
      {
        id: '00000000-0000-0000-0000-0000000000b1',
        code: 'basic',
        name: 'Basic',
        description: 'Core gym management for small gyms',
        is_active: true,
        price_monthly_cents: 199900, // ₹1,999.00
        price_yearly_cents: 1999900, // ₹19,999.00
        currency: 'INR',
        limit_members: 250,
        limit_trainers: 10,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: '00000000-0000-0000-0000-0000000000b2',
        code: 'pro',
        name: 'Pro',
        description: 'For growing gyms with more members and staff',
        is_active: true,
        price_monthly_cents: 499900, // ₹4,999.00
        price_yearly_cents: 4999900, // ₹49,999.00
        currency: 'INR',
        limit_members: 1500,
        limit_trainers: 50,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: '00000000-0000-0000-0000-0000000000b3',
        code: 'enterprise',
        name: 'Enterprise',
        description: 'Unlimited usage + priority support',
        is_active: true,
        price_monthly_cents: 1499900, // ₹14,999.00
        price_yearly_cents: 14999900, // ₹149,999.00
        currency: 'INR',
        limit_members: null,
        limit_trainers: null,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('saas_plans', { code: ['basic', 'pro', 'enterprise'] });
  },
};

