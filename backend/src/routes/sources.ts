import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { pool } from '../db/pool.js';
import { getContractSource } from '../contracts/sources.js';
import { logger } from '../logger.js';

const querySchema = z.object({
  union: z.string().optional()
});

export function registerSourcesRoute(app: FastifyInstance): void {
  app.get('/api/sources', async (request, reply) => {
    const query = querySchema.safeParse(request.query);

    if (!query.success) {
      return reply.status(400).send({ error: 'Invalid query params' });
    }

    const unionCode = query.data.union ?? 'NX';
    const contractSource = getContractSource(unionCode);

    if (!contractSource) {
      return reply.status(404).send({ error: `Unknown union code: ${unionCode}` });
    }

    try {
      const { rows } = await pool.query(
        `
        SELECT
          id,
          union_code,
          title,
          url,
          sha256,
          last_ingested_at
        FROM contract_documents
        WHERE union_code = $1
        ORDER BY title
      `,
        [unionCode]
      );

      return reply.send({
        union: unionCode,
        displayName: contractSource.displayName,
        schemaVersion: contractSource.schemaVersion,
        documents: rows
      });
    } catch (error) {
      logger.warn({ err: error }, 'Failed to fetch source documents');
      return reply.send({
        union: unionCode,
        displayName: contractSource.displayName,
        schemaVersion: contractSource.schemaVersion,
        documents: []
      });
    }
  });
}
