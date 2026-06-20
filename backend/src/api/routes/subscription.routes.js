import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { requireTenant } from '../middlewares/tenant.middleware.js';
import { ROLES, STAFF_ROLES } from '../../constants/roles.js';
import { Member, Subscription } from '../../models/index.js';
import { ApiError } from '../../utils/ApiError.js';
import {
  cancelSubscriptionHandler,
  createSubscriptionHandler,
  createSelfSubscriptionHandler,
  listSubscriptionsHandler,
  renewSubscriptionHandler,
} from '../controllers/subscription.controller.js';
import {
  createSubscriptionSchema,
  createSelfSubscriptionSchema,
  listSubscriptionsSchema,
  subscriptionIdParamSchema,
} from '../validators/subscription.validator.js';

const router = Router();

router.use(authenticate);
router.use(requireTenant);

const assertSubscriptionBelongsToMemberUser = async (req, _res, next) => {
  try {
    if (STAFF_ROLES.includes(req.user.role)) return next();

    const member = await Member.findOne({ where: { userId: req.user.id, gymId: req.gymId } });
    if (!member) return next(ApiError.notFound('Member profile not found'));

    const sub = await Subscription.findByPk(req.params.id);
    if (!sub) return next(ApiError.notFound('Subscription not found'));
    if (String(sub.gymId) !== String(req.gymId)) return next(ApiError.forbidden());
    if (sub.memberId !== member.id) return next(ApiError.forbidden());

    return next();
  } catch (e) {
    return next(e);
  }
};

router.get('/', validate(listSubscriptionsSchema), listSubscriptionsHandler);
router.post('/', requireRole(ROLES.ADMIN, ROLES.TRAINER), validate(createSubscriptionSchema), createSubscriptionHandler);
router.post('/self', requireRole(ROLES.MEMBER), validate(createSelfSubscriptionSchema), createSelfSubscriptionHandler);
router.post('/:id/cancel', assertSubscriptionBelongsToMemberUser, validate(subscriptionIdParamSchema), cancelSubscriptionHandler);
router.post('/:id/renew', requireRole(ROLES.ADMIN, ROLES.TRAINER), validate(subscriptionIdParamSchema), renewSubscriptionHandler);

export default router;

