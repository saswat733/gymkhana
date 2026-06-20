import { ApiError } from '../../utils/ApiError.js';

/**
 * Attaches `req.gymId` for tenant scoping.
 *
 * Current rule (Phase A):
 * - gymId must be present in JWT (req.auth.gymId) for all authenticated users.
 */
export const requireTenant = (req, _res, next) => {
  const gymId = req.auth?.gymId ?? req.user?.gymId ?? null;
  if (!gymId) return next(ApiError.forbidden('Missing tenant context'));
  req.gymId = gymId;
  return next();
};

