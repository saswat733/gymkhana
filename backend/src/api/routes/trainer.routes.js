import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';
import { requirePermission } from '../middlewares/permission.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { requireTenant } from '../middlewares/tenant.middleware.js';
import { requirePlatformAccess } from '../middlewares/saasAccess.middleware.js';
import { ADMIN_LIKE_ROLES, ROLES, STAFF_ROLES } from '../../constants/roles.js';
import { PERMISSIONS } from '../../constants/permissions.js';
import {
  assignTrainerMemberHandler,
  createTrainerHandler,
  listTrainerMembersHandler,
  listTrainersHandler,
  unassignTrainerMemberHandler,
} from '../controllers/trainer.controller.js';
import {
  assignMemberSchema,
  listTrainerMembersSchema,
  trainerAndMemberIdParamSchema,
  trainerIdParamSchema,
} from '../validators/trainer.validator.js';
import { createTrainerSchema, listTrainersSchema } from '../validators/trainerCrud.validator.js';

const router = Router();

router.use(authenticate);
router.use(requireTenant);
router.use(requirePlatformAccess);

router.get('/', requirePermission(PERMISSIONS.TRAINERS_READ), validate(listTrainersSchema), listTrainersHandler);
router.post(
  '/',
  requirePermission(PERMISSIONS.TRAINERS_WRITE),
  requireRole(...ADMIN_LIKE_ROLES, ROLES.MANAGER),
  validate(createTrainerSchema),
  createTrainerHandler,
);

router.use(requireRole(...STAFF_ROLES));

router.get('/:trainerId/members', validate(trainerIdParamSchema), validate(listTrainerMembersSchema), listTrainerMembersHandler);
router.post('/:trainerId/members', validate(trainerIdParamSchema), validate(assignMemberSchema), assignTrainerMemberHandler);
router.delete(
  '/:trainerId/members/:memberId',
  validate(trainerAndMemberIdParamSchema),
  unassignTrainerMemberHandler,
);

export default router;

