/**
 * sequelize-cli reads this file (CommonJS) to know how to connect to the DB
 * for migrations and seeders. Runtime app code uses src/config/database.js.
 *
 * Values are loaded from .env so we have ONE source of truth.
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const base = {
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  dialect: process.env.DB_DIALECT || 'postgres',
  logging: process.env.DB_LOGGING === 'true' ? console.log : false,
};

module.exports = {
  development: { ...base },
  test: { ...base, database: `${base.database}_test` },
  production: {
    ...base,
    logging: false,
    dialectOptions:
      process.env.DB_SSL === 'true'
        ? { ssl: { require: true, rejectUnauthorized: false } }
        : {},
  },
};
