import Joi from 'joi';
import { listQuery } from './common.validator.js';
import { PAYMENT_STATUS } from '../../models/Payment.js';

export const listPaymentsSchema = {
  query: listQuery({ defaultPageSize: 20, maxPageSize: 100 }).keys({
    subscriptionId: Joi.string().uuid().required(),
  }),
};

export const createPaymentSchema = {
  body: Joi.object({
    subscriptionId: Joi.string().uuid().required(),
    amountCents: Joi.number().integer().min(0).max(100_000_000).required(),
    currency: Joi.string().trim().uppercase().length(3).default('INR'),
    method: Joi.string().trim().max(30).required(),
    status: Joi.string()
      .valid(...Object.values(PAYMENT_STATUS))
      .default(PAYMENT_STATUS.PAID),
    paidAt: Joi.date().iso().optional(),
    gatewayRef: Joi.string().trim().max(120).allow('', null),
    notes: Joi.string().trim().max(5000).allow('', null),
  }),
};
