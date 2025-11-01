import type { FastifyInstance } from 'fastify';

import { getHealth } from '../db/pool.js';

export function registerHealthRoute(app: FastifyInstance): void {
  app.get('/healthz', async (_request, reply) => {
    const healthy = await getHealth();
    return reply.send({ status: healthy ? 'ok' : 'degraded' });
  });
}
