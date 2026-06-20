import { sequelize } from '../config/database.js';
import { Gym, Plan, User } from '../models/index.js';
import { ApiError } from '../utils/ApiError.js';
import { ROLES } from '../constants/roles.js';
import * as saasBillingService from './saasBilling.service.js';
import { ensureDefaultZone } from './attendanceZone.service.js';
import { generateQrSecret } from '../utils/gymQr.js';

const slugify = (s) =>
  String(s || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'gym';

export const getDefaultGym = async () => {
  const slug = process.env.SEED_GYM_SLUG || 'default-gym';
  const gym = await Gym.findOne({ where: { slug } });
  if (gym) return gym;

  const any = await Gym.findOne();
  if (any) return any;

  throw ApiError.internal('No gyms found; run seeders');
};

export const getGymProfile = async ({ gymId }) => {
  if (!gymId) throw ApiError.badRequest('gymId is required');
  const gym = await Gym.findByPk(gymId);
  if (!gym) throw ApiError.notFound('Gym not found');
  return gym;
};

export const updateGymProfile = async ({ gymId, patch }) => {
  if (!gymId) throw ApiError.badRequest('gymId is required');
  const gym = await Gym.findByPk(gymId);
  if (!gym) throw ApiError.notFound('Gym not found');
  await gym.update(patch);
  return gym;
};

const seedDefaultMemberPlans = async ({ gymId, transaction }) => {
  const defaults = [
    { name: 'Monthly', durationMonths: 1, priceCents: 150000, perks: 'Gym access' },
    { name: 'Quarterly', durationMonths: 3, priceCents: 400000, perks: 'Gym access + 1 PT session' },
    { name: 'Yearly', durationMonths: 12, priceCents: 1400000, perks: 'Best value annual plan' },
    { name: '1 Day Trial', durationMonths: 1, priceCents: 0, perks: 'Trial — 1 day', isTrial: true, trialDays: 1, trialVisitsLimit: 1 },
    { name: '3 Day Trial', durationMonths: 1, priceCents: 0, perks: 'Trial — 3 days', isTrial: true, trialDays: 3, trialVisitsLimit: 3 },
    { name: '7 Day Trial', durationMonths: 1, priceCents: 0, perks: 'Trial — 7 days', isTrial: true, trialDays: 7, trialVisitsLimit: 7 },
  ];
  for (const p of defaults) {
    await Plan.create({ ...p, gymId, isActive: true }, { transaction });
  }
};

export const onboardGym = async ({
  gymName,
  slug,
  ownerName,
  ownerEmail,
  ownerPassword,
  ownerPhone,
  planCode = 'basic',
  billingCycle = 'monthly',
}) => {
  if (!gymName || !ownerName || !ownerEmail || !ownerPassword) {
    throw ApiError.badRequest('gymName, ownerName, ownerEmail, ownerPassword are required');
  }

  const finalSlug = slug ? slugify(slug) : slugify(gymName);
  const email = String(ownerEmail).trim().toLowerCase();

  const slugTaken = await Gym.findOne({ where: { slug: finalSlug } });
  if (slugTaken) throw ApiError.conflict('Gym slug already taken');

  const emailTaken = await User.findOne({ where: { email } });
  if (emailTaken) throw ApiError.conflict('Email is already registered');

  return sequelize.transaction(async (t) => {
    const gym = await Gym.create(
      {
        name: gymName,
        slug: finalSlug,
        timezone: 'Asia/Kolkata',
        currency: 'INR',
        isActive: true,
      },
      { transaction: t },
    );

    const passwordHash = await User.hashPassword(ownerPassword);
    const owner = await User.create(
      {
        name: ownerName,
        email,
        phone: ownerPhone ?? null,
        passwordHash,
        role: ROLES.OWNER,
        gymId: gym.id,
        isActive: true,
      },
      { transaction: t },
    );

    await seedDefaultMemberPlans({ gymId: gym.id, transaction: t });

    return { gym, owner, planCode, billingCycle };
  }).then(async ({ gym, owner, planCode, billingCycle }) => {
    await saasBillingService.startOrChangeGymSubscription({
      gymId: gym.id,
      planCode,
      billingCycle,
      trialDays: 14,
    });
    const g = await Gym.findByPk(gym.id);
    if (g && !g.qrSecret) await g.update({ qrSecret: generateQrSecret() });
    await ensureDefaultZone({ gymId: gym.id });
    return { gym, owner };
  });
};
