import { DataTypes, Model } from 'sequelize';
import bcrypt from 'bcrypt';
import { sequelize } from '../config/database.js';
import { ROLE_VALUES, ROLES } from '../constants/roles.js';

const SALT_ROUNDS = 10;

export class User extends Model {
  async comparePassword(plain) {
    return bcrypt.compare(plain, this.passwordHash);
  }

  toJSON() {
    const values = { ...this.get() };
    delete values.passwordHash;
    return values;
  }
}

User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(120),
      allowNull: false,
      validate: { notEmpty: true, len: [1, 120] },
    },
    email: {
      type: DataTypes.STRING(160),
      allowNull: false,
      unique: true,
      validate: { isEmail: true },
      set(v) { this.setDataValue('email', String(v).trim().toLowerCase()); },
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    passwordHash: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM(...ROLE_VALUES),
      allowNull: false,
      defaultValue: ROLES.MEMBER,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    lastLoginAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    // Reserved for Phase 7 (multi-tenant SaaS). Nullable until tenancy lands.
    gymId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    indexes: [
      { unique: true, fields: ['email'] },
      { fields: ['role'] },
      { fields: ['gym_id'] },
    ],
  },
);

/**
 * Helper used by services to create users with a plaintext password.
 * Hashing is centralized here instead of duplicated in each caller.
 */
User.createWithPassword = async function createWithPassword({ password, ...rest }) {
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  return User.create({ ...rest, passwordHash });
};

User.hashPassword = (plain) => bcrypt.hash(plain, SALT_ROUNDS);
