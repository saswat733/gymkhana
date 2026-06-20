import { Router } from 'express';
import { sequelize } from '../../config/database.js';
import { sendSuccess } from '../../utils/ApiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

const router = Router();

router.get('/', asyncHandler(async (_req, res) => {
  let db = 'down';
  try {
    await sequelize.authenticate();
    db = 'up';
  } catch {
    db = 'down';
  }

  return sendSuccess(res, {
    data: {
      status: 'ok',
      uptimeSeconds: process.uptime(),
      timestamp: new Date().toISOString(),
      services: { db },
    },
  });
}));

export default router;
