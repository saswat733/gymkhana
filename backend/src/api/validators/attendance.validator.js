import Joi from 'joi';
import { listQuery } from './common.validator.js';
import { ATTENDANCE_SOURCE } from '../../models/Attendance.js';

export const memberIdBodySchema = {
  body: Joi.object({
    memberId: Joi.string().uuid().required(),
    source: Joi.string()
      .valid(...Object.values(ATTENDANCE_SOURCE))
      .optional(),
    qr: Joi.string().trim().max(2000).optional(),
  }),
};

export const listAttendanceSchema = {
  query: listQuery({ defaultPageSize: 20, maxPageSize: 100 }).keys({
    memberId: Joi.string().uuid().optional(),
    from: Joi.date().iso().optional(),
    to: Joi.date().iso().optional(),
  }),
};

export const verifyPassSchema = {
  body: Joi.object({
    passCode: Joi.string().trim().min(10).max(200).required(),
    checkIn: Joi.boolean().default(true),
  }),
};

export const scanGymQrSchema = {
  body: Joi.object({
    memberId: Joi.string().uuid().required(),
    qrPayload: Joi.string().trim().min(20).max(2000).required(),
  }),
};
