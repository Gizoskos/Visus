# Database

## Why PostgreSQL

PostgreSQL is the source of truth for Visual Study Engine because the project needs strong relational integrity for ownership, source traceability, transactional multi-record writes, and future PostgreSQL-native features such as pgvector. Redis remains queue infrastructure, not domain storage.

## Why Drizzle

Drizzle is the primary data-access layer because it keeps schema, migrations, and repository code in TypeScript without adding another ORM layer. Phase 2 uses Drizzle for CRUD, relations, migrations, transactions, and typed repositories.

## Where direct SQL fits

Direct SQL is still allowed when PostgreSQL-specific behavior is clearer or required. That includes future pgvector similarity search, advanced indexing, and one-off verification queries. Phase 2 keeps those cases minimal and does not add pgvector yet.

## Entities and relationships

- `users` own `subjects`
- `users` own `materials`
- `subjects` optionally group `materials`
- `materials` own `material_pages`
- `materials` own `material_chunks`
- `material_pages` optionally link to `material_chunks`

Ownership deletes are conservative:

- deleting a user is restricted while subjects or materials exist
- deleting a subject sets `materials.subject_id` to `null`
- deleting a material cascades to pages and chunks
- deleting a page sets `material_chunks.page_id` to `null`

## Indexes and constraints

Phase 2 creates these important indexes:

- `subjects_user_id_idx`
- `materials_user_id_idx`
- `materials_subject_id_idx`
- `materials_status_idx`
- `materials_content_hash_idx`
- `materials_content_hash_unique_idx` as a partial unique index where `content_hash is not null`
- `material_pages_material_id_idx`
- `material_pages_material_page_number_idx`
- `material_chunks_material_id_idx`
- `material_chunks_page_id_idx`
- `material_chunks_material_chunk_idx`

Important uniqueness rules:

- `materials.content_hash` is unique when present
- `material_pages (material_id, page_number)` is unique
- `material_chunks (material_id, chunk_index)` is unique

## Status and enums

`materials.status`:

- `pending`
- `processing`
- `completed`
- `failed`

`materials.source_type`:

- `text`
- `pdf`

`extraction_method`:

- `text`
- `native-pdf`
- `ocr`
- `vision`

## Migrations

Phase 2 uses Drizzle Kit to generate SQL migrations from the schema in `packages/db/src/schema`. Runtime migration execution is handled by `packages/db/src/migrate.ts`.

Commands:

- `pnpm db:generate`
- `pnpm db:migrate`
- `pnpm db:push`

`db:push` is for local development convenience only. Generated migrations remain the reproducible path.

## Seed workflow

`pnpm db:seed` creates a deterministic local dataset:

- one user
- one subject
- one material
- three pages
- four chunks

The seed deletes and recreates only its fixed IDs so repeated local runs stay stable.

## Transaction boundaries

Multi-record document writes should be wrapped in a database transaction. Phase 2 demonstrates that pattern for material, page, and chunk creation so ingestion-style operations commit together.

## Conventions

- UUID primary keys everywhere
- explicit foreign keys
- conservative `ON DELETE` behavior at ownership boundaries
- `created_at` and `updated_at` timestamps on every table
- repository layer kept independent from Fastify and worker bootstrapping
- Drizzle first, direct SQL only for PostgreSQL-specific cases
