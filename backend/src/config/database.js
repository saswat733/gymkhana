import { Sequelize } from 'sequelize';
import { env } from './env.js';
import { logger } from './logger.js';

export const sequelize = new Sequelize(env.db.name, env.db.user, env.db.password, {
  host: env.db.host,
  port: env.db.port,
  dialect: env.db.dialect,
  logging: env.db.logging ? (msg) => logger.debug(msg) : false,
  pool: {
    max: 10,
    min: 0,
    acquire: 30_000,
    idle: 10_000,
  },
  define: {
    underscored: true,
    timestamps: true,
  },
});

export const connectDB = async () => {
  try {
    await sequelize.authenticate();
    logger.info(`DB connected (${env.db.dialect}://${env.db.host}:${env.db.port}/${env.db.name})`);
  } catch (err) {
    logger.error('Unable to connect to DB:', err.message);
    throw err;
  }
};

export const closeDB = async () => {
  try {
    await sequelize.close();
    logger.info('DB connection closed');
  } catch (err) {
    logger.error('Error closing DB:', err.message);
  }
};
