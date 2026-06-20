/**
 * Standard success envelope used across the API.
 * Keeping a consistent response shape prevents frontends from special-casing endpoints.
 *
 * Shape:
 * {
 *   "success": true,
 *   "message": "OK",
 *   "data": <payload>,
 *   "meta": { ... }   // optional (pagination, etc.)
 * }
 */
export const sendSuccess = (res, { statusCode = 200, message = 'OK', data = null, meta } = {}) => {
  const body = { success: true, message, data };
  if (meta !== undefined) body.meta = meta;
  return res.status(statusCode).json(body);
};

export const sendCreated = (res, payload) =>
  sendSuccess(res, { statusCode: 201, message: 'Created', ...payload });
