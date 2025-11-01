import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';

import { env } from './env.js';
import { logger } from './logger.js';

let sdk: NodeSDK | null = null;

diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.ERROR);

export async function startTelemetry(): Promise<void> {
  if (!env.ENABLE_TELEMETRY || sdk) {
    return;
  }

  sdk = new NodeSDK({
    serviceName: 'unionexplain-backend',
    autoDetectResources: true,
    instrumentations: [getNodeAutoInstrumentations()]
  });

  try {
    await sdk.start();
    logger.info('Telemetry started');
  } catch (error) {
    logger.warn({ err: error }, 'Unable to start telemetry');
  }
}

export async function stopTelemetry(): Promise<void> {
  if (!sdk) {
    return;
  }

  try {
    await sdk.shutdown();
  } catch (error) {
    logger.warn({ err: error }, 'Error shutting down telemetry');
  } finally {
    sdk = null;
  }
}
