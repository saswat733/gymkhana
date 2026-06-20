/**
 * sequelize-cli reads this file (CommonJS) to know how to connect to the DB
 * for migrations and seeders. Runtime app code uses src/config/database.js.
 *
 * Values are loaded from .env so we have ONE source of truth.
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const parseDatabaseUrl = () => {
  const raw = process.env.DATABASE_URL?.trim();
  if (!raw) return null;
  const u = new URL(raw);
  const proto = u.protocol.replace(':', '');
  const dialect = proto === 'postgresql' || proto === 'postgres' ? 'postgres' : proto;
  const ssl =
    u.searchParams.get('sslmode') === 'require' ||
    process.env.DB_SSL === 'true' ||
    process.env.DB_SSL === '1';
  return {
    username: decodeURIComponent(u.username),
    password: decodeURIComponent(u.password),
    database: u.pathname.replace(/^\//, ''),
    host: u.hostname,
    port: Number(u.port) || (dialect === 'postgres' ? 5432 : 3306),
    dialect,
    ssl,
  };
};

const fromUrl = parseDatabaseUrl();

const base = fromUrl
  ? {
      username: fromUrl.username,
      password: fromUrl.password,
      database: fromUrl.database,
      host: fromUrl.host,
      port: fromUrl.port,
      dialect: fromUrl.dialect,
      logging: process.env.DB_LOGGING === 'true' ? console.log : false,
      dialectOptions: fromUrl.ssl
        ? { ssl: { require: true, rejectUnauthorized: false } }
        : {},
    }
  : {
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 5432,
      dialect: process.env.DB_DIALECT || 'postgres',
      logging: process.env.DB_LOGGING === 'true' ? console.log : false,
      dialectOptions:
        process.env.DB_SSL === 'true'
          ? { ssl: { require: true, rejectUnauthorized: false } }
          : {},
    };

module.exports = {
  development: { ...base },
  test: { ...base, database: `${base.database}_test` },
  production: { ...base, logging: false },
};
