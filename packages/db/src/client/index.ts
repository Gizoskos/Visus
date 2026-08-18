import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres, { type Options, type Sql } from 'postgres';

import { loadConfig, type AppConfig } from '@visual-study/shared';

import * as schema from '../schema/index.js';

export type DatabaseClient = PostgresJsDatabase<typeof schema>;

export interface DatabaseConnection {
  db: DatabaseClient;
  sql: Sql;
  close: () => Promise<void>;
}

export interface DatabaseConnectionOptions {
  connectionString?: string;
  postgresOptions?: Options<Record<string, postgres.PostgresType>>;
}

export function createDatabaseConnection(
  config: Pick<AppConfig, 'DATABASE_URL'> = loadConfig(),
  options: DatabaseConnectionOptions = {},
): DatabaseConnection {
  const sql = postgres(options.connectionString ?? config.DATABASE_URL, {
    max: 1,
    prepare: false,
    ...options.postgresOptions,
  });

  return {
    db: drizzle(sql, { schema }),
    sql,
    close: async () => {
      await sql.end({ timeout: 5 });
    },
  };
}
