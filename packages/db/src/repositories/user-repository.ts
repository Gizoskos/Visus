import { eq } from 'drizzle-orm';
import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';

import { users } from '../schema/index.js';
import type { RepositoryDb } from './types.js';

export type User = InferSelectModel<typeof users>;
export type CreateUserInput = Pick<
  InferInsertModel<typeof users>,
  'id' | 'displayName'
>;

export class UserRepository {
  constructor(private readonly db: RepositoryDb) {}

  async create(input: CreateUserInput): Promise<User> {
    const [user] = await this.db.insert(users).values(input).returning();
    if (!user) {
      throw new Error('Failed to create user.');
    }
    return user;
  }

  async getById(id: string): Promise<User | null> {
    return (
      (await this.db.query.users.findFirst({
        where: eq(users.id, id),
      })) ?? null
    );
  }
}
