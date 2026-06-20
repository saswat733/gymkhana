import { env } from '../../config/env.js';
import { cache } from '../../services/cache/cache.service.js';

/**
 * Simple GET response cache.
 * - Only caches successful JSON responses (2xx) that use sendSuccess envelope.
 * - Key should include caller-specific dimensions (e.g. user role) if needed.
 */
export const cacheGet = ({ key, ttlSeconds = env.cache.ttlSeconds } = {}) => async (req, res, next) => {
  try {
    if (req.method !== 'GET') return next();
    const cacheKey = typeof key === 'function' ? key(req) : key;
    if (!cacheKey) return next();

    const hit = await cache.getJson(cacheKey);
    if (hit) return res.status(200).json(hit);

    const originalJson = res.json.bind(res);
    res.json = (body) => {
      const status = res.statusCode ?? 200;
      if (status >= 200 && status < 300) {
        cache.setJson(cacheKey, body, { ttlSeconds }).catch(() => undefined);
      }
      return originalJson(body);
    };

    return next();
  } catch {
    return next();
  }
};

