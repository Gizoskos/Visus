import { relations } from 'drizzle-orm';
import {
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

import { materials } from './materials.js';
import { materialPages } from './material-pages.js';

export const materialChunks = pgTable(
  'material_chunks',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    materialId: uuid('material_id')
      .notNull()
      .references(() => materials.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),
    pageId: uuid('page_id').references(() => materialPages.id, {
      onDelete: 'set null',
      onUpdate: 'cascade',
    }),
    chunkIndex: integer('chunk_index').notNull(),
    content: text('content').notNull(),
    tokenEstimate: integer('token_estimate'),
    startOffset: integer('start_offset'),
    endOffset: integer('end_offset'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    materialIdIndex: index('material_chunks_material_id_idx').on(
      table.materialId,
    ),
    pageIdIndex: index('material_chunks_page_id_idx').on(table.pageId),
    materialChunkIndex: uniqueIndex('material_chunks_material_chunk_idx').on(
      table.materialId,
      table.chunkIndex,
    ),
  }),
);

export const materialChunksRelations = relations(materialChunks, ({ one }) => ({
  material: one(materials, {
    fields: [materialChunks.materialId],
    references: [materials.id],
  }),
  page: one(materialPages, {
    fields: [materialChunks.pageId],
    references: [materialPages.id],
  }),
}));
