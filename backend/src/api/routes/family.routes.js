import { Router } from 'express';
import Joi from 'joi';
import { authenticate } from '../middlewares/auth.middleware.js';
import { requireTenant } from '../middlewares/tenant.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { STAFF_ROLES } from '../../constants/roles.js';
import * as familyService from '../../services/family.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendCreated, sendSuccess } from '../../utils/ApiResponse.js';

const router = Router();
router.use(authenticate, requireTenant, requireRole(...STAFF_ROLES));

router.get('/', asyncHandler(async (req, res) => {
  const groups = await familyService.listFamilyGroups({ gymId: req.gymId });
  return sendSuccess(res, { data: { familyGroups: groups } });
}));

router.post('/', validate({ body: Joi.object({ name: Joi.string().min(2).required(), payerMemberId: Joi.string().uuid().required(), members: Joi.array().items(Joi.object({ memberId: Joi.string().uuid().required(), relationship: Joi.string().valid('parent', 'child', 'spouse', 'member') })) }) }), asyncHandler(async (req, res) => {
  const group = await familyService.createFamilyGroup({ gymId: req.gymId, ...req.body });
  return sendCreated(res, { message: 'Family group created', data: { familyGroup: group } });
}));

export default router;
