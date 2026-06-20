import Joi from 'joi';

export const uuidParam = Joi.object({
  id: Joi.string().uuid().required(),
});

export const listQuery = (options = {}) => Joi.object({
  page: Joi.number().integer().min(1).default(1),
  pageSize: Joi.number().integer().min(1).max(options.maxPageSize ?? 100).default(options.defaultPageSize ?? 20),
  sort: Joi.string().max(100).optional(),
  q: Joi.string().trim().max(100).allow('').optional(),
  isActive: Joi.boolean().optional(),
});

