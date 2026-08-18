import { describe, expect, it } from 'vitest';

import { parseConfig } from './config.js';

const validEnvironment = {
  DATABASE_URL: 'postgresql://user:password@localhost:5432/visual_study',
  REDIS_URL: 'redis://localhost:6379',
};

describe('configuration', () => {
  it('parses valid values and applies defaults', () => {
    expect(parseConfig(validEnvironment)).toMatchObject({
      NODE_ENV: 'development',
      LOG_LEVEL: 'info',
      API_HOST: '0.0.0.0',
      API_PORT: 3001,
    });
  });

  it('rejects invalid values', () => {
    expect(() =>
      parseConfig({ ...validEnvironment, API_PORT: '70000' }),
    ).toThrow();
  });
});
