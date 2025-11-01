import { Pool } from 'pg';
import { registerTypeParser } from 'pgvector/pg';

import { env } from '../env.js';
import { logger } from '../logger.js';

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000
});

registerTypeParser(pool);

pool.on('error', (error) => {
  logger.error({ err: error }, 'Unexpected database error');
});

export async function getHealth(): Promise<boolean> {
  try {
    await pool.query('select 1');
    return true;
  } catch (error) {
    logger.warn({ err: error }, 'Database health check failed');
    return false;
  }
}
