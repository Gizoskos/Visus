import { relations } from 'drizzle-orm';
import {
  doublePrecision,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

import { extractionMethodEnum } from './enums.js';
import { materials } from './materials.js';
import { materialChunks } from './material-chunks.js';

export const materialPages = pgTable(
  'material_pages',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    materialId: uuid('material_id')
      .notNull()
      .references(() => materials.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),
    pageNumber: integer('page_number').notNull(),
    imageStorageKey: text('image_storage_key'),
    rawText: text('raw_text'),
    normalizedText: text('normalized_text'),
    extractionMethod: extractionMethodEnum('extraction_method'),
    ocrConfidence: doublePrecision('ocr_confidence'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    materialIdIndex: index('material_pages_material_id_idx').on(
      table.materialId,
    ),
    materialPageNumberIndex: uniqueIndex(
      'material_pages_material_page_number_idx',
    ).on(table.materialId, table.pageNumber),
  }),
);

export const materialPagesRelations = relations(
  materialPages,
  ({ one, many }) => ({
    material: one(materials, {
      fields: [materialPages.materialId],
      references: [materials.id],
    }),
    chunks: many(materialChunks),
  }),
);
