import { asc, eq } from 'drizzle-orm';
import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';

import { subjects } from '../schema/index.js';
import type { RepositoryDb } from './types.js';

export type Subject = InferSelectModel<typeof subjects>;
export type CreateSubjectInput = Pick<
  InferInsertModel<typeof subjects>,
  'id' | 'userId' | 'name' | 'description'
>;

export class SubjectRepository {
  constructor(private readonly db: RepositoryDb) {}

  async create(input: CreateSubjectInput): Promise<Subject> {
    const [subject] = await this.db.insert(subjects).values(input).returning();
    if (!subject) {
      throw new Error('Failed to create subject.');
    }
    return subject;
  }

  async getById(id: string): Promise<Subject | null> {
    return (
      (await this.db.query.subjects.findFirst({
        where: eq(subjects.id, id),
      })) ?? null
    );
  }

  async listByUser(userId: string): Promise<Subject[]> {
    return this.db.query.subjects.findMany({
      where: eq(subjects.userId, userId),
      orderBy: [asc(subjects.createdAt), asc(subjects.id)],
    });
  }
}
