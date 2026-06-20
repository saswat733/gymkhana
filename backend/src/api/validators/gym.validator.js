import Joi from 'joi';

export const onboardGymSchema = {
  body: Joi.object({
    gymName: Joi.string().trim().min(2).max(160).required(),
    slug: Joi.string().trim().min(2).max(80).optional(),
    ownerName: Joi.string().trim().min(2).max(120).required(),
    ownerEmail: Joi.string().email().required(),
    ownerPassword: Joi.string().min(8).max(128).required(),
    ownerPhone: Joi.string().trim().max(20).allow('', null),
    planCode: Joi.string().trim().default('basic'),
    billingCycle: Joi.string().valid('monthly', 'yearly').default('monthly'),
  }),
};

export const updateGymProfileSchema = {
  body: Joi.object({
    name: Joi.string().trim().min(2).max(160),
    legalName: Joi.string().trim().max(200).allow('', null),
    gstin: Joi.string().trim().max(20).allow('', null),
    billingAddressLine1: Joi.string().trim().max(200).allow('', null),
    billingAddressLine2: Joi.string().trim().max(200).allow('', null),
    billingCity: Joi.string().trim().max(80).allow('', null),
    billingState: Joi.string().trim().max(80).allow('', null),
    billingPincode: Joi.string().trim().max(12).allow('', null),
    timezone: Joi.string().trim().max(64),
    currency: Joi.string().trim().length(3),
    defaultGstPercent: Joi.number().min(0).max(28),
    logoUrl: Joi.string().uri().max(500).allow('', null),
    brandPrimaryColor: Joi.string().trim().max(20).allow('', null),
    brandSecondaryColor: Joi.string().trim().max(20).allow('', null),
    customDomain: Joi.string().trim().max(200).allow('', null),
  }).min(1),
};
