import { AttendanceZone, Gym } from '../models/index.js';
import { ApiError } from '../utils/ApiError.js';
import { generateQrSecret, resolveGymQrSecret, signGymQr } from '../utils/gymQr.js';

const slugify = (s) =>
  String(s || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'zone';

const ensureQrSecret = async (gym) => {
  if (gym.qrSecret) return gym.qrSecret;
  const secret = generateQrSecret();
  await gym.update({ qrSecret: secret });
  return secret;
};

export const ensureDefaultZone = async ({ gymId }) => {
  let zone = await AttendanceZone.findOne({ where: { gymId, isDefault: true } });
  if (zone) return zone;
  zone = await AttendanceZone.create({
    gymId,
    name: 'Main Entrance',
    slug: 'main-entrance',
    isDefault: true,
    isActive: true,
    sortOrder: 0,
  });
  return zone;
};

export const listZones = async ({ gymId }) => {
  await ensureDefaultZone({ gymId });
  return AttendanceZone.findAll({ where: { gymId }, order: [['sortOrder', 'ASC'], ['name', 'ASC']] });
};

export const createZone = async ({ gymId, name, slug, isDefault }) => {
  const finalSlug = slug ? slugify(slug) : slugify(name);
  const exists = await AttendanceZone.findOne({ where: { gymId, slug: finalSlug } });
  if (exists) throw ApiError.conflict('Zone slug already exists');

  if (isDefault) {
    await AttendanceZone.update({ isDefault: false }, { where: { gymId, isDefault: true } });
  }

  const maxOrder = (await AttendanceZone.max('sortOrder', { where: { gymId } })) ?? 0;
  return AttendanceZone.create({
    gymId,
    name: String(name).trim(),
    slug: finalSlug,
    isDefault: Boolean(isDefault),
    isActive: true,
    sortOrder: Number(maxOrder) + 1,
  });
};

export const updateZone = async ({ gymId, id, patch }) => {
  const zone = await AttendanceZone.findByPk(id);
  if (!zone || String(zone.gymId) !== String(gymId)) throw ApiError.notFound('Zone not found');

  if (patch.isDefault) {
    await AttendanceZone.update({ isDefault: false }, { where: { gymId, isDefault: true } });
  }

  await zone.update(patch);
  return zone;
};

export const getZoneQrPayload = async ({ gymId, zoneId }) => {
  const gym = await Gym.findByPk(gymId);
  if (!gym) throw ApiError.notFound('Gym not found');

  const zone = zoneId
    ? await AttendanceZone.findOne({ where: { id: zoneId, gymId, isActive: true } })
    : await ensureDefaultZone({ gymId });
  if (!zone) throw ApiError.notFound('Zone not found');

  const secret = await ensureQrSecret(gym);
  const payload = signGymQr({ gymId, zoneId: zone.id, secret: resolveGymQrSecret({ ...gym.get(), qrSecret: secret }) });
  return { zone, payload, gymName: gym.name };
};

export const getGymQrSetup = async ({ gymId }) => {
  const zones = await listZones({ gymId });
  const gym = await Gym.findByPk(gymId);
  await ensureQrSecret(gym);
  const secret = resolveGymQrSecret(gym);
  const qrCodes = zones
    .filter((z) => z.isActive)
    .map((z) => ({
      zoneId: z.id,
      zoneName: z.name,
      isDefault: z.isDefault,
      payload: signGymQr({ gymId, zoneId: z.id, secret }),
    }));
  return { zones, qrCodes };
};
