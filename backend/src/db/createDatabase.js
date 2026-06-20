import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

const createMysqlDb = async () => {
  const mysql = await import('mysql2/promise');
  const conn = await mysql.createConnection({
    host: env.db.host,
    port: env.db.port,
    user: env.db.user,
    password: env.db.password,
    multipleStatements: true,
  });
  await conn.query(`CREATE DATABASE IF NOT EXISTS \`${env.db.name}\``);
  await conn.end();
};

const createPostgresDb = async () => {
  const { Client } = await import('pg');
  // Connect to default 'postgres' database to create the target DB.
  const client = new Client({
    host: env.db.host,
    port: env.db.port,
    user: env.db.user,
    password: env.db.password,
    database: 'postgres',
  });
  await client.connect();
  // CREATE DATABASE cannot run inside a transaction.
  await client.query(`CREATE DATABASE "${env.db.name}"`);
  await client.end();
};

const main = async () => {
  try {
    if (env.db.dialect === 'mysql') {
      await createMysqlDb();
      logger.info(`Database ensured (mysql): ${env.db.name}`);
      return;
    }
    if (env.db.dialect === 'postgres') {
      try {
        await createPostgresDb();
        logger.info(`Database created (postgres): ${env.db.name}`);
      } catch (err) {
        // When DB already exists, postgres throws 42P04.
        if (err?.code === '42P04') {
          logger.info(`Database already exists (postgres): ${env.db.name}`);
        } else {
          throw err;
        }
      }
      return;
    }
    throw new Error(`Unsupported dialect for db:create: ${env.db.dialect}`);
  } catch (err) {
    logger.error('db:create failed', { message: err.message, code: err.code });
    process.exit(1);
  }
};

main();

