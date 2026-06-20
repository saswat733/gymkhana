import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const defaultDotenv = process.env.NODE_ENV === 'test' ? '.env.test' : '.env';

const resolveDotenvPath = () => {
  const preferredPath = process.env.DOTENV_PATH;
  if (preferredPath && fs.existsSync(preferredPath)) return preferredPath;

  const candidates = [
    path.resolve(process.cwd(), defaultDotenv),
    path.resolve(__dirname, '../../..', defaultDotenv), // backend/
    path.resolve(__dirname, '../../../..', defaultDotenv), // repo root (if backend is nested)
  ];

  return candidates.find((p) => fs.existsSync(p)) ?? candidates[0];
};

const dotenvPath = resolveDotenvPath();
dotenv.config({ path: dotenvPath });

const required = (key) => {
  const value = process.env[key];
  if (value === undefined || value === '') {
    throw new Error(`[env] Missing required environment variable: ${key}`);
  }
  return value;
};

const num = (key, fallback) => {
  const v = process.env[key];
  if (v === undefined || v === '') return fallback;
  const n = Number(v);
  if (Number.isNaN(n)) throw new Error(`[env] ${key} must be a number`);
  return n;
};

const bool = (key, fallback) => {
  const v = process.env[key];
  if (v === undefined) return fallback;
  return v === 'true' || v === '1';
};

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: num('PORT', 4000),
  apiPrefix: process.env.API_PREFIX ?? '/api/v1',

  db: {
    dialect: process.env.DB_DIALECT ?? 'postgres',
    host: process.env.DB_HOST ?? 'localhost',
    port: num('DB_PORT', 5432),
    name: required('DB_NAME'),
    user: required('DB_USER'),
    password: process.env.DB_PASSWORD ?? '',
    logging: bool('DB_LOGGING', false),
  },

  jwt: {
    accessSecret: required('JWT_ACCESS_SECRET'),
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
    refreshSecret: required('JWT_REFRESH_SECRET'),
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
  },

  cors: {
    origin: process.env.CORS_ORIGIN ?? '*',
  },

  rateLimit: {
    windowMs: num('RATE_LIMIT_WINDOW_MS', 15 * 60 * 1000),
    max: num('RATE_LIMIT_MAX', 300),
  },

  cache: {
    redisUrl: process.env.REDIS_URL ?? '',
    ttlSeconds: num('CACHE_TTL_SECONDS', 30),
  },

  logLevel: process.env.LOG_LEVEL ?? 'info',

  email: {
    provider: process.env.EMAIL_PROVIDER ?? 'console',
    dryRun: bool('EMAIL_DRY_RUN', false),
    from: process.env.EMAIL_FROM ?? 'no-reply@gymkhana.local',
    resendApiKey: process.env.RESEND_API_KEY ?? '',
  },

  seed: {
    adminEmail: process.env.SEED_ADMIN_EMAIL ?? 'admin@gymkhana.local',
    adminPassword: process.env.SEED_ADMIN_PASSWORD ?? 'Admin@12345',
    adminName: process.env.SEED_ADMIN_NAME ?? 'Super Admin',
  },

  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID ?? '',
    keySecret: process.env.RAZORPAY_KEY_SECRET ?? '',
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET ?? '',
  },

  features: {
    allowFreeSelfSubscribe: bool('ALLOW_FREE_SELF_SUBSCRIBE', false),
  },
};

export const isProd = env.nodeEnv === 'production';
export const isDev = env.nodeEnv === 'development';
export const isTest = env.nodeEnv === 'test';
