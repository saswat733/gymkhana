import { Router } from 'express';
import Joi from 'joi';
import { authenticate } from '../middlewares/auth.middleware.js';
import { requireTenant } from '../middlewares/tenant.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { STAFF_ROLES, ADMIN_LIKE_ROLES } from '../../constants/roles.js';
import { SHIFT_TYPE } from '../../models/StaffShift.js';
import * as shiftService from '../../services/staffShift.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendCreated, sendSuccess } from '../../utils/ApiResponse.js';

const router = Router();
router.use(authenticate, requireTenant, requireRole(...STAFF_ROLES));

router.get('/', asyncHandler(async (req, res) => {
  const shifts = await shiftService.listShifts({ gymId: req.gymId, from: req.query.from, to: req.query.to, userId: req.query.userId });
  return sendSuccess(res, { data: { shifts } });
}));

router.post('/', requireRole(...ADMIN_LIKE_ROLES, 'manager'), validate({ body: Joi.object({ userId: Joi.string().uuid().required(), shiftDate: Joi.date().iso().required(), shiftType: Joi.string().valid(...Object.values(SHIFT_TYPE)), startsAt: Joi.string(), endsAt: Joi.string(), notes: Joi.string().max(500) }) }), asyncHandler(async (req, res) => {
  const shift = await shiftService.createShift({ gymId: req.gymId, ...req.body });
  return sendCreated(res, { message: 'Shift created', data: { shift } });
}));

router.delete('/:id', requireRole(...ADMIN_LIKE_ROLES, 'manager'), asyncHandler(async (req, res) => {
  await shiftService.deleteShift({ gymId: req.gymId, id: req.params.id });
  return sendSuccess(res, { message: 'Shift deleted' });
}));

export default router;
