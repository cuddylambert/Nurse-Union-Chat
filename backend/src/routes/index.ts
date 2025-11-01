import type { FastifyInstance } from 'fastify';

import { AnswerService } from '../services/answer-service.js';
import { ReindexService } from '../services/reindex-service.js';
import { registerAdminRoutes } from './admin.js';
import { registerAskRoute } from './ask.js';
import { registerHealthRoute } from './health.js';
import { registerSourcesRoute } from './sources.js';

export function registerRoutes(
  app: FastifyInstance,
  services: { answerService: AnswerService; reindexService: ReindexService }
): void {
  registerHealthRoute(app);
  registerAskRoute(app, services.answerService);
  registerAdminRoutes(app, services.reindexService);
  registerSourcesRoute(app);
}
