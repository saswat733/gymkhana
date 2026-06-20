import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { requireTenant } from '../middlewares/tenant.middleware.js';
import { ROLES } from '../../constants/roles.js';
import { Member } from '../../models/index.js';
import { ApiError } from '../../utils/ApiError.js';
import { STAFF_ROLES } from '../../constants/roles.js';
import { requireRole } from '../middlewares/role.middleware.js';
import {
  checkInHandler,
  checkOutHandler,
  listAttendanceHandler,
  scanGymQrHandler,
  verifyPassHandler,
} from '../controllers/attendance.controller.js';
import { listAttendanceSchema, memberIdBodySchema, scanGymQrSchema, verifyPassSchema } from '../validators/attendance.validator.js';

const router = Router();

router.use(authenticate);
router.use(requireTenant);

const ensureMemberSelfOrStaff = async (req, res, next) => {
  if (STAFF_ROLES.includes(req.user.role)) return next();

  if (req.user.role !== ROLES.MEMBER) return next(ApiError.forbidden());

  const member = await Member.findOne({ where: { userId: req.user.id, gymId: req.gymId } });
  if (!member) return next(ApiError.notFound('Member profile not found'));

  const requested = req.body?.memberId;
  if (!requested || requested !== member.id) {
    return next(ApiError.forbidden('Members can only manage their own attendance'));
  }
  return next();
};

/** Members may list only their own rows; staff may filter by any memberId (or none). */
const scopeListAttendanceQuery = async (req, _res, next) => {
  try {
    if (STAFF_ROLES.includes(req.user.role)) return next();

    if (req.user.role !== ROLES.MEMBER) return next(ApiError.forbidden());

    const member = await Member.findOne({ where: { userId: req.user.id, gymId: req.gymId } });
    if (!member) return next(ApiError.notFound('Member profile not found'));

    if (req.query.memberId && req.query.memberId !== member.id) {
      return next(ApiError.forbidden('Members can only view their own attendance'));
    }

    req.query.memberId = member.id;
    return next();
  } catch (e) {
    return next(e);
  }
};

router.post('/check-in', ensureMemberSelfOrStaff, validate(memberIdBodySchema), checkInHandler);
router.post('/scan-gym-qr', ensureMemberSelfOrStaff, validate(scanGymQrSchema), scanGymQrHandler);
router.post('/check-out', ensureMemberSelfOrStaff, validate(memberIdBodySchema), checkOutHandler);

router.get('/', scopeListAttendanceQuery, validate(listAttendanceSchema), listAttendanceHandler);

router.post(
  '/verify-pass',
  requireRole(...STAFF_ROLES),
  validate(verifyPassSchema),
  verifyPassHandler,
);

export default router;
