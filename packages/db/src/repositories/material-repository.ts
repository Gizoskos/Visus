import { asc, eq } from 'drizzle-orm';
import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';

import {
  materials,
  type ExtractionMethod,
  type MaterialStatus,
} from '../schema/index.js';
import type { RepositoryDb } from './types.js';

export type Material = InferSelectModel<typeof materials>;
export type CreateMaterialInput = Pick<
  InferInsertModel<typeof materials>,
  | 'id'
  | 'userId'
  | 'subjectId'
  | 'title'
  | 'sourceType'
  | 'originalFilename'
  | 'mimeType'
  | 'status'
  | 'contentHash'
  | 'language'
  | 'pageCount'
  | 'extractionMethod'
  | 'storageKey'
>;

export interface UpdateMaterialStatusInput {
  id: string;
  status: MaterialStatus;
}

export interface UpdateMaterialMetadataInput {
  id: string;
  originalFilename?: string | null;
  mimeType?: string | null;
  contentHash?: string | null;
  language?: string | null;
  pageCount?: number | null;
  extractionMethod?: ExtractionMethod | null;
  storageKey?: string | null;
}

export class MaterialRepository {
  constructor(private readonly db: RepositoryDb) {}

  async create(input: CreateMaterialInput): Promise<Material> {
    const [material] = await this.db
      .insert(materials)
      .values(input)
      .returning();
    if (!material) {
      throw new Error('Failed to create material.');
    }
    return material;
  }

  async getById(id: string): Promise<Material | null> {
    return (
      (await this.db.query.materials.findFirst({
        where: eq(materials.id, id),
      })) ?? null
    );
  }

  async listByUser(userId: string): Promise<Material[]> {
    return this.db.query.materials.findMany({
      where: eq(materials.userId, userId),
      orderBy: [asc(materials.createdAt), asc(materials.id)],
    });
  }

  async listBySubject(subjectId: string): Promise<Material[]> {
    return this.db.query.materials.findMany({
      where: eq(materials.subjectId, subjectId),
      orderBy: [asc(materials.createdAt), asc(materials.id)],
    });
  }

  async updateStatus(input: UpdateMaterialStatusInput): Promise<Material> {
    const [material] = await this.db
      .update(materials)
      .set({
        status: input.status,
        updatedAt: new Date(),
      })
      .where(eq(materials.id, input.id))
      .returning();

    if (!material) {
      throw new Error(`Material ${input.id} was not found.`);
    }

    return material;
  }

  async updateMetadata(input: UpdateMaterialMetadataInput): Promise<Material> {
    const [material] = await this.db
      .update(materials)
      .set({
        originalFilename: input.originalFilename,
        mimeType: input.mimeType,
        contentHash: input.contentHash,
        language: input.language,
        pageCount: input.pageCount,
        extractionMethod: input.extractionMethod,
        storageKey: input.storageKey,
        updatedAt: new Date(),
      })
      .where(eq(materials.id, input.id))
      .returning();

    if (!material) {
      throw new Error(`Material ${input.id} was not found.`);
    }

    return material;
  }

  async findByContentHash(contentHash: string): Promise<Material | null> {
    return (
      (await this.db.query.materials.findFirst({
        where: eq(materials.contentHash, contentHash),
      })) ?? null
    );
  }
}
