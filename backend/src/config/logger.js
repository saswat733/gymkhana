import winston from 'winston';
import { env, isProd } from './env.js';

const { combine, timestamp, printf, colorize, errors, json, splat } = winston.format;

const devFormat = printf(({ level, message, timestamp: ts, stack, ...meta }) => {
  const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
  return `${ts} [${level}] ${stack || message}${metaStr}`;
});

export const logger = winston.createLogger({
  level: env.logLevel,
  format: isProd
    ? combine(timestamp(), errors({ stack: true }), splat(), json())
    : combine(colorize(), timestamp({ format: 'HH:mm:ss' }), errors({ stack: true }), splat(), devFormat),
  transports: [new winston.transports.Console()],
  exitOnError: false,
});

export const stream = {
  write: (message) => logger.http
    ? logger.http(message.trim())
    : logger.info(message.trim()),
};
