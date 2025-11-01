import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { env } from '../env.js';
import type { AskRequestBody } from '../types.js';
import { logger } from '../logger.js';
import { AnswerService } from '../services/answer-service.js';

const requestBodySchema = z.object({
  question: z.string().min(8, 'Please provide a question.').max(1000),
  unionCode: z.string().optional(),
  documentIds: z.array(z.string()).optional()
});

export function registerAskRoute(app: FastifyInstance, answerService: AnswerService): void {
  app.post('/api/ask', async (request, reply) => {
    const body = requestBodySchema.safeParse(request.body);

    if (!body.success) {
      return reply.status(400).send({
        error: 'Invalid request body',
        details: body.error.flatten()
      });
    }

    const payload: AskRequestBody = body.data;
    const unionCode = (payload.unionCode ?? env.DEFAULT_UNION_CODE).toUpperCase();

    try {
      const result = await answerService.ask(payload.question, unionCode);
      return reply.send(result);
    } catch (error) {
      logger.error({ err: error }, 'Failed to handle /api/ask request');
      return reply.status(500).send({ error: 'Unable to generate an answer right now.' });
    }
  });
}
