import * as staffNoteService from '../../services/staffNote.service.js';
import { STAFF_NOTE_ENTITY } from '../../models/StaffNote.js';
import { ROLES } from '../../constants/roles.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendCreated, sendSuccess } from '../../utils/ApiResponse.js';

const isAdminRole = (role) => [ROLES.ADMIN, ROLES.OWNER, ROLES.MANAGER].includes(role);

export const listMemberNotesHandler = asyncHandler(async (req, res) => {
  await staffNoteService.migrateLegacyMemberNotes({ gymId: req.gymId, memberId: req.params.id });
  const notes = await staffNoteService.listNotes({
    gymId: req.gymId,
    entityType: STAFF_NOTE_ENTITY.MEMBER,
    entityId: req.params.id,
  });
  return sendSuccess(res, { data: { notes } });
});

export const createMemberNoteHandler = asyncHandler(async (req, res) => {
  const note = await staffNoteService.createNote({
    gymId: req.gymId,
    entityType: STAFF_NOTE_ENTITY.MEMBER,
    entityId: req.params.id,
    authorUserId: req.user.id,
    body: req.body.body,
    pinned: req.body.pinned,
  });
  return sendCreated(res, { message: 'Note added', data: { note } });
});

export const updateMemberNoteHandler = asyncHandler(async (req, res) => {
  const note = await staffNoteService.updateNote({
    gymId: req.gymId,
    noteId: req.params.noteId,
    authorUserId: req.user.id,
    isAdmin: isAdminRole(req.user.role),
    body: req.body.body,
    pinned: req.body.pinned,
  });
  return sendSuccess(res, { message: 'Note updated', data: { note } });
});

export const deleteMemberNoteHandler = asyncHandler(async (req, res) => {
  await staffNoteService.deleteNote({
    gymId: req.gymId,
    noteId: req.params.noteId,
    authorUserId: req.user.id,
    isAdmin: isAdminRole(req.user.role),
  });
  return sendSuccess(res, { message: 'Note deleted' });
});
