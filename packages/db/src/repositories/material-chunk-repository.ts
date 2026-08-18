import { asc, eq } from 'drizzle-orm';
import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';

import { materialChunks } from '../schema/index.js';
import type { RepositoryDb } from './types.js';

export type MaterialChunk = InferSelectModel<typeof materialChunks>;
export type CreateMaterialChunkInput = Pick<
  InferInsertModel<typeof materialChunks>,
  | 'id'
  | 'materialId'
  | 'pageId'
  | 'chunkIndex'
  | 'content'
  | 'tokenEstimate'
  | 'startOffset'
  | 'endOffset'
>;

export class MaterialChunkRepository {
  constructor(private readonly db: RepositoryDb) {}

  async create(input: CreateMaterialChunkInput): Promise<MaterialChunk> {
    const [chunk] = await this.db
      .insert(materialChunks)
      .values(input)
      .returning();
    if (!chunk) {
      throw new Error('Failed to create material chunk.');
    }
    return chunk;
  }

  async createMany(
    inputs: CreateMaterialChunkInput[],
  ): Promise<MaterialChunk[]> {
    if (inputs.length === 0) {
      return [];
    }

    return this.db.insert(materialChunks).values(inputs).returning();
  }

  async getByMaterial(materialId: string): Promise<MaterialChunk[]> {
    return this.db.query.materialChunks.findMany({
      where: eq(materialChunks.materialId, materialId),
      orderBy: [asc(materialChunks.chunkIndex)],
    });
  }

  async getByPage(pageId: string): Promise<MaterialChunk[]> {
    return this.db.query.materialChunks.findMany({
      where: eq(materialChunks.pageId, pageId),
      orderBy: [asc(materialChunks.chunkIndex)],
    });
  }
}
