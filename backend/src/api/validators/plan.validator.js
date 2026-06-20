import Joi from 'joi';
import { listQuery, uuidParam } from './common.validator.js';

export const planIdParamSchema = {
  params: uuidParam,
};

export const listPlansSchema = {
  query: listQuery({ defaultPageSize: 20, maxPageSize: 100 }),
};

export const createPlanSchema = {
  body: Joi.object({
    name: Joi.string().trim().min(2).max(120).required(),
    durationMonths: Joi.number().integer().min(1).max(120).required(),
    priceCents: Joi.number().integer().min(0).max(100_000_000).required(),
    perks: Joi.string().trim().max(5000).allow('', null),
    isActive: Joi.boolean().optional(),
  }),
};

export const updatePlanSchema = {
  params: uuidParam,
  body: Joi.object({
    name: Joi.string().trim().min(2).max(120).optional(),
    durationMonths: Joi.number().integer().min(1).max(120).optional(),
    priceCents: Joi.number().integer().min(0).max(100_000_000).optional(),
    perks: Joi.string().trim().max(5000).allow('', null).optional(),
    isActive: Joi.boolean().optional(),
  }).min(1),
};

export const setPlanActiveSchema = {
  params: uuidParam,
  body: Joi.object({
    isActive: Joi.boolean().required(),
  }),
};

