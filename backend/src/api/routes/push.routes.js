import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';
import { requireTenant } from '../middlewares/tenant.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { registerPushTokenHandler } from '../controllers/push.controller.js';
import Joi from 'joi';

const registerSchema = {
  body: Joi.object({
    token: Joi.string().trim().min(10).max(255).required(),
    platform: Joi.string().valid('ios', 'android', 'web').optional(),
  }),
};

const router = Router();

router.use(authenticate);
router.use(requireTenant);

router.post('/register', validate(registerSchema), registerPushTokenHandler);

export default router;
