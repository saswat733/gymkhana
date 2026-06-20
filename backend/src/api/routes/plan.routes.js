import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';
import { cacheGet } from '../middlewares/cache.middleware.js';
import { requireTenant } from '../middlewares/tenant.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { ROLES } from '../../constants/roles.js';
import {
  createPlanHandler,
  getPlanHandler,
  listPlansHandler,
  setPlanActiveHandler,
  updatePlanHandler,
} from '../controllers/plan.controller.js';
import {
  createPlanSchema,
  listPlansSchema,
  planIdParamSchema,
  setPlanActiveSchema,
  updatePlanSchema,
} from '../validators/plan.validator.js';

const router = Router();

router.use(authenticate);
router.use(requireTenant);

// Members need a read-only catalog to purchase/subscribe in mobile.
router.get(
  '/catalog',
  requireRole(ROLES.ADMIN, ROLES.TRAINER, ROLES.MEMBER),
  validate(listPlansSchema),
  cacheGet({ key: (req) => `plans:catalog:${JSON.stringify(req.query ?? {})}` }),
  listPlansHandler,
);

router.use(requireRole(ROLES.ADMIN));

router.get(
  '/',
  validate(listPlansSchema),
  cacheGet({ key: (req) => `plans:list:${JSON.stringify(req.query ?? {})}` }),
  listPlansHandler,
);
router.post('/', validate(createPlanSchema), createPlanHandler);
router.get('/:id', validate(planIdParamSchema), getPlanHandler);
router.patch('/:id', validate(updatePlanSchema), updatePlanHandler);
router.patch('/:id/active', validate(setPlanActiveSchema), setPlanActiveHandler);

export default router;

