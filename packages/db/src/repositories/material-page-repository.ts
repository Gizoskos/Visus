import { asc, eq } from 'drizzle-orm';
import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';

import { materialPages } from '../schema/index.js';
import type { RepositoryDb } from './types.js';

export type MaterialPage = InferSelectModel<typeof materialPages>;
export type CreateMaterialPageInput = Pick<
  InferInsertModel<typeof materialPages>,
  | 'id'
  | 'materialId'
  | 'pageNumber'
  | 'imageStorageKey'
  | 'rawText'
  | 'normalizedText'
  | 'extractionMethod'
  | 'ocrConfidence'
>;

export class MaterialPageRepository {
  constructor(private readonly db: RepositoryDb) {}

  async create(input: CreateMaterialPageInput): Promise<MaterialPage> {
    const [page] = await this.db
      .insert(materialPages)
      .values(input)
      .returning();
    if (!page) {
      throw new Error('Failed to create material page.');
    }
    return page;
  }

  async createMany(inputs: CreateMaterialPageInput[]): Promise<MaterialPage[]> {
    if (inputs.length === 0) {
      return [];
    }

    return this.db.insert(materialPages).values(inputs).returning();
  }

  async getByMaterial(materialId: string): Promise<MaterialPage[]> {
    return this.db.query.materialPages.findMany({
      where: eq(materialPages.materialId, materialId),
      orderBy: [asc(materialPages.pageNumber)],
    });
  }

  async getByMaterialAndPageNumber(
    materialId: string,
    pageNumber: number,
  ): Promise<MaterialPage | null> {
    return (
      (await this.db.query.materialPages.findFirst({
        where: (table, { and, eq: eqOperator }) =>
          and(
            eqOperator(table.materialId, materialId),
            eqOperator(table.pageNumber, pageNumber),
          ),
      })) ?? null
    );
  }
}
