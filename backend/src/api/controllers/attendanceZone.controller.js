import * as zoneService from '../../services/attendanceZone.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendCreated, sendSuccess } from '../../utils/ApiResponse.js';

export const listZonesHandler = asyncHandler(async (req, res) => {
  const zones = await zoneService.listZones({ gymId: req.gymId });
  return sendSuccess(res, { data: { zones } });
});

export const createZoneHandler = asyncHandler(async (req, res) => {
  const zone = await zoneService.createZone({ gymId: req.gymId, ...req.body });
  return sendCreated(res, { message: 'Zone created', data: { zone } });
});

export const updateZoneHandler = asyncHandler(async (req, res) => {
  const zone = await zoneService.updateZone({ gymId: req.gymId, id: req.params.id, patch: req.body });
  return sendSuccess(res, { message: 'Zone updated', data: { zone } });
});

export const getQrSetupHandler = asyncHandler(async (req, res) => {
  const setup = await zoneService.getGymQrSetup({ gymId: req.gymId });
  return sendSuccess(res, { data: setup });
});
