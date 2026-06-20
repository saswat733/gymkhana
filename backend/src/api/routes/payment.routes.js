import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { requireIdempotencyKey } from '../middlewares/idempotency.middleware.js';
import { requireTenant } from '../middlewares/tenant.middleware.js';
import { ROLES } from '../../constants/roles.js';
import { createPaymentHandler, listPaymentsHandler } from '../controllers/payment.controller.js';
import { createPaymentSchema, listPaymentsSchema } from '../validators/payment.validator.js';
import {
  createMemberOrderHandler,
  getMemberOrderStatusHandler,
  verifyMemberPaymentHandler,
} from '../controllers/memberPayment.controller.js';
import {
  createMemberOrderSchema,
  memberOrderStatusSchema,
  verifyMemberPaymentSchema,
} from '../validators/memberPayment.validator.js';

const router = Router();

router.use(authenticate);
router.use(requireTenant);

router.get('/', validate(listPaymentsSchema), listPaymentsHandler);

router.post(
  '/',
  requireRole(ROLES.ADMIN, ROLES.TRAINER),
  requireIdempotencyKey,
  validate(createPaymentSchema),
  createPaymentHandler,
);

router.post(
  '/member/create-order',
  requireRole(ROLES.MEMBER),
  validate(createMemberOrderSchema),
  createMemberOrderHandler,
);

router.post(
  '/member/verify',
  requireRole(ROLES.MEMBER),
  validate(verifyMemberPaymentSchema),
  verifyMemberPaymentHandler,
);

router.get(
  '/member/order/:orderId/status',
  requireRole(ROLES.MEMBER),
  validate(memberOrderStatusSchema),
  getMemberOrderStatusHandler,
);

export default router;
