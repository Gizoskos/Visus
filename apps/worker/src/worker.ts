import type { Logger } from 'pino';

export async function runWorker(
  signal: AbortSignal,
  logger: Pick<Logger, 'info'>,
): Promise<void> {
  logger.info('Worker started');

  if (!signal.aborted) {
    await new Promise<void>((resolve) => {
      const keepAlive = setInterval(() => undefined, 86_400_000);
      signal.addEventListener(
        'abort',
        () => {
          clearInterval(keepAlive);
          resolve();
        },
        { once: true },
      );
    });
  }

  logger.info('Worker stopped');
}
