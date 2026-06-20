import crypto from 'node:crypto';
import { env } from '../config/env.js';

const PREFIX = 'gymkhana:gym';

export const generateQrSecret = () => crypto.randomBytes(32).toString('hex');

export const signGymQr = ({ gymId, zoneId, secret }) => {
  const payload = `${gymId}:${zoneId}`;
  const sig = crypto.createHmac('sha256', secret).update(payload).digest('hex').slice(0, 16);
  return `${PREFIX}:${gymId}:${zoneId}:${sig}`;
};

export const parseGymQr = (raw) => {
  const s = String(raw ?? '').trim();
  const m = s.match(/^gymkhana:gym:([0-9a-f-]{36}):([0-9a-f-]{36}):([0-9a-f]{16})$/i);
  if (!m) return null;
  return { gymId: m[1], zoneId: m[2], signature: m[3] };
};

export const verifyGymQr = ({ payload, secret }) => {
  const parsed = parseGymQr(payload);
  if (!parsed) return null;
  const expected = crypto
    .createHmac('sha256', secret)
    .update(`${parsed.gymId}:${parsed.zoneId}`)
    .digest('hex')
    .slice(0, 16);
  if (expected !== parsed.signature) return null;
  return parsed;
};

/** Fallback secret for gyms created before qr_secret column (dev-safe). */
export const resolveGymQrSecret = (gym) => gym?.qrSecret || env.jwt.accessSecret;
