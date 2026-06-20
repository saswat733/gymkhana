import { ApiError } from '../../utils/ApiError.js';
import { roleHasPermission } from '../../constants/permissions.js';

export const requirePermission = (...permissions) => (req, _res, next) => {
  if (!req.user) return next(ApiError.unauthorized());
  const ok = permissions.some((p) => roleHasPermission(req.user.role, p));
  if (!ok) return next(ApiError.forbidden('You do not have permission to perform this action'));
  return next();
};
