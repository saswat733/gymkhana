import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import { env, isProd } from './config/env.js';
import { stream } from './config/logger.js';
import { verifyAccessToken } from './utils/jwt.js';
import apiRouter from './api/routes/index.js';
import { errorHandler, notFoundHandler } from './api/middlewares/error.middleware.js';

export const buildApp = () => {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  app.use(helmet());
  const allowed = String(env.cors.origin ?? '*').trim();
  const allowAll = allowed === '*' || allowed === '';
  const allowList = allowAll
    ? []
    : allowed
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

  // In dev, allow localhost origins (Vite changes ports often).
  const isLocalOrigin = (origin) => /^https?:\/\/(localhost|127\.0\.0\.1):\d+$/.test(String(origin));

  app.use(cors({
    // If allowAll, `origin: true` reflects request origin (safe with credentials).
    origin: (origin, cb) => {
      if (!origin) return cb(null, true); // server-to-server or curl
      if (allowAll) return cb(null, true);
      if (allowList.includes(origin)) return cb(null, true);
      if (!isProd && isLocalOrigin(origin)) return cb(null, true);
      return cb(new Error('Not allowed by CORS'));
    },
    credentials: true,
  }));
  app.use(
    express.json({
      limit: '1mb',
      verify: (req, _res, buf) => {
        req.rawBody = buf.toString();
      },
    }),
  );
  app.use(express.urlencoded({ extended: true }));
  app.use(morgan(isProd ? 'combined' : 'dev', { stream }));

  app.use(
    rateLimit({
      windowMs: env.rateLimit.windowMs,
      max: env.rateLimit.max,
      standardHeaders: true,
      legacyHeaders: false,
      keyGenerator: (req) => {
        // Prefer per-user key when a valid Bearer token is present; fallback to IP.
        const header = req.headers.authorization || '';
        const [scheme, token] = header.split(' ');
        if (scheme === 'Bearer' && token) {
          try {
            const decoded = verifyAccessToken(token);
            if (decoded?.sub) return `user:${decoded.sub}`;
          } catch {
            // ignore and fall back to IP
          }
        }
        return req.ip;
      },
    }),
  );

  app.get('/', (_req, res) => {
    res.json({
      success: true,
      message: 'GymKhana API',
      data: { docs: `${env.apiPrefix}/health` },
    });
  });

  app.use(env.apiPrefix, apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
