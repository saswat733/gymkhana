import { env } from '../../config/env.js';

/**
 * Minimal cache service.
 * - If REDIS_URL is set, uses Redis (ioredis).
 * - Otherwise falls back to in-memory Map (dev-friendly).
 *
 * Keys are namespaced by env.apiPrefix to avoid collisions when multiple apps share Redis.
 */

const prefix = `gymkhana:${env.nodeEnv}:`;

class MemoryCache {
  constructor() {
    this.map = new Map();
  }

  async get(key) {
    const v = this.map.get(key);
    if (!v) return null;
    if (v.expiresAt && v.expiresAt < Date.now()) {
      this.map.delete(key);
      return null;
    }
    return v.value;
  }

  async set(key, value, ttlSeconds) {
    const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : null;
    this.map.set(key, { value, expiresAt });
  }

  async del(key) {
    this.map.delete(key);
  }
}

let redis = null;
const memory = new MemoryCache();

export const initCache = async () => {
  const url = env.cache.redisUrl || process.env.REDIS_URL;
  if (!url) return { provider: 'memory' };

  const { default: IORedis } = await import('ioredis');
  redis = new IORedis(url, { lazyConnect: true, maxRetriesPerRequest: 2 });
  await redis.connect();
  return { provider: 'redis' };
};

const k = (key) => `${prefix}${key}`;

export const cache = {
  async getJson(key) {
    if (redis) {
      const v = await redis.get(k(key));
      return v ? JSON.parse(v) : null;
    }
    return memory.get(k(key));
  },

  async setJson(key, value, { ttlSeconds } = {}) {
    if (redis) {
      const payload = JSON.stringify(value);
      if (ttlSeconds) {
        await redis.set(k(key), payload, 'EX', ttlSeconds);
      } else {
        await redis.set(k(key), payload);
      }
      return;
    }
    await memory.set(k(key), value, ttlSeconds);
  },

  async del(key) {
    if (redis) {
      await redis.del(k(key));
      return;
    }
    await memory.del(k(key));
  },
};

