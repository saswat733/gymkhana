export const ROLES = Object.freeze({
  OWNER: 'owner',
  ADMIN: 'admin',
  MANAGER: 'manager',
  RECEPTIONIST: 'receptionist',
  TRAINER: 'trainer',
  MEMBER: 'member',
});

export const ROLE_VALUES = Object.values(ROLES);

/** Staff roles that can access admin portal operations */
export const STAFF_ROLES = [
  ROLES.OWNER,
  ROLES.ADMIN,
  ROLES.MANAGER,
  ROLES.RECEPTIONIST,
  ROLES.TRAINER,
];

/** Roles with full gym admin powers (legacy admin + owner) */
export const ADMIN_LIKE_ROLES = [ROLES.OWNER, ROLES.ADMIN];
