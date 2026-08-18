import Fastify from 'fastify';
import type { Logger } from 'pino';

export function createApp(logger: Logger) {
  const app = Fastify({ loggerInstance: logger });
  let ready = false;

  app.addHook('onReady', () => {
    ready = true;
  });
  app.addHook('onClose', () => {
    ready = false;
  });

  app.get('/health', () => ({ status: 'ok' }));
  app.get('/ready', (_request, reply) => {
    if (!ready) {
      return reply.code(503).send({ status: 'not_ready' });
    }

    return { status: 'ready' };
  });

  return app;
}
