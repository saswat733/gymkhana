/**
 * Operational error thrown from anywhere in the app.
 * The global error middleware converts these into a standard JSON response.
 */
export class ApiError extends Error {
  constructor(statusCode, message, { code, details, isOperational = true } = {}) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code ?? null;
    this.details = details ?? null;
    this.isOperational = isOperational;
    Error.captureStackTrace?.(this, this.constructor);
  }

  static badRequest(msg = 'Bad Request', opts) { return new ApiError(400, msg, { code: 'BAD_REQUEST', ...opts }); }
  static unauthorized(msg = 'Unauthorized', opts) { return new ApiError(401, msg, { code: 'UNAUTHORIZED', ...opts }); }
  static forbidden(msg = 'Forbidden', opts) { return new ApiError(403, msg, { code: 'FORBIDDEN', ...opts }); }
  static notFound(msg = 'Not Found', opts) { return new ApiError(404, msg, { code: 'NOT_FOUND', ...opts }); }
  static conflict(msg = 'Conflict', opts) { return new ApiError(409, msg, { code: 'CONFLICT', ...opts }); }
  static unprocessable(msg = 'Unprocessable Entity', opts) { return new ApiError(422, msg, { code: 'UNPROCESSABLE', ...opts }); }
  static internal(msg = 'Internal Server Error', opts) { return new ApiError(500, msg, { code: 'INTERNAL', isOperational: false, ...opts }); }
}
