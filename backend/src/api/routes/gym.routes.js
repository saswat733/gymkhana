import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';
import { requireTenant } from '../middlewares/tenant.middleware.js';
import { requirePermission } from '../middlewares/permission.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { PERMISSIONS } from '../../constants/permissions.js';
import { onboardGymHandler, getMyGymHandler, updateMyGymHandler } from '../controllers/gym.controller.js';
import { onboardGymSchema, updateGymProfileSchema } from '../validators/gym.validator.js';

const router = Router();

router.post('/onboard', validate(onboardGymSchema), onboardGymHandler);

router.use(authenticate);
router.use(requireTenant);

router.get('/me', getMyGymHandler);
router.patch('/me', requirePermission(PERMISSIONS.GYM_SETTINGS_WRITE), validate(updateGymProfileSchema), updateMyGymHandler);

export default router;
