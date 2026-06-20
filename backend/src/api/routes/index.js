import { Router } from 'express';
import healthRoutes from './health.routes.js';
import authRoutes from './auth.routes.js';
import planRoutes from './plan.routes.js';
import memberRoutes from './member.routes.js';
import subscriptionRoutes from './subscription.routes.js';
import attendanceRoutes from './attendance.routes.js';
import paymentRoutes from './payment.routes.js';
import statsRoutes from './stats.routes.js';
import announcementRoutes from './announcement.routes.js';
import engagementRoutes from './engagement.routes.js';
import trainerRoutes from './trainer.routes.js';
import workoutPlanRoutes from './workoutPlan.routes.js';
import saasRoutes from './saas.routes.js';
import gymRoutes from './gym.routes.js';
import memberInvoiceRoutes from './memberInvoice.routes.js';
import pushRoutes from './push.routes.js';
import webhookRoutes from './webhook.routes.js';
import attendanceZoneRoutes from './attendanceZone.routes.js';
import leadRoutes from './lead.routes.js';
import freezeRoutes from './freeze.routes.js';
import familyRoutes from './family.routes.js';
import staffShiftRoutes from './staffShift.routes.js';
import retentionRoutes from './retention.routes.js';

/**
 * Top-level API router. Register new resource routers here.
 *
 * Convention: each resource lives in its own file (`<resource>.routes.js`)
 * and is mounted under `/<resource>`.
 */
const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/plans', planRoutes);
router.use('/members', memberRoutes);
router.use('/subscriptions', subscriptionRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/payments', paymentRoutes);
router.use('/stats', statsRoutes);
router.use('/announcements', announcementRoutes);
router.use('/engagement', engagementRoutes);
router.use('/trainers', trainerRoutes);
router.use('/workout-plans', workoutPlanRoutes);
router.use('/saas', saasRoutes);
router.use('/gyms', gymRoutes);
router.use('/member-invoices', memberInvoiceRoutes);
router.use('/push', pushRoutes);
router.use('/webhooks', webhookRoutes);
router.use('/attendance-zones', attendanceZoneRoutes);
router.use('/leads', leadRoutes);
router.use('/freezes', freezeRoutes);
router.use('/family-groups', familyRoutes);
router.use('/staff-shifts', staffShiftRoutes);
router.use('/retention-rules', retentionRoutes);

// Future:
// router.use('/users', userRoutes);

export default router;
