import Joi from 'joi';

const email = Joi.string().email({ tlds: { allow: false } }).lowercase();

const password = Joi.string()
  .min(8)
  .max(128)
  .pattern(/[A-Z]/, 'uppercase letter')
  .pattern(/[a-z]/, 'lowercase letter')
  .pattern(/[0-9]/, 'digit')
  .messages({
    'string.pattern.name': 'Password must contain at least one {#name}',
  });

export const registerSchema = {
  body: Joi.object({
    name: Joi.string().trim().min(2).max(120).required(),
    email: email.required(),
    phone: Joi.string().trim().max(20).allow('', null),
    password: password.required(),
  }),
};

export const loginSchema = {
  body: Joi.object({
    email: email.required(),
    password: Joi.string().required(),
  }),
};

export const refreshSchema = {
  body: Joi.object({
    refreshToken: Joi.string().required(),
  }),
};

export const changePasswordSchema = {
  body: Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: password.required(),
  }),
};

export const forgotPasswordSchema = {
  body: Joi.object({
    email: email.required(),
  }),
};

export const resetPasswordSchema = {
  body: Joi.object({
    token: Joi.string().trim().min(20).max(2000).required(),
    newPassword: password.required(),
  }),
};
