import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';
import { requireTenant } from '../middlewares/tenant.middleware.js';
import { getMyEngagementHandler } from '../controllers/engagement.controller.js';

const router = Router();

router.use(authenticate);
router.use(requireTenant);

router.get('/me', getMyEngagementHandler);

export default router;

