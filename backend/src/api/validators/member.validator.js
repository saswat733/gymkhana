import Joi from 'joi';
import { listQuery, uuidParam } from './common.validator.js';

const email = Joi.string().email({ tlds: { allow: false } }).lowercase();

export const memberIdParamSchema = {
  params: uuidParam,
};

export const listMembersSchema = {
  query: listQuery({ defaultPageSize: 20, maxPageSize: 100 }),
};

const memberProfile = {
  dob: Joi.date().iso().allow(null),
  gender: Joi.string().trim().max(20).allow('', null),
  address: Joi.string().trim().max(5000).allow('', null),
  emergencyContactName: Joi.string().trim().max(120).allow('', null),
  emergencyContactPhone: Joi.string().trim().max(20).allow('', null),
  joinedAt: Joi.date().iso().allow(null),
  notes: Joi.string().trim().max(5000).allow('', null),
  isActive: Joi.boolean().optional(),
};

export const createMemberSchema = {
  body: Joi.object({
    name: Joi.string().trim().min(2).max(120).required(),
    email: email.required(),
    phone: Joi.string().trim().max(20).allow('', null),
    password: Joi.string().min(8).max(128).required(),
    ...memberProfile,
  }),
};

export const updateMemberSchema = {
  params: uuidParam,
  body: Joi.object({
    name: Joi.string().trim().min(2).max(120).optional(),
    email: email.optional(),
    phone: Joi.string().trim().max(20).allow('', null).optional(),
    ...memberProfile,
  }).min(1),
};

export const setMemberActiveSchema = {
  params: uuidParam,
  body: Joi.object({
    isActive: Joi.boolean().required(),
  }),
};

