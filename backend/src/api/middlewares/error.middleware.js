import { ApiError } from '../../utils/ApiError.js';
import { logger } from '../../config/logger.js';
import { isProd } from '../../config/env.js';

export const notFoundHandler = (req, _res, next) => {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
};

export const errorHandler = (err, req, res, _next) => {
  let error = err;

  if (err?.name === 'SequelizeValidationError' || err?.name === 'SequelizeUniqueConstraintError') {
    const details = (err.errors || []).map((e) => ({ field: e.path, message: e.message }));
    error = ApiError.unprocessable('Database validation failed', { details });
  }

  if (!(error instanceof ApiError)) {
    error = ApiError.internal(error?.message || 'Unexpected server error');
  }

  const logPayload = {
    method: req.method,
    url: req.originalUrl,
    statusCode: error.statusCode,
    code: error.code,
    userId: req.user?.id,
  };

  if (error.statusCode >= 500) {
    logger.error(error.message, { ...logPayload, stack: err.stack });
  } else {
    logger.warn(error.message, logPayload);
  }

  const body = {
    success: false,
    message: error.message,
    error: {
      code: error.code,
      details: error.details ?? undefined,
    },
  };
  if (!isProd && err.stack) body.error.stack = err.stack;

  res.status(error.statusCode).json(body);
};
