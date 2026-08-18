import { expect, it, vi } from 'vitest';

import { runWorker } from './worker.js';

it('starts and stops when aborted', async () => {
  const controller = new AbortController();
  const info = vi.fn();
  const running = runWorker(controller.signal, { info });

  controller.abort();
  await running;

  expect(info.mock.calls).toEqual([['Worker started'], ['Worker stopped']]);
});
