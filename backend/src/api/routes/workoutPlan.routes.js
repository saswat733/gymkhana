import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';
import { requireTenant } from '../middlewares/tenant.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { ROLES } from '../../constants/roles.js';
import {
  createWorkoutPlanHandler,
  deleteWorkoutPlanHandler,
  listWorkoutPlansHandler,
  updateWorkoutPlanHandler,
} from '../controllers/workoutPlan.controller.js';
import {
  createWorkoutPlanSchema,
  listWorkoutPlansSchema,
  updateWorkoutPlanSchema,
  workoutPlanIdParamSchema,
} from '../validators/workoutPlan.validator.js';

const router = Router();

router.use(authenticate);
router.use(requireTenant);

router.get('/', validate(listWorkoutPlansSchema), listWorkoutPlansHandler);
router.post('/', requireRole(ROLES.ADMIN, ROLES.TRAINER), validate(createWorkoutPlanSchema), createWorkoutPlanHandler);
router.patch(
  '/:id',
  requireRole(ROLES.ADMIN, ROLES.TRAINER),
  validate(workoutPlanIdParamSchema),
  validate(updateWorkoutPlanSchema),
  updateWorkoutPlanHandler,
);
router.delete('/:id', requireRole(ROLES.ADMIN, ROLES.TRAINER), validate(workoutPlanIdParamSchema), deleteWorkoutPlanHandler);

export default router;

