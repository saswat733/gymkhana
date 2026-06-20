import Joi from 'joi';
import { listQuery } from './common.validator.js';

export const workoutPlanIdParamSchema = {
  params: Joi.object({
    id: Joi.string().uuid().required(),
  }),
};

export const createWorkoutPlanSchema = {
  body: Joi.object({
    memberId: Joi.string().uuid().required(),
    trainerId: Joi.string().uuid().allow(null),
    title: Joi.string().trim().min(2).max(160).required(),
    notes: Joi.string().trim().max(20_000).allow('', null),
    planJson: Joi.any().allow(null),
    isActive: Joi.boolean().default(true),
  }),
};

export const updateWorkoutPlanSchema = {
  body: Joi.object({
    title: Joi.string().trim().min(2).max(160),
    notes: Joi.string().trim().max(20_000).allow('', null),
    planJson: Joi.any().allow(null),
    isActive: Joi.boolean(),
  }).min(1),
};

export const listWorkoutPlansSchema = {
  query: listQuery({ defaultPageSize: 20, maxPageSize: 100 }).keys({
    memberId: Joi.string().uuid().optional(),
    trainerId: Joi.string().uuid().optional(),
    isActive: Joi.boolean().optional(),
  }),
};

