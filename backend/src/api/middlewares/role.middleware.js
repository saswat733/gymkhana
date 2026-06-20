import { ApiError } from '../../utils/ApiError.js';

/**
 * Role-based access guard. Use after `authenticate`.
 *
 * Example:  router.get('/admin', authenticate, requireRole('admin'), handler)
 */
export const requireRole = (...allowed) => (req, _res, next) => {
  if (!req.user) return next(ApiError.unauthorized());
  if (!allowed.includes(req.user.role)) {
    return next(ApiError.forbidden('You do not have permission to perform this action'));
  }
  next();
};
