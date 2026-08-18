import { defineConfig } from 'drizzle-kit';
import { resolve } from 'node:path';

process.loadEnvFile?.(resolve(__dirname, '../../.env'));

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required for Drizzle Kit.');
}

export default defineConfig({
  dialect: 'postgresql',
  schema: './dist/schema/*.js',
  out: './src/migrations',
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
  strict: true,
  verbose: true,
});
