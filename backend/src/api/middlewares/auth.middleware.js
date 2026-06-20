import { ApiError } from '../../utils/ApiError.js';
import { verifyAccessToken } from '../../utils/jwt.js';
import { User } from '../../models/index.js';

/**
 * Authenticates the request using a Bearer JWT and attaches `req.user`.
 * Throws 401 if missing/invalid; downstream RBAC middleware enforces roles.
 */
export const authenticate = async (req, _res, next) => {
  try {
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');
    if (scheme !== 'Bearer' || !token) {
      throw ApiError.unauthorized('Missing or malformed Authorization header');
    }

    const decoded = verifyAccessToken(token);
    const user = await User.findByPk(decoded.sub);
    if (!user || !user.isActive) {
      throw ApiError.unauthorized('User no longer exists or is disabled');
    }

    req.user = user;
    req.auth = decoded;
    next();
  } catch (err) {
    next(err);
  }
};
