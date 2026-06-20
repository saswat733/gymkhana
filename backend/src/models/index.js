/**
 * Central model registry.
 *
 * Add new models here and wire associations inside `applyAssociations`.
 * Keeping a single import surface (`from '../models/index.js'`) makes it
 * trivial to refactor or add associations later without touching call sites.
 */
import { sequelize } from '../config/database.js';
import { User } from './User.js';
import { Gym } from './Gym.js';
import { Member } from './Member.js';
import { Plan } from './Plan.js';
import { Trainer } from './Trainer.js';
import { Subscription } from './Subscription.js';
import { Attendance } from './Attendance.js';
import { Payment } from './Payment.js';
import { AuditLog } from './AuditLog.js';
import { PasswordResetToken } from './PasswordResetToken.js';
import { Announcement } from './Announcement.js';
import { WorkoutPlan } from './WorkoutPlan.js';
import { SaasPlan } from './SaasPlan.js';
import { GymSaasSubscription } from './GymSaasSubscription.js';
import { SaasInvoice } from './SaasInvoice.js';
import { MemberInvoice } from './MemberInvoice.js';
import { PushToken } from './PushToken.js';
import { AttendanceZone } from './AttendanceZone.js';
import { Lead } from './Lead.js';
import { SubscriptionFreeze } from './SubscriptionFreeze.js';
import { FamilyGroup } from './FamilyGroup.js';
import { FamilyMember } from './FamilyMember.js';
import { StaffShift } from './StaffShift.js';
import { RetentionRule } from './RetentionRule.js';
import { PaymentIntent } from './PaymentIntent.js';
import { StaffNote } from './StaffNote.js';

const models = {
  Gym,
  User,
  Member,
  Plan,
  Trainer,
  Subscription,
  Attendance,
  Payment,
  AuditLog,
  PasswordResetToken,
  Announcement,
  WorkoutPlan,
  SaasPlan,
  GymSaasSubscription,
  SaasInvoice,
  MemberInvoice,
  PushToken,
  AttendanceZone,
  Lead,
  SubscriptionFreeze,
  FamilyGroup,
  FamilyMember,
  StaffShift,
  RetentionRule,
  PaymentIntent,
  StaffNote,
};

