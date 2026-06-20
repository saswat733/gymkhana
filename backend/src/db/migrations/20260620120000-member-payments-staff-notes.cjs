'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('payments', 'razorpay_order_id', {
      type: Sequelize.STRING(64),
      allowNull: true,
    });
    await queryInterface.addColumn('payments', 'razorpay_payment_id', {
      type: Sequelize.STRING(64),
      allowNull: true,
    });
    await queryInterface.addIndex('payments', ['razorpay_payment_id'], {
      unique: true,
      name: 'payments_razorpay_payment_id_unique',
    });

    await queryInterface.createTable('payment_intents', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      gym_id: { type: Sequelize.UUID, allowNull: false },
      member_id: { type: Sequelize.UUID, allowNull: false },
      plan_id: { type: Sequelize.UUID, allowNull: false },
      subscription_id: { type: Sequelize.UUID, allowNull: true },
      amount_cents: { type: Sequelize.INTEGER, allowNull: false },
      currency: { type: Sequelize.STRING(10), allowNull: false, defaultValue: 'INR' },
      razorpay_order_id: { type: Sequelize.STRING(64), allowNull: false, unique: true },
      status: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: 'created',
      },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex('payment_intents', ['gym_id', 'member_id'], {
      name: 'payment_intents_gym_member',
    });

    await queryInterface.createTable('staff_notes', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      gym_id: { type: Sequelize.UUID, allowNull: false },
      entity_type: { type: Sequelize.STRING(20), allowNull: false },
      entity_id: { type: Sequelize.UUID, allowNull: false },
      author_user_id: { type: Sequelize.UUID, allowNull: false },
      body: { type: Sequelize.TEXT, allowNull: false },
      pinned: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex('staff_notes', ['gym_id', 'entity_type', 'entity_id'], {
      name: 'staff_notes_entity',
    });

    await queryInterface.addColumn('leads', 'follow_up_note', {
      type: Sequelize.STRING(500),
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('leads', 'follow_up_note');
    await queryInterface.dropTable('staff_notes');
    await queryInterface.dropTable('payment_intents');
    await queryInterface.removeIndex('payments', 'payments_razorpay_payment_id_unique');
    await queryInterface.removeColumn('payments', 'razorpay_payment_id');
    await queryInterface.removeColumn('payments', 'razorpay_order_id');
  },
};
