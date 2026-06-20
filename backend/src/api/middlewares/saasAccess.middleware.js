import { ApiError } from '../../utils/ApiError.js';
import { isGymPlatformAccessAllowed } from '../../services/saasBilling.service.js';

/**
 * Blocks tenant API when SaaS trial/subscription is expired or cancelled.
 * Skipped for auth, health, saas billing, and gym onboarding routes (mount selectively).
 */
export const requirePlatformAccess = async (req, _res, next) => {
  try {
    if (!req.gymId) return next();
    const allowed = await isGymPlatformAccessAllowed({ gymId: req.gymId });
    if (!allowed) {
      return next(ApiError.forbidden('Platform subscription inactive. Renew billing in Settings → Billing.'));
    }
    return next();
  } catch (e) {
    return next(e);
  }
};
