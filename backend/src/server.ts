import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';

import { env } from './env.js';
import { logger } from './logger.js';
import { registerRoutes } from './routes/index.js';
import { ContractRetriever } from './retrieval/retriever.js';
import { OpenAiEmbeddingsProvider } from './retrieval/embeddings.js';
import { AnswerService } from './services/answer-service.js';
import { ReindexService } from './services/reindex-service.js';

export function buildServer() {
  const app = Fastify({ logger });

  void app.register(cors, {
    origin: true,
    credentials: true
  });

  void app.register(helmet, {
    contentSecurityPolicy: false
  });

  void app.register(rateLimit, {
    max: 60,
    timeWindow: '1 minute'
  });

  const embeddings = new OpenAiEmbeddingsProvider();
  const retriever = new ContractRetriever(embeddings);
  const answerService = new AnswerService(retriever);
  const reindexService = new ReindexService();

  registerRoutes(app, { answerService, reindexService });

  app.ready().then(() => {
    logger.info({
      unions: ['NX'],
      telemetry: env.ENABLE_TELEMETRY,
      embeddings: embeddings.isEnabled
    }, 'Server initialized');
  });

  return app;
}
