import { Router } from 'express';
import { validate } from '../middlewares/validate.middleware.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import {
  changePasswordHandler,
  forgotPasswordHandler,
  loginHandler,
  meHandler,
  refreshHandler,
  registerHandler,
  resetPasswordHandler,
} from '../controllers/auth.controller.js';
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  refreshSchema,
  registerSchema,
  resetPasswordSchema,
} from '../validators/auth.validator.js';

const router = Router();

router.post('/register', validate(registerSchema), registerHandler);
router.post('/login', validate(loginSchema), loginHandler);
router.post('/refresh', validate(refreshSchema), refreshHandler);
router.post('/forgot-password', validate(forgotPasswordSchema), forgotPasswordHandler);
router.post('/reset-password', validate(resetPasswordSchema), resetPasswordHandler);
router.get('/me', authenticate, meHandler);
router.post('/change-password', authenticate, validate(changePasswordSchema), changePasswordHandler);

export default router;
