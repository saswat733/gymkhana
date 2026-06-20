import * as announcementService from '../../services/announcement.service.js';
import * as pushService from '../../services/push.service.js';
import { logger } from '../../config/logger.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendCreated, sendSuccess } from '../../utils/ApiResponse.js';

export const createAnnouncementHandler = asyncHandler(async (req, res) => {
  const announcement = await announcementService.createAnnouncement({ user: req.user, gymId: req.gymId, payload: req.body });
  if (announcement.isPublished) {
    pushService.sendPushToGymMembers({
      gymId: req.gymId,
      title: announcement.title,
      body: String(announcement.body ?? '').slice(0, 120),
      data: { type: 'announcement', id: announcement.id },
    }).catch((err) => logger.warn('Push on announcement failed', { err: err?.message }));
  }
  return sendCreated(res, { message: 'Announcement created', data: { announcement } });
});

export const updateAnnouncementHandler = asyncHandler(async (req, res) => {
  const announcement = await announcementService.updateAnnouncement({ id: req.params.id, gymId: req.gymId, patch: req.body });
  return sendSuccess(res, { message: 'Announcement updated', data: { announcement } });
});

export const deleteAnnouncementHandler = asyncHandler(async (req, res) => {
  await announcementService.deleteAnnouncement({ id: req.params.id, gymId: req.gymId });
  return sendSuccess(res, { message: 'Announcement deleted' });
});

export const listAnnouncementsHandler = asyncHandler(async (req, res) => {
  const result = await announcementService.listAnnouncements({ ...req.query, gymId: req.gymId });
  return sendSuccess(res, { data: { announcements: result.rows }, meta: result.meta });
});

export const listInboxHandler = asyncHandler(async (req, res) => {
  const result = await announcementService.listInboxForUser({ user: req.user, gymId: req.gymId, query: req.query });
  return sendSuccess(res, { data: { announcements: result.rows }, meta: result.meta });
});

