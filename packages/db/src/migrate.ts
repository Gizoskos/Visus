import { migrate } from 'drizzle-orm/postgres-js/migrator';

import { createDatabaseConnection } from './client/index.js';

const connection = createDatabaseConnection();

try {
  await migrate(connection.db, {
    migrationsFolder: 'packages/db/src/migrations',
  });
} finally {
  await connection.close();
}
