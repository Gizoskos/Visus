import { createLogger, loadConfig } from '@visual-study/shared';

import { createApp } from './app.js';

const config = loadConfig();
const logger = createLogger(config);
const app = createApp(logger);
let shuttingDown = false;

async function shutdown(signal: NodeJS.Signals): Promise<void> {
  if (shuttingDown) return;
  shuttingDown = true;
  app.log.info({ signal }, 'Shutting down API');
  await app.close();
}

process.once('SIGINT', () => void shutdown('SIGINT'));
process.once('SIGTERM', () => void shutdown('SIGTERM'));

try {
  await app.listen({ host: config.API_HOST, port: config.API_PORT });
} catch (error) {
  app.log.error(error, 'API failed to start');
  process.exitCode = 1;
}
