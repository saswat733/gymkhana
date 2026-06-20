import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';
import { cacheGet } from '../middlewares/cache.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';
import { requireTenant } from '../middlewares/tenant.middleware.js';
import { ROLES } from '../../constants/roles.js';
import { getAttendanceHeatmapHandler, getKpisHandler, getMrrHandler, getRevenueTrendHandler, getZoneAttendanceHandler } from '../controllers/stats.controller.js';

const router = Router();

router.use(authenticate);
router.use(requireTenant);
router.use(requireRole(ROLES.ADMIN, ROLES.TRAINER));

router.get('/kpis', cacheGet({ key: (req) => `stats:${req.gymId}:kpis` }), getKpisHandler);
router.get(
  '/revenue-trend',
  cacheGet({ key: (req) => `stats:${req.gymId}:revenue-trend:${req.query?.days ?? 'default'}` }),
  getRevenueTrendHandler,
);
router.get(
  '/attendance-heatmap',
  cacheGet({ key: (req) => `stats:${req.gymId}:attendance-heatmap:${req.query?.days ?? 'default'}` }),
  getAttendanceHeatmapHandler,
);
router.get('/mrr', cacheGet({ key: (req) => `stats:${req.gymId}:mrr` }), getMrrHandler);
router.get('/zone-attendance', cacheGet({ key: (req) => `stats:${req.gymId}:zone-attendance:${req.query?.days ?? 30}` }), getZoneAttendanceHandler);

export default router;

