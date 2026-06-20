import { ApiError } from '../../utils/ApiError.js';

/**
 * Extract an idempotency key from request headers.
 *
 * Convention:
 * - Clients send:  Idempotency-Key: <string>
 * - We store it on the created payment record to prevent duplicates.
 */
export const requireIdempotencyKey = (req, _res, next) => {
  const key = String(req.headers['idempotency-key'] ?? '').trim();
  if (!key) return next(ApiError.badRequest('Missing Idempotency-Key header'));
  if (key.length > 120) return next(ApiError.badRequest('Idempotency-Key too long'));
  req.idempotencyKey = key;
  return next();
};

