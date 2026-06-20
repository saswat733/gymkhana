import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';

import { buildApp } from '../src/app.js';
import { connectDB, closeDB, sequelize } from '../src/config/database.js';
import { Gym, Member, Plan, Subscription, User } from '../src/models/index.js';
import { ROLES } from '../src/constants/roles.js';
import { SUBSCRIPTION_STATUS } from '../src/models/Subscription.js';

const isoDate = (d) => d.toISOString().slice(0, 10);

let app;
let gym;
let admin;
let memberUser;
let member;
let plan;
let subscription;

before(async () => {
  await connectDB();
  await sequelize.sync({ force: true });

  gym = await Gym.create({ name: 'Test Gym', slug: 'test-gym' });

  admin = await User.createWithPassword({
    name: 'Admin',
    email: 'admin@test.com',
    phone: '9999999999',
    password: 'Admin@12345',
    role: ROLES.ADMIN,
    gymId: gym.id,
  });

  memberUser = await User.createWithPassword({
    name: 'Member',
    email: 'member@test.com',
    phone: '8888888888',
    password: 'Member@12345',
    role: ROLES.MEMBER,
    gymId: gym.id,
  });
  member = await Member.create({ userId: memberUser.id, gymId: gym.id });

  plan = await Plan.create({
    name: 'Monthly',
    durationMonths: 1,
    priceCents: 100000,
    perks: 'Basic access',
    gymId: gym.id,
  });

  const today = new Date();
  subscription = await Subscription.create({
    gymId: gym.id,
    memberId: member.id,
    planId: plan.id,
    startsAt: isoDate(today),
    endsAt: isoDate(today),
    status: SUBSCRIPTION_STATUS.ACTIVE,
    autoRenew: false,
  });

  app = buildApp();
});

after(async () => {
  await closeDB();
});

test('POST /payments records payment and respects idempotency', async () => {
  const loginRes = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: admin.email, password: 'Admin@12345' })
    .expect((res) => {
      if (res.status !== 200) {
        throw new Error(`Login failed: ${res.status} ${JSON.stringify(res.body)}`);
      }
    });

  const accessToken = loginRes.body?.data?.accessToken;
  assert.ok(accessToken, 'expected access token');

  const payload = {
    subscriptionId: subscription.id,
    amountCents: 100000,
    currency: 'INR',
    method: 'cash',
    status: 'paid',
    notes: 'integration test',
  };

  const key = 'it-payment-1';

  const res1 = await request(app)
    .post('/api/v1/payments')
    .set('Authorization', `Bearer ${accessToken}`)
    .set('Idempotency-Key', key)
    .send(payload)
    .expect(201);

  const payment1 = res1.body?.data?.payment;
  assert.ok(payment1?.id, 'expected payment id');
  assert.equal(payment1.subscriptionId, subscription.id);

  const res2 = await request(app)
    .post('/api/v1/payments')
    .set('Authorization', `Bearer ${accessToken}`)
    .set('Idempotency-Key', key)
    .send(payload)
    .expect(201);

  const payment2 = res2.body?.data?.payment;
  assert.equal(payment2.id, payment1.id, 'expected same payment for same idempotency key');
});

