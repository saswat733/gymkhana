import Joi from 'joi';
import { uuidParam, listQuery } from './common.validator.js';

export const subscriptionIdParamSchema = { params: uuidParam };

export const listSubscriptionsSchema = {
  query: listQuery({ defaultPageSize: 20, maxPageSize: 100 }).keys({
    memberId: Joi.string().uuid().optional(),
    status: Joi.string().trim().max(30).optional(),
  }),
};

export const createSubscriptionSchema = {
  body: Joi.object({
    memberId: Joi.string().uuid().required(),
    planId: Joi.string().uuid().required(),
    startsAt: Joi.date().iso().optional(),
    autoRenew: Joi.boolean().optional(),
  }),
};

export const createSelfSubscriptionSchema = {
  body: Joi.object({
    planId: Joi.string().uuid().required(),
    autoRenew: Joi.boolean().optional(),
  }),
};

