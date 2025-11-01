import { env } from './env.js';
import { logger } from './logger.js';
import { buildServer } from './server.js';
import { startTelemetry, stopTelemetry } from './telemetry.js';

async function main() {
  await startTelemetry();

  const app = buildServer();

  const shutdown = async (signal: string) => {
    logger.info({ signal }, 'Received shutdown signal');
    await app.close();
    await stopTelemetry();
    process.exit(0);
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));

  try {
    await app.listen({ port: env.PORT, host: env.HOST });
    logger.info({ port: env.PORT, host: env.HOST }, 'UnionExplain backend listening');
  } catch (error) {
    logger.error({ err: error }, 'Failed to start server');
    await stopTelemetry();
    process.exit(1);
  }
}

void main();
