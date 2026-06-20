import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { requireTenant } from '../middlewares/tenant.middleware.js';
import { requirePlatformAccess } from '../middlewares/saasAccess.middleware.js';
import { STAFF_ROLES } from '../../constants/roles.js';
import {
  createMemberHandler,
  getMemberHandler,
  listMembersHandler,
  setMemberActiveHandler,
  updateMemberHandler,
} from '../controllers/member.controller.js';
import {
  createMemberNoteHandler,
  deleteMemberNoteHandler,
  listMemberNotesHandler,
  updateMemberNoteHandler,
} from '../controllers/staffNote.controller.js';
import {
  createMemberSchema,
  listMembersSchema,
  memberIdParamSchema,
  setMemberActiveSchema,
  updateMemberSchema,
} from '../validators/member.validator.js';
import {
  createStaffNoteSchema,
  memberNoteIdParamSchema,
  updateStaffNoteSchema,
} from '../validators/staffNote.validator.js';

const router = Router();

router.use(authenticate);
router.use(requireTenant);
router.use(requirePlatformAccess);
router.use(requireRole(...STAFF_ROLES));

router.get('/', validate(listMembersSchema), listMembersHandler);
router.post('/', validate(createMemberSchema), createMemberHandler);
router.get('/:id/notes', validate(memberIdParamSchema), listMemberNotesHandler);
router.post('/:id/notes', validate(createStaffNoteSchema), createMemberNoteHandler);
router.patch('/:id/notes/:noteId', validate(updateStaffNoteSchema), updateMemberNoteHandler);
router.delete('/:id/notes/:noteId', validate(memberNoteIdParamSchema), deleteMemberNoteHandler);
router.get('/:id', validate(memberIdParamSchema), getMemberHandler);
router.patch('/:id', validate(updateMemberSchema), updateMemberHandler);
router.patch('/:id/active', validate(setMemberActiveSchema), setMemberActiveHandler);

export default router;

