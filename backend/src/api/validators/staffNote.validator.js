import Joi from 'joi';

export const memberNoteIdParamSchema = {
  params: Joi.object({
    id: Joi.string().uuid().required(),
    noteId: Joi.string().uuid().required(),
  }),
};

export const createStaffNoteSchema = {
  params: Joi.object({
    id: Joi.string().uuid().required(),
  }),
  body: Joi.object({
    body: Joi.string().trim().min(1).max(10000).required(),
    pinned: Joi.boolean().optional(),
  }),
};

export const updateStaffNoteSchema = {
  params: Joi.object({
    id: Joi.string().uuid().required(),
    noteId: Joi.string().uuid().required(),
  }),
  body: Joi.object({
    body: Joi.string().trim().min(1).max(10000).optional(),
    pinned: Joi.boolean().optional(),
  }).min(1),
};
