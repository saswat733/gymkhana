import { Router } from 'express';
import Joi from 'joi';
import { authenticate } from '../middlewares/auth.middleware.js';
import { requireTenant } from '../middlewares/tenant.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { STAFF_ROLES } from '../../constants/roles.js';
import * as freezeService from '../../services/freeze.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendCreated, sendSuccess } from '../../utils/ApiResponse.js';

const router = Router();
router.use(authenticate, requireTenant, requireRole(...STAFF_ROLES));

router.get('/', asyncHandler(async (req, res) => {
  const freezes = await freezeService.listFreezes({ gymId: req.gymId, memberId: req.query.memberId });
  return sendSuccess(res, { data: { freezes } });
}));

router.post('/', validate({ body: Joi.object({ subscriptionId: Joi.string().uuid().required(), startsAt: Joi.date().iso().required(), endsAt: Joi.date().iso().required(), reason: Joi.string().max(500).allow('', null) }) }), asyncHandler(async (req, res) => {
  const freeze = await freezeService.freezeSubscription({ gymId: req.gymId, createdByUserId: req.user.id, ...req.body });
  return sendCreated(res, { message: 'Membership frozen', data: { freeze } });
}));

router.post('/:id/cancel', validate({ params: Joi.object({ id: Joi.string().uuid().required() }) }), asyncHandler(async (req, res) => {
  const freeze = await freezeService.cancelFreeze({ gymId: req.gymId, freezeId: req.params.id });
  return sendSuccess(res, { message: 'Freeze cancelled', data: { freeze } });
}));

export default router;
