import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';
import { requireTenant } from '../middlewares/tenant.middleware.js';
import { requirePermission } from '../middlewares/permission.middleware.js';
import { PERMISSIONS } from '../../constants/permissions.js';
import {
  downloadMemberInvoicePdfHandler,
  listMemberInvoicesHandler,
} from '../controllers/memberInvoice.controller.js';

const router = Router();

router.use(authenticate);
router.use(requireTenant);

router.get('/', requirePermission(PERMISSIONS.PAYMENTS_READ), listMemberInvoicesHandler);
router.get('/:id/pdf', requirePermission(PERMISSIONS.PAYMENTS_READ), downloadMemberInvoicePdfHandler);

export default router;
