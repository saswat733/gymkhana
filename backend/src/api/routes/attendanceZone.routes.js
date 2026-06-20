import { Router } from 'express';
import Joi from 'joi';
import { authenticate } from '../middlewares/auth.middleware.js';
import { requireTenant } from '../middlewares/tenant.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { STAFF_ROLES } from '../../constants/roles.js';
import {
  createZoneHandler,
  getQrSetupHandler,
  listZonesHandler,
  updateZoneHandler,
} from '../controllers/attendanceZone.controller.js';

const router = Router();
router.use(authenticate, requireTenant, requireRole(...STAFF_ROLES));

router.get('/', listZonesHandler);
router.get('/qr-setup', getQrSetupHandler);
router.post('/', validate({ body: Joi.object({ name: Joi.string().min(2).max(120).required(), slug: Joi.string().max(80), isDefault: Joi.boolean() }) }), createZoneHandler);
router.patch('/:id', validate({ params: Joi.object({ id: Joi.string().uuid().required() }), body: Joi.object({ name: Joi.string().min(2).max(120), isActive: Joi.boolean(), isDefault: Joi.boolean() }).min(1) }), updateZoneHandler);

export default router;
