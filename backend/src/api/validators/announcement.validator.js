import Joi from 'joi';
import { listQuery } from './common.validator.js';
import { ANNOUNCEMENT_AUDIENCE } from '../../models/Announcement.js';

export const createAnnouncementSchema = {
  body: Joi.object({
    title: Joi.string().trim().min(2).max(160).required(),
    body: Joi.string().trim().min(2).max(20_000).required(),
    audience: Joi.string()
      .valid(...Object.values(ANNOUNCEMENT_AUDIENCE))
      .default(ANNOUNCEMENT_AUDIENCE.ALL),
    isPublished: Joi.boolean().default(false),
    publishAt: Joi.date().iso().allow(null),
    expiresAt: Joi.date().iso().allow(null),
  }),
};

export const updateAnnouncementSchema = {
  body: Joi.object({
    title: Joi.string().trim().min(2).max(160),
    body: Joi.string().trim().min(2).max(20_000),
    audience: Joi.string().valid(...Object.values(ANNOUNCEMENT_AUDIENCE)),
    isPublished: Joi.boolean(),
    publishAt: Joi.date().iso().allow(null),
    expiresAt: Joi.date().iso().allow(null),
  }).min(1),
};

export const announcementIdParamSchema = {
  params: Joi.object({
    id: Joi.string().uuid().required(),
  }),
};

export const listAnnouncementsSchema = {
  query: listQuery({ defaultPageSize: 20, maxPageSize: 100 }).keys({
    audience: Joi.string().valid(...Object.values(ANNOUNCEMENT_AUDIENCE)).optional(),
    isPublished: Joi.boolean().optional(),
  }),
};

export const listInboxSchema = {
  query: listQuery({ defaultPageSize: 20, maxPageSize: 100 }).keys({}),
};

