import Joi from 'joi';

export const createMemberOrderSchema = {
  body: Joi.object({
    planId: Joi.string().uuid().required(),
  }),
};

export const verifyMemberPaymentSchema = {
  body: Joi.object({
    orderId: Joi.string().trim().required(),
    paymentId: Joi.string().trim().required(),
    signature: Joi.string().trim().required(),
  }),
};

export const memberOrderStatusSchema = {
  params: Joi.object({
    orderId: Joi.string().trim().required(),
  }),
};
