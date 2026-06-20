import { StaffNote, User } from '../models/index.js';
import { ApiError } from '../utils/ApiError.js';
import { STAFF_NOTE_ENTITY } from '../models/StaffNote.js';
import { Member } from '../models/index.js';
import { Lead } from '../models/index.js';

const assertEntity = async ({ gymId, entityType, entityId }) => {
  if (entityType === STAFF_NOTE_ENTITY.MEMBER) {
    const member = await Member.findByPk(entityId);
    if (!member) throw ApiError.notFound('Member not found');
    if (String(member.gymId) !== String(gymId)) throw ApiError.forbidden();
    return;
  }
  if (entityType === STAFF_NOTE_ENTITY.LEAD) {
    const lead = await Lead.findByPk(entityId);
    if (!lead) throw ApiError.notFound('Lead not found');
    if (String(lead.gymId) !== String(gymId)) throw ApiError.forbidden();
    return;
  }
  throw ApiError.badRequest('Unsupported entity type');
};

export const listNotes = async ({ gymId, entityType, entityId }) => {
  await assertEntity({ gymId, entityType, entityId });
  const notes = await StaffNote.findAll({
    where: { gymId, entityType, entityId },
    include: [{ model: User, as: 'author', attributes: ['id', 'name', 'email'] }],
    order: [
      ['pinned', 'DESC'],
      ['createdAt', 'DESC'],
    ],
  });
  return notes;
};

export const createNote = async ({ gymId, entityType, entityId, authorUserId, body, pinned }) => {
  await assertEntity({ gymId, entityType, entityId });
  const trimmed = String(body ?? '').trim();
  if (!trimmed) throw ApiError.badRequest('Note body is required');

  return StaffNote.create({
    gymId,
    entityType,
    entityId,
    authorUserId,
    body: trimmed,
    pinned: Boolean(pinned),
  });
};

export const updateNote = async ({ gymId, noteId, authorUserId, isAdmin, body, pinned }) => {
  const note = await StaffNote.findByPk(noteId);
  if (!note) throw ApiError.notFound('Note not found');
  if (String(note.gymId) !== String(gymId)) throw ApiError.forbidden();
  if (!isAdmin && note.authorUserId !== authorUserId) throw ApiError.forbidden('Only the author or admin can edit');

  const updates = {};
  if (body !== undefined) {
    const trimmed = String(body).trim();
    if (!trimmed) throw ApiError.badRequest('Note body cannot be empty');
    updates.body = trimmed;
  }
  if (pinned !== undefined) updates.pinned = Boolean(pinned);
  await note.update(updates);
  return note;
};

export const deleteNote = async ({ gymId, noteId, authorUserId, isAdmin }) => {
  const note = await StaffNote.findByPk(noteId);
  if (!note) throw ApiError.notFound('Note not found');
  if (String(note.gymId) !== String(gymId)) throw ApiError.forbidden();
  if (!isAdmin && note.authorUserId !== authorUserId) throw ApiError.forbidden();
  await note.destroy();
};

export const migrateLegacyMemberNotes = async ({ gymId, memberId }) => {
  const member = await Member.findByPk(memberId);
  if (!member?.notes?.trim()) return null;
  const existing = await StaffNote.findOne({
    where: { gymId, entityType: STAFF_NOTE_ENTITY.MEMBER, entityId: memberId },
  });
  if (existing) return existing;

  const note = await StaffNote.create({
    gymId,
    entityType: STAFF_NOTE_ENTITY.MEMBER,
    entityId: memberId,
    authorUserId: member.userId,
    body: member.notes.trim(),
    pinned: false,
  });
  await member.update({ notes: null });
  return note;
};
