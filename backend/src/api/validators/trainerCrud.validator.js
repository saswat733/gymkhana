import Joi from 'joi';
import { listQuery } from './common.validator.js';

export const createTrainerSchema = {
  body: Joi.object({
    name: Joi.string().trim().min(2).max(120).required(),
    email: Joi.string().email().required(),
    phone: Joi.string().trim().max(20).allow('', null),
    password: Joi.string().min(8).max(128).required(),
    bio: Joi.string().trim().max(5000).allow('', null),
    specialization: Joi.string().trim().max(120).allow('', null),
    isActive: Joi.boolean().default(true),
  }),
};

export const listTrainersSchema = {
  query: listQuery({ defaultPageSize: 20, maxPageSize: 100 }).keys({
    q: Joi.string().trim().max(120).optional(),
    isActive: Joi.boolean().optional(),
  }),
};
