import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

import { logger } from '../logger.js';

export class ReindexService {
  enqueue(unionCode: string): void {
    const slug = unionCode.toLowerCase();
    const script = path.resolve(process.cwd(), 'ingest', `${slug}_crawl.js`);

    if (!fs.existsSync(script)) {
      logger.error({ unionCode, script }, 'Ingestion script not found');
      return;
    }

    const child = spawn('node', [script, '--union', unionCode], {
      stdio: 'inherit'
    });

    child.on('error', (error) => {
      logger.error({ err: error, unionCode }, 'Failed to launch ingestion script');
    });

    child.on('close', (code) => {
      if (code === 0) {
        logger.info({ unionCode }, 'Ingestion completed');
      } else {
        logger.error({ unionCode, code }, 'Ingestion exited with non-zero code');
      }
    });
  }
}
