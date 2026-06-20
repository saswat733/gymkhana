import os from 'node:os';
import { buildApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { connectDB, closeDB } from './config/database.js';
import './models/index.js'; // ensures models register & associate
import { startJobs, stopJobs } from './jobs/index.js';
import { initCache } from './services/cache/cache.service.js';

const start = async () => {
  await connectDB();
  const cacheInfo = await initCache().catch((e) => ({ provider: 'memory', error: e?.message ?? String(e) }));
  logger.info('Cache initialized', cacheInfo);

  const app = buildApp();
  startJobs();
  const host = '0.0.0.0';
  const server = app.listen(env.port, host, () => {
    const lan = Object.values(os.networkInterfaces())
      .flat()
      .filter((n) => n && n.family === 'IPv4' && !n.internal)
      .map((n) => n.address);
    logger.info(`GymKhana API listening on http://localhost:${env.port}${env.apiPrefix}`);
    if (lan.length) {
      logger.info(`LAN (mobile app): ${lan.map((ip) => `http://${ip}:${env.port}${env.apiPrefix}`).join(', ')}`);
    }
    logger.info(`Environment: ${env.nodeEnv}`);
  });

  const shutdown = async (signal) => {
    logger.info(`Received ${signal}, shutting down gracefully...`);
    server.close(async () => {
      stopJobs();
      await closeDB();
      process.exit(0);
    });
    setTimeout(() => {
      logger.error('Forced shutdown after 10s timeout');
      process.exit(1);
    }, 10_000).unref();
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled Rejection', { reason: reason?.message || reason });
  });
  process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception', { message: err.message, stack: err.stack });
    shutdown('uncaughtException');
  });
};

start().catch((err) => {
  logger.error('Failed to start server', { message: err.message, stack: err.stack });
  process.exit(1);
});
