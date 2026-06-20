import * as attendanceService from '../../services/attendance.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendCreated, sendSuccess } from '../../utils/ApiResponse.js';

export const checkInHandler = asyncHandler(async (req, res) => {
  const attendance = await attendanceService.checkIn({
    gymId: req.gymId,
    memberId: req.body.memberId,
    source: req.body.source,
    qrPayload: req.body.qr ?? req.body.qrPayload,
  });
  return sendCreated(res, { message: 'Checked in', data: { attendance } });
});

export const scanGymQrHandler = asyncHandler(async (req, res) => {
  const attendance = await attendanceService.scanGymQrAndCheckIn({
    gymId: req.gymId,
    memberId: req.body.memberId,
    qrPayload: req.body.qrPayload,
  });
  return sendCreated(res, { message: 'Checked in via gym QR', data: { attendance } });
});

export const checkOutHandler = asyncHandler(async (req, res) => {
  const attendance = await attendanceService.checkOut({ gymId: req.gymId, ...req.body });
  return sendSuccess(res, { message: 'Checked out', data: { attendance } });
});

export const listAttendanceHandler = asyncHandler(async (req, res) => {
  const result = await attendanceService.listAttendance({ ...req.query, gymId: req.gymId });
  return sendSuccess(res, { data: { attendance: result.rows }, meta: result.meta });
});

export const verifyPassHandler = asyncHandler(async (req, res) => {
  const result = await attendanceService.verifyPassAndCheckIn({
    gymId: req.gymId,
    passCode: req.body.passCode,
    checkIn: req.body.checkIn !== false,
  });
  return sendSuccess(res, { message: 'Pass verified', data: result });
});
