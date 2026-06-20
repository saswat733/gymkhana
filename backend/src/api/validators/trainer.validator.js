import Joi from 'joi';
import { listQuery } from './common.validator.js';

export const trainerIdParamSchema = {
  params: Joi.object({
    trainerId: Joi.string().uuid().required(),
  }),
};

export const memberIdParamSchema = {
  params: Joi.object({
    memberId: Joi.string().uuid().required(),
  }),
};

export const trainerAndMemberIdParamSchema = {
  params: Joi.object({
    trainerId: Joi.string().uuid().required(),
    memberId: Joi.string().uuid().required(),
  }),
};

export const assignMemberSchema = {
  body: Joi.object({
    memberId: Joi.string().uuid().required(),
  }),
};

export const listTrainerMembersSchema = {
  query: listQuery({ defaultPageSize: 20, maxPageSize: 100 }).keys({}),
};

