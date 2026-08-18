import { expect, it } from 'vitest';

import { PROJECT_NAME } from './index.js';

it('is importable', () => {
  expect(PROJECT_NAME).toBe('Visual Study Engine');
});
