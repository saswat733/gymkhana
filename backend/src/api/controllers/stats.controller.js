import * as statsService from '../../services/stats.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/ApiResponse.js';

export const getKpisHandler = asyncHandler(async (req, res) => {
  const kpis = await statsService.getDashboardKpis({ gymId: req.gymId });
  return sendSuccess(res, { data: { kpis } });
});

export const getRevenueTrendHandler = asyncHandler(async (req, res) => {
  const days = req.query?.days;
  const trend = await statsService.getRevenueTrend({ gymId: req.gymId, days });
  return sendSuccess(res, { data: { trend } });
});

export const getAttendanceHeatmapHandler = asyncHandler(async (req, res) => {
  const days = req.query?.days;
  const heatmap = await statsService.getAttendanceHeatmap({ gymId: req.gymId, days });
  return sendSuccess(res, { data: { heatmap } });
});

export const getMrrHandler = asyncHandler(async (req, res) => {
  const metrics = await statsService.getMrrAndRetention({ gymId: req.gymId });
  return sendSuccess(res, { data: { metrics } });
});

export const getZoneAttendanceHandler = asyncHandler(async (req, res) => {
  const stats = await statsService.getZoneAttendanceStats({ gymId: req.gymId, days: req.query?.days });
  return sendSuccess(res, { data: { zoneStats: stats } });
});

