import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { getContractSource } from '../contracts/sources.js';
import { ReindexService } from '../services/reindex-service.js';

const querySchema = z.object({
  union: z.string().optional()
});

export function registerAdminRoutes(app: FastifyInstance, reindexService: ReindexService): void {
  app.post('/api/admin/reindex', async (request, reply) => {
    const query = querySchema.safeParse(request.query);

    if (!query.success) {
      return reply.status(400).send({ error: 'Invalid query params' });
    }

    const unionCode = query.data.union ?? 'NX';
    const source = getContractSource(unionCode);

    if (!source) {
      return reply.status(404).send({ error: `Unknown union code: ${unionCode}` });
    }

    reindexService.enqueue(unionCode);

    return reply.status(202).send({
      message: 'Reindex job dispatched',
      union: unionCode,
      schemaVersion: source.schemaVersion
    });
  });
}
