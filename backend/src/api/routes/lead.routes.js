import { Router } from 'express';
import Joi from 'joi';
import { authenticate } from '../middlewares/auth.middleware.js';
import { requireTenant } from '../middlewares/tenant.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { STAFF_ROLES } from '../../constants/roles.js';
import { LEAD_STATUS } from '../../models/Lead.js';
import {
  convertLeadHandler,
  createLeadHandler,
  listLeadsHandler,
  startTrialHandler,
  updateLeadHandler,
} from '../controllers/lead.controller.js';

const router = Router();
router.use(authenticate, requireTenant, requireRole(...STAFF_ROLES));

router.get('/', validate({ query: Joi.object({ page: Joi.number().integer().min(1), pageSize: Joi.number().integer().min(1).max(100), status: Joi.string().valid(...Object.values(LEAD_STATUS)), q: Joi.string() }) }), listLeadsHandler);
router.post('/', validate({ body: Joi.object({ name: Joi.string().min(2).required(), phone: Joi.string().allow('', null), email: Joi.string().email().allow('', null), source: Joi.string(), notes: Joi.string().allow('', null), followUpAt: Joi.date().iso(), assignedToUserId: Joi.string().uuid() }) }), createLeadHandler);
router.patch('/:id', validate({ params: Joi.object({ id: Joi.string().uuid().required() }), body: Joi.object({ name: Joi.string().min(2), phone: Joi.string().allow('', null), email: Joi.string().email().allow('', null), status: Joi.string().valid(...Object.values(LEAD_STATUS)), notes: Joi.string().allow('', null), followUpAt: Joi.date().iso().allow(null), assignedToUserId: Joi.string().uuid().allow(null) }).min(1) }), updateLeadHandler);
router.post('/:id/start-trial', validate({ params: Joi.object({ id: Joi.string().uuid().required() }), body: Joi.object({ planId: Joi.string().uuid().required() }) }), startTrialHandler);
router.post('/:id/convert', validate({ params: Joi.object({ id: Joi.string().uuid().required() }), body: Joi.object({ memberId: Joi.string().uuid().required() }) }), convertLeadHandler);

export default router;
