import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { requireTenant } from '../middlewares/tenant.middleware.js';
import { ROLES } from '../../constants/roles.js';
import {
  createAnnouncementHandler,
  deleteAnnouncementHandler,
  listAnnouncementsHandler,
  listInboxHandler,
  updateAnnouncementHandler,
} from '../controllers/announcement.controller.js';
import {
  announcementIdParamSchema,
  createAnnouncementSchema,
  listAnnouncementsSchema,
  listInboxSchema,
  updateAnnouncementSchema,
} from '../validators/announcement.validator.js';

const router = Router();

router.use(authenticate);
router.use(requireTenant);

// Member inbox (published + visible by role)
router.get('/inbox', validate(listInboxSchema), listInboxHandler);

// Admin CRUD
router.use(requireRole(ROLES.ADMIN));
router.get('/', validate(listAnnouncementsSchema), listAnnouncementsHandler);
router.post('/', validate(createAnnouncementSchema), createAnnouncementHandler);
router.patch('/:id', validate(announcementIdParamSchema), validate(updateAnnouncementSchema), updateAnnouncementHandler);
router.delete('/:id', validate(announcementIdParamSchema), deleteAnnouncementHandler);

export default router;

