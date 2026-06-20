import { Router } from 'express';
import Joi from 'joi';
import { authenticate } from '../middlewares/auth.middleware.js';
import { requireTenant } from '../middlewares/tenant.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { ADMIN_LIKE_ROLES } from '../../constants/roles.js';
import { RETENTION_TRIGGER, RETENTION_ACTION } from '../../models/RetentionRule.js';
import * as retentionService from '../../services/retention.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendCreated, sendSuccess } from '../../utils/ApiResponse.js';

const router = Router();
router.use(authenticate, requireTenant, requireRole(...ADMIN_LIKE_ROLES, 'manager'));

router.get('/', asyncHandler(async (req, res) => {
  const rules = await retentionService.listRules({ gymId: req.gymId });
  return sendSuccess(res, { data: { rules } });
}));

router.post('/', validate({ body: Joi.object({ name: Joi.string().min(2).required(), triggerType: Joi.string().valid(...Object.values(RETENTION_TRIGGER)).required(), triggerDays: Joi.number().integer().min(1).max(90), actionType: Joi.string().valid(...Object.values(RETENTION_ACTION)), messageTemplate: Joi.string().allow('', null), isActive: Joi.boolean() }) }), asyncHandler(async (req, res) => {
  const rule = await retentionService.createRule({ gymId: req.gymId, ...req.body });
  return sendCreated(res, { message: 'Rule created', data: { rule } });
}));

router.patch('/:id', validate({ params: Joi.object({ id: Joi.string().uuid().required() }), body: Joi.object({ name: Joi.string().min(2), triggerDays: Joi.number().integer().min(1).max(90), messageTemplate: Joi.string().allow('', null), isActive: Joi.boolean() }).min(1) }), asyncHandler(async (req, res) => {
  const rule = await retentionService.updateRule({ gymId: req.gymId, id: req.params.id, patch: req.body });
  return sendSuccess(res, { message: 'Rule updated', data: { rule } });
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  await retentionService.deleteRule({ gymId: req.gymId, id: req.params.id });
  return sendSuccess(res, { message: 'Rule deleted' });
}));

router.post('/run', asyncHandler(async (req, res) => {
  const result = await retentionService.runRetentionRules({ gymId: req.gymId });
  return sendSuccess(res, { message: 'Retention rules executed', data: result });
}));

export default router;
