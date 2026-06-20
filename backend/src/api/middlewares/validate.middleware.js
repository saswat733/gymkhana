import { ApiError } from '../../utils/ApiError.js';

/**
 * Joi validation middleware factory.
 * Pass an object with optional `body`, `params`, `query` Joi schemas.
 * On success the validated/coerced values replace req.body/params/query.
 */
export const validate = (schemas) => (req, _res, next) => {
  const targets = ['body', 'params', 'query'];
  const details = [];

  for (const key of targets) {
    const schema = schemas?.[key];
    if (!schema) continue;
    const { value, error } = schema.validate(req[key], {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });
    if (error) {
      details.push(...error.details.map((d) => ({ field: d.path.join('.'), message: d.message, in: key })));
    } else {
      req[key] = value;
    }
  }

  if (details.length) {
    return next(ApiError.unprocessable('Validation failed', { details }));
  }
  next();
};