const applyAssociations = () => {
  // Gym ↔ Users (tenant root; actual scoping enforced in services/middleware)
  Gym.hasMany(User, { foreignKey: 'gymId' });
  User.belongsTo(Gym, { foreignKey: 'gymId' });

  // User ↔ Member
  User.hasOne(Member, { foreignKey: 'userId' });
  Member.belongsTo(User, { foreignKey: 'userId' });

  // User ↔ Trainer
  User.hasOne(Trainer, { foreignKey: 'userId' });
  Trainer.belongsTo(User, { foreignKey: 'userId' });

  // Trainer ↔ Member (many-to-many)
  Trainer.belongsToMany(Member, { through: 'trainer_members', foreignKey: 'trainerId', otherKey: 'memberId' });
  Member.belongsToMany(Trainer, { through: 'trainer_members', foreignKey: 'memberId', otherKey: 'trainerId' });

  // Member ↔ Subscription
  Member.hasMany(Subscription, { foreignKey: 'memberId' });
  Subscription.belongsTo(Member, { foreignKey: 'memberId' });

  // Plan ↔ Subscription
  Plan.hasMany(Subscription, { foreignKey: 'planId' });
  Subscription.belongsTo(Plan, { foreignKey: 'planId' });

  // Subscription ↔ Payment
  Subscription.hasMany(Payment, { foreignKey: 'subscriptionId' });
  Payment.belongsTo(Subscription, { foreignKey: 'subscriptionId' });

  // Member ↔ Attendance
  Member.hasMany(Attendance, { foreignKey: 'memberId' });
  Attendance.belongsTo(Member, { foreignKey: 'memberId' });

  // User ↔ AuditLog (actor)
  User.hasMany(AuditLog, { foreignKey: 'actorUserId' });
  AuditLog.belongsTo(User, { as: 'actor', foreignKey: 'actorUserId' });

  // User ↔ PasswordResetToken
  User.hasMany(PasswordResetToken, { foreignKey: 'userId' });
  PasswordResetToken.belongsTo(User, { foreignKey: 'userId' });

  // User ↔ Announcement (createdBy)
  User.hasMany(Announcement, { foreignKey: 'createdByUserId' });
  Announcement.belongsTo(User, { as: 'createdBy', foreignKey: 'createdByUserId' });

  // Member ↔ WorkoutPlan
  Member.hasMany(WorkoutPlan, { foreignKey: 'memberId' });
  WorkoutPlan.belongsTo(Member, { foreignKey: 'memberId' });

  // Trainer ↔ WorkoutPlan
  Trainer.hasMany(WorkoutPlan, { foreignKey: 'trainerId' });
  WorkoutPlan.belongsTo(Trainer, { foreignKey: 'trainerId' });

  // SaaS billing (Gym -> You)
  Gym.hasOne(GymSaasSubscription, { foreignKey: 'gymId' });
  GymSaasSubscription.belongsTo(Gym, { foreignKey: 'gymId' });

  SaasPlan.hasMany(GymSaasSubscription, { foreignKey: 'saasPlanId' });
  GymSaasSubscription.belongsTo(SaasPlan, { foreignKey: 'saasPlanId' });

  GymSaasSubscription.hasMany(SaasInvoice, { foreignKey: 'gymSaasSubscriptionId' });
  SaasInvoice.belongsTo(GymSaasSubscription, { foreignKey: 'gymSaasSubscriptionId' });

  Gym.hasMany(SaasInvoice, { foreignKey: 'gymId' });
  SaasInvoice.belongsTo(Gym, { foreignKey: 'gymId' });

  Payment.hasOne(MemberInvoice, { foreignKey: 'paymentId' });
  MemberInvoice.belongsTo(Payment, { foreignKey: 'paymentId' });
  Gym.hasMany(MemberInvoice, { foreignKey: 'gymId' });
  MemberInvoice.belongsTo(Gym, { foreignKey: 'gymId' });

  User.hasMany(PushToken, { foreignKey: 'userId' });
  PushToken.belongsTo(User, { foreignKey: 'userId' });

  Gym.hasMany(AttendanceZone, { foreignKey: 'gymId' });
  AttendanceZone.belongsTo(Gym, { foreignKey: 'gymId' });
  AttendanceZone.hasMany(Attendance, { foreignKey: 'zoneId' });
  Attendance.belongsTo(AttendanceZone, { foreignKey: 'zoneId' });

  Gym.hasMany(Lead, { foreignKey: 'gymId' });
  Lead.belongsTo(Gym, { foreignKey: 'gymId' });
  Lead.belongsTo(User, { as: 'assignedTo', foreignKey: 'assignedToUserId' });
  Lead.belongsTo(Member, { as: 'convertedMember', foreignKey: 'convertedMemberId' });

  Subscription.hasMany(SubscriptionFreeze, { foreignKey: 'subscriptionId' });
  SubscriptionFreeze.belongsTo(Subscription, { foreignKey: 'subscriptionId' });

  Gym.hasMany(FamilyGroup, { foreignKey: 'gymId' });
  FamilyGroup.belongsTo(Gym, { foreignKey: 'gymId' });
  FamilyGroup.belongsTo(Member, { as: 'payer', foreignKey: 'payerMemberId' });
  FamilyGroup.hasMany(FamilyMember, { foreignKey: 'familyGroupId' });
  FamilyMember.belongsTo(FamilyGroup, { foreignKey: 'familyGroupId' });
  FamilyMember.belongsTo(Member, { foreignKey: 'memberId' });

  Gym.hasMany(StaffShift, { foreignKey: 'gymId' });
  StaffShift.belongsTo(Gym, { foreignKey: 'gymId' });
  StaffShift.belongsTo(User, { foreignKey: 'userId' });

  Gym.hasMany(RetentionRule, { foreignKey: 'gymId' });
  RetentionRule.belongsTo(Gym, { foreignKey: 'gymId' });

  Member.hasMany(PaymentIntent, { foreignKey: 'memberId' });
  PaymentIntent.belongsTo(Member, { foreignKey: 'memberId' });
  Plan.hasMany(PaymentIntent, { foreignKey: 'planId' });
  PaymentIntent.belongsTo(Plan, { foreignKey: 'planId' });
  Subscription.hasMany(PaymentIntent, { foreignKey: 'subscriptionId' });
  PaymentIntent.belongsTo(Subscription, { foreignKey: 'subscriptionId' });

  User.hasMany(StaffNote, { foreignKey: 'authorUserId', as: 'authoredNotes' });
  StaffNote.belongsTo(User, { foreignKey: 'authorUserId', as: 'author' });
};

applyAssociations();

export {
  sequelize,
  Gym,
  User,
  Member,
  Plan,
  Trainer,
  Subscription,
  Attendance,
  Payment,
  AuditLog,
  PasswordResetToken,
  Announcement,
  WorkoutPlan,
  SaasPlan,
  GymSaasSubscription,
  SaasInvoice,
  MemberInvoice,
  PushToken,
  AttendanceZone,
  Lead,
  SubscriptionFreeze,
  FamilyGroup,
  FamilyMember,
  StaffShift,
  RetentionRule,
  PaymentIntent,
  StaffNote,
};
export default models;
