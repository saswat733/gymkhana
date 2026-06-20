import Joi from 'joi';

export const startSubscriptionSchema = {
  body: Joi.object({
    planCode: Joi.string().trim().min(2).max(40).required(),
    billingCycle: Joi.string().valid('monthly', 'yearly').default('monthly'),
    trialDays: Joi.number().integer().min(0).max(90).default(14),
  }),
};

export const generateInvoiceSchema = {
  body: Joi.object({
    dueDays: Joi.number().integer().min(0).max(60).default(7),
    gstPercent: Joi.number().min(0).max(28).default(18),
  }),
};

export const invoiceIdParamSchema = {
  params: Joi.object({
    id: Joi.string().uuid().required(),
  }),
};

