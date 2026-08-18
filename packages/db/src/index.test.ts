import { createHash, randomUUID } from 'node:crypto';

import { eq } from 'drizzle-orm';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import {
  createDatabaseConnection,
  MaterialChunkRepository,
  MaterialPageRepository,
  MaterialRepository,
  SubjectRepository,
  UserRepository,
} from './index.js';
import {
  materialChunks,
  materialPages,
  materials,
  subjects,
  users,
} from './schema/index.js';

function createDatabaseUrl(databaseName: string): string {
  const current = new URL(process.env.DATABASE_URL ?? '');
  current.pathname = `/${databaseName}`;
  return current.toString();
}

const adminUrl = createDatabaseUrl('postgres');
const testDatabaseName = `visual_study_test_${Date.now()}`;
const testDatabaseUrl = createDatabaseUrl(testDatabaseName);

describe('database integration', () => {
  const adminSql = postgres(adminUrl, { max: 1, prepare: false });
  const connection = createDatabaseConnection(
    { DATABASE_URL: testDatabaseUrl },
    { postgresOptions: { max: 1 } },
  );

  beforeAll(async () => {
    await adminSql.unsafe(`create database "${testDatabaseName}"`);
    await migrate(connection.db, {
      migrationsFolder: 'packages/db/src/migrations',
    });
  });

  afterAll(async () => {
    await connection.close();
    await adminSql`select pg_terminate_backend(pid)
      from pg_stat_activity
      where datname = ${testDatabaseName}
        and pid <> pg_backend_pid()`;
    await adminSql.unsafe(`drop database if exists "${testDatabaseName}"`);
    await adminSql.end({ timeout: 5 });
  });

  beforeEach(async () => {
    await connection.db.delete(materialChunks);
    await connection.db.delete(materialPages);
    await connection.db.delete(materials);
    await connection.db.delete(subjects);
    await connection.db.delete(users);
  });

  it('connects to PostgreSQL', async () => {
    const result = await connection.sql<
      { current_database: string }[]
    >`select current_database()`;
    const currentDatabase = result[0]?.current_database;

    expect(currentDatabase).toBe(testDatabaseName);
  });

  it('creates users and loads by id', async () => {
    const usersRepository = new UserRepository(connection.db);
    const userId = randomUUID();

    const created = await usersRepository.create({
      id: userId,
      displayName: 'Test User',
    });

    const loaded = await usersRepository.getById(userId);

    expect(created.id).toBe(userId);
    expect(loaded?.displayName).toBe('Test User');
  });

  it('creates subjects and lists them by user', async () => {
    const usersRepository = new UserRepository(connection.db);
    const subjectsRepository = new SubjectRepository(connection.db);
    const user = await usersRepository.create({
      id: randomUUID(),
      displayName: 'Subject Owner',
    });

    const created = await subjectsRepository.create({
      id: randomUUID(),
      userId: user.id,
      name: 'Biology',
      description: 'Cell structure',
    });

    const loaded = await subjectsRepository.getById(created.id);
    const listed = await subjectsRepository.listByUser(user.id);

    expect(loaded?.userId).toBe(user.id);
    expect(listed).toHaveLength(1);
    expect(listed[0]?.id).toBe(created.id);
  });

  it('creates materials, updates metadata and status, and queries ownership', async () => {
    const usersRepository = new UserRepository(connection.db);
    const subjectsRepository = new SubjectRepository(connection.db);
    const materialsRepository = new MaterialRepository(connection.db);
    const user = await usersRepository.create({
      id: randomUUID(),
      displayName: 'Material Owner',
    });
    const subject = await subjectsRepository.create({
      id: randomUUID(),
      userId: user.id,
      name: 'Chemistry',
      description: null,
    });

    const contentHash = createHash('sha256')
      .update('chemistry-material')
      .digest('hex');
    const material = await materialsRepository.create({
      id: randomUUID(),
      userId: user.id,
      subjectId: subject.id,
      title: 'Acids and Bases',
      sourceType: 'pdf',
      status: 'pending',
      contentHash,
      originalFilename: null,
      mimeType: null,
      language: null,
      pageCount: null,
      extractionMethod: null,
      storageKey: null,
    });

    const updatedMetadata = await materialsRepository.updateMetadata({
      id: material.id,
      originalFilename: 'acids-and-bases.pdf',
      mimeType: 'application/pdf',
      language: 'en',
      pageCount: 2,
      extractionMethod: 'native-pdf',
      storageKey: 'materials/acids-and-bases.pdf',
      contentHash,
    });
    const updatedStatus = await materialsRepository.updateStatus({
      id: material.id,
      status: 'completed',
    });

    expect((await materialsRepository.getById(material.id))?.id).toBe(
      material.id,
    );
    expect(await materialsRepository.listByUser(user.id)).toHaveLength(1);
    expect(await materialsRepository.listBySubject(subject.id)).toHaveLength(1);
    expect((await materialsRepository.findByContentHash(contentHash))?.id).toBe(
      material.id,
    );
    expect(updatedMetadata.pageCount).toBe(2);
    expect(updatedStatus.status).toBe('completed');
  });

  it('creates pages and chunks and queries them efficiently', async () => {
    const usersRepository = new UserRepository(connection.db);
    const materialsRepository = new MaterialRepository(connection.db);
    const pagesRepository = new MaterialPageRepository(connection.db);
    const chunksRepository = new MaterialChunkRepository(connection.db);
    const user = await usersRepository.create({
      id: randomUUID(),
      displayName: 'Reader',
    });
    const material = await materialsRepository.create({
      id: randomUUID(),
      userId: user.id,
      subjectId: null,
      title: 'Plain Text Note',
      sourceType: 'text',
      status: 'processing',
      contentHash: null,
      originalFilename: null,
      mimeType: 'text/plain',
      language: 'en',
      pageCount: null,
      extractionMethod: 'text',
      storageKey: null,
    });

    const [firstPage, secondPage] = await pagesRepository.createMany([
      {
        id: randomUUID(),
        materialId: material.id,
        pageNumber: 1,
        rawText: 'Page one',
        normalizedText: 'page one',
        extractionMethod: 'text',
        imageStorageKey: null,
        ocrConfidence: null,
      },
      {
        id: randomUUID(),
        materialId: material.id,
        pageNumber: 2,
        rawText: 'Page two',
        normalizedText: 'page two',
        extractionMethod: 'text',
        imageStorageKey: null,
        ocrConfidence: null,
      },
    ]);

    await chunksRepository.createMany([
      {
        id: randomUUID(),
        materialId: material.id,
        pageId: firstPage?.id ?? null,
        chunkIndex: 0,
        content: 'Chunk one',
        tokenEstimate: 2,
        startOffset: 0,
        endOffset: 9,
      },
      {
        id: randomUUID(),
        materialId: material.id,
        pageId: secondPage?.id ?? null,
        chunkIndex: 1,
        content: 'Chunk two',
        tokenEstimate: 2,
        startOffset: 10,
        endOffset: 19,
      },
    ]);

    expect(await pagesRepository.getByMaterial(material.id)).toHaveLength(2);
    expect(
      await pagesRepository.getByMaterialAndPageNumber(material.id, 2),
    ).toMatchObject({
      id: secondPage?.id,
    });
    expect(await chunksRepository.getByMaterial(material.id)).toHaveLength(2);
    expect(await chunksRepository.getByPage(secondPage?.id ?? '')).toHaveLength(
      1,
    );
  });

  it('enforces unique page numbers within a material', async () => {
    const user = await new UserRepository(connection.db).create({
      id: randomUUID(),
      displayName: 'Unique Page Owner',
    });
    const material = await new MaterialRepository(connection.db).create({
      id: randomUUID(),
      userId: user.id,
      subjectId: null,
      title: 'Duplicate Page Test',
      sourceType: 'pdf',
      status: 'pending',
      contentHash: null,
      originalFilename: null,
      mimeType: null,
      language: null,
      pageCount: null,
      extractionMethod: null,
      storageKey: null,
    });
    const pagesRepository = new MaterialPageRepository(connection.db);

    await pagesRepository.create({
      id: randomUUID(),
      materialId: material.id,
      pageNumber: 1,
      imageStorageKey: null,
      rawText: null,
      normalizedText: null,
      extractionMethod: null,
      ocrConfidence: null,
    });

    await expect(
      pagesRepository.create({
        id: randomUUID(),
        materialId: material.id,
        pageNumber: 1,
        imageStorageKey: null,
        rawText: null,
        normalizedText: null,
        extractionMethod: null,
        ocrConfidence: null,
      }),
    ).rejects.toThrow();
  });

  it('enforces unique chunk indexes within a material', async () => {
    const user = await new UserRepository(connection.db).create({
      id: randomUUID(),
      displayName: 'Unique Chunk Owner',
    });
    const material = await new MaterialRepository(connection.db).create({
      id: randomUUID(),
      userId: user.id,
      subjectId: null,
      title: 'Duplicate Chunk Test',
      sourceType: 'text',
      status: 'pending',
      contentHash: null,
      originalFilename: null,
      mimeType: null,
      language: null,
      pageCount: null,
      extractionMethod: null,
      storageKey: null,
    });
    const chunksRepository = new MaterialChunkRepository(connection.db);

    await chunksRepository.create({
      id: randomUUID(),
      materialId: material.id,
      pageId: null,
      chunkIndex: 0,
      content: 'Chunk zero',
      tokenEstimate: null,
      startOffset: null,
      endOffset: null,
    });

    await expect(
      chunksRepository.create({
        id: randomUUID(),
        materialId: material.id,
        pageId: null,
        chunkIndex: 0,
        content: 'Chunk zero again',
        tokenEstimate: null,
        startOffset: null,
        endOffset: null,
      }),
    ).rejects.toThrow();
  });

  it('uses transactions for multi-record document operations', async () => {
    await connection.db.transaction(async (tx) => {
      const usersRepository = new UserRepository(tx as typeof connection.db);
      const materialsRepository = new MaterialRepository(
        tx as typeof connection.db,
      );
      const pagesRepository = new MaterialPageRepository(
        tx as typeof connection.db,
      );
      const chunksRepository = new MaterialChunkRepository(
        tx as typeof connection.db,
      );

      const user = await usersRepository.create({
        id: randomUUID(),
        displayName: 'Transactional User',
      });
      const material = await materialsRepository.create({
        id: randomUUID(),
        userId: user.id,
        subjectId: null,
        title: 'Transaction Note',
        sourceType: 'text',
        status: 'processing',
        contentHash: null,
        originalFilename: null,
        mimeType: 'text/plain',
        language: 'en',
        pageCount: 1,
        extractionMethod: 'text',
        storageKey: null,
      });
      const [page] = await pagesRepository.createMany([
        {
          id: randomUUID(),
          materialId: material.id,
          pageNumber: 1,
          imageStorageKey: null,
          rawText: 'Joined transaction',
          normalizedText: 'joined transaction',
          extractionMethod: 'text',
          ocrConfidence: null,
        },
      ]);

      await chunksRepository.createMany([
        {
          id: randomUUID(),
          materialId: material.id,
          pageId: page?.id ?? null,
          chunkIndex: 0,
          content: 'Everything committed together.',
          tokenEstimate: 4,
          startOffset: 0,
          endOffset: 29,
        },
      ]);
    });

    expect(await connection.db.select().from(materials)).toHaveLength(1);
    expect(await connection.db.select().from(materialPages)).toHaveLength(1);
    expect(await connection.db.select().from(materialChunks)).toHaveLength(1);
  });

  it('applies foreign-key delete behavior without silent academic data loss', async () => {
    const usersRepository = new UserRepository(connection.db);
    const subjectsRepository = new SubjectRepository(connection.db);
    const materialsRepository = new MaterialRepository(connection.db);
    const pagesRepository = new MaterialPageRepository(connection.db);
    const chunksRepository = new MaterialChunkRepository(connection.db);
    const user = await usersRepository.create({
      id: randomUUID(),
      displayName: 'FK Owner',
    });
    const subject = await subjectsRepository.create({
      id: randomUUID(),
      userId: user.id,
      name: 'Physics',
      description: null,
    });
    const material = await materialsRepository.create({
      id: randomUUID(),
      userId: user.id,
      subjectId: subject.id,
      title: 'Motion',
      sourceType: 'pdf',
      status: 'completed',
      contentHash: null,
      originalFilename: null,
      mimeType: null,
      language: null,
      pageCount: null,
      extractionMethod: null,
      storageKey: null,
    });
    const page = await pagesRepository.create({
      id: randomUUID(),
      materialId: material.id,
      pageNumber: 1,
      imageStorageKey: null,
      rawText: 'Motion basics',
      normalizedText: 'motion basics',
      extractionMethod: 'text',
      ocrConfidence: null,
    });
    const chunk = await chunksRepository.create({
      id: randomUUID(),
      materialId: material.id,
      pageId: page.id,
      chunkIndex: 0,
      content: 'Speed is distance over time.',
      tokenEstimate: 6,
      startOffset: 0,
      endOffset: 28,
    });

    await expect(
      connection.db.delete(users).where(eq(users.id, user.id)),
    ).rejects.toThrow();

    await connection.db.delete(subjects).where(eq(subjects.id, subject.id));
    expect(
      (await materialsRepository.getById(material.id))?.subjectId,
    ).toBeNull();

    await connection.db
      .delete(materialPages)
      .where(eq(materialPages.id, page.id));
    expect(await chunksRepository.getByPage(page.id)).toHaveLength(0);
    const danglingChunk = await connection.db.query.materialChunks.findFirst({
      where: eq(materialChunks.id, chunk.id),
    });
    expect(danglingChunk?.pageId).toBeNull();

    await connection.db.delete(materials).where(eq(materials.id, material.id));
    expect(await connection.db.select().from(materialChunks)).toHaveLength(0);
  });

  it('creates the expected schema objects and indexes during migration', async () => {
    const tables = await connection.sql<{ tablename: string }[]>`
      select tablename
      from pg_tables
      where schemaname = 'public'
        and tablename in ('users', 'subjects', 'materials', 'material_pages', 'material_chunks')
      order by tablename
    `;
    const indexes = await connection.sql<{ indexname: string }[]>`
      select indexname
      from pg_indexes
      where schemaname = 'public'
        and indexname in (
          'subjects_user_id_idx',
          'materials_user_id_idx',
          'materials_subject_id_idx',
          'materials_status_idx',
          'materials_content_hash_idx',
          'materials_content_hash_unique_idx',
          'material_pages_material_id_idx',
          'material_pages_material_page_number_idx',
          'material_chunks_material_id_idx',
          'material_chunks_page_id_idx',
          'material_chunks_material_chunk_idx'
        )
      order by indexname
    `;

    expect(tables.map((row) => row.tablename)).toEqual([
      'material_chunks',
      'material_pages',
      'materials',
      'subjects',
      'users',
    ]);
    expect(indexes).toHaveLength(11);
  });
});
