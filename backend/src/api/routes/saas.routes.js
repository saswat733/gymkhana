import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';
import { requireTenant } from '../middlewares/tenant.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { ADMIN_LIKE_ROLES } from '../../constants/roles.js';
import { PERMISSIONS } from '../../constants/permissions.js';
import { requirePermission } from '../middlewares/permission.middleware.js';
import {
  cancelMyGymSaasSubscriptionHandler,
  generateMyGymSaasInvoiceHandler,
  getMyGymSaasSubscriptionHandler,
  listMyGymSaasInvoicesHandler,
  listSaasPlansHandler,
  markMyGymSaasInvoicePaidHandler,
  createSaasInvoiceRazorpayOrderHandler,
  startMyGymSaasSubscriptionHandler,
} from '../controllers/saas.controller.js';
import { generateInvoiceSchema, invoiceIdParamSchema, startSubscriptionSchema } from '../validators/saas.validator.js';

const router = Router();

router.use(authenticate);
router.use(requireTenant);

// Plans catalog (visible to any authenticated staff/member in tenant)
router.get('/plans', listSaasPlansHandler);

// Gym subscription + invoices (admin for now; Owner role comes in Phase A2)
router.get('/subscription', requirePermission(PERMISSIONS.SAAS_BILLING_READ), getMyGymSaasSubscriptionHandler);
router.post(
  '/subscription/start',
  requirePermission(PERMISSIONS.SAAS_BILLING_WRITE),
  requireRole(...ADMIN_LIKE_ROLES),
  validate(startSubscriptionSchema),
  startMyGymSaasSubscriptionHandler,
);
router.post(
  '/subscription/cancel',
  requirePermission(PERMISSIONS.SAAS_BILLING_WRITE),
  requireRole(...ADMIN_LIKE_ROLES),
  cancelMyGymSaasSubscriptionHandler,
);

router.get('/invoices', requirePermission(PERMISSIONS.SAAS_BILLING_READ), listMyGymSaasInvoicesHandler);
router.post(
  '/invoices/generate',
  requirePermission(PERMISSIONS.SAAS_BILLING_WRITE),
  requireRole(...ADMIN_LIKE_ROLES),
  validate(generateInvoiceSchema),
  generateMyGymSaasInvoiceHandler,
);
router.post(
  '/invoices/:id/mark-paid',
  requirePermission(PERMISSIONS.SAAS_BILLING_WRITE),
  requireRole(...ADMIN_LIKE_ROLES),
  validate(invoiceIdParamSchema),
  markMyGymSaasInvoicePaidHandler,
);
router.post(
  '/invoices/:id/razorpay-order',
  requirePermission(PERMISSIONS.SAAS_BILLING_WRITE),
  requireRole(...ADMIN_LIKE_ROLES),
  validate(invoiceIdParamSchema),
  createSaasInvoiceRazorpayOrderHandler,
);

export default router;

