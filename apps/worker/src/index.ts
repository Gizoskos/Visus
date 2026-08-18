import { createLogger, loadConfig } from '@visual-study/shared';

import { runWorker } from './worker.js';

const logger = createLogger(loadConfig());
const controller = new AbortController();

function shutdown(signal: NodeJS.Signals): void {
  logger.info({ signal }, 'Shutting down worker');
  controller.abort();
}

process.once('SIGINT', () => shutdown('SIGINT'));
process.once('SIGTERM', () => shutdown('SIGTERM'));

await runWorker(controller.signal, logger);
