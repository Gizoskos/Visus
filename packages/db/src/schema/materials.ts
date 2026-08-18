import { relations, sql } from 'drizzle-orm';
import {
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

import {
  extractionMethodEnum,
  materialSourceTypeEnum,
  materialStatusEnum,
} from './enums.js';
import { materialChunks } from './material-chunks.js';
import { materialPages } from './material-pages.js';
import { subjects } from './subjects.js';
import { users } from './users.js';

export const materials = pgTable(
  'materials',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, {
        onDelete: 'restrict',
        onUpdate: 'cascade',
      }),
    subjectId: uuid('subject_id').references(() => subjects.id, {
      onDelete: 'set null',
      onUpdate: 'cascade',
    }),
    title: text('title').notNull(),
    sourceType: materialSourceTypeEnum('source_type').notNull(),
    originalFilename: text('original_filename'),
    mimeType: text('mime_type'),
    status: materialStatusEnum('status').notNull().default('pending'),
    contentHash: text('content_hash'),
    language: text('language'),
    pageCount: integer('page_count'),
    extractionMethod: extractionMethodEnum('extraction_method'),
    storageKey: text('storage_key'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    userIdIndex: index('materials_user_id_idx').on(table.userId),
    subjectIdIndex: index('materials_subject_id_idx').on(table.subjectId),
    statusIndex: index('materials_status_idx').on(table.status),
    contentHashIndex: index('materials_content_hash_idx').on(table.contentHash),
    contentHashUniqueIndex: uniqueIndex('materials_content_hash_unique_idx')
      .on(table.contentHash)
      .where(sql`${table.contentHash} is not null`),
  }),
);

export const materialsRelations = relations(materials, ({ one, many }) => ({
  user: one(users, {
    fields: [materials.userId],
    references: [users.id],
  }),
  subject: one(subjects, {
    fields: [materials.subjectId],
    references: [subjects.id],
  }),
  pages: many(materialPages),
  chunks: many(materialChunks),
}));

export type MaterialSourceType =
  (typeof materialSourceTypeEnum.enumValues)[number];
export type MaterialStatus = (typeof materialStatusEnum.enumValues)[number];
export type ExtractionMethod = (typeof extractionMethodEnum.enumValues)[number];
