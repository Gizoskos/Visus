import { createHash } from 'node:crypto';

import { eq } from 'drizzle-orm';

import {
  createDatabaseConnection,
  MaterialChunkRepository,
  MaterialPageRepository,
  MaterialRepository,
  SubjectRepository,
  UserRepository,
} from '../index.js';
import {
  materialChunks,
  materialPages,
  materials,
  subjects,
  users,
} from '../schema/index.js';
import { seedIds } from './data.js';

async function seed(): Promise<void> {
  const connection = createDatabaseConnection();

  try {
    await connection.db.transaction(async (tx) => {
      const userRepository = new UserRepository(tx as typeof connection.db);
      const subjectRepository = new SubjectRepository(
        tx as typeof connection.db,
      );
      const materialRepository = new MaterialRepository(
        tx as typeof connection.db,
      );
      const materialPageRepository = new MaterialPageRepository(
        tx as typeof connection.db,
      );
      const materialChunkRepository = new MaterialChunkRepository(
        tx as typeof connection.db,
      );

      await tx
        .delete(materialChunks)
        .where(eq(materialChunks.materialId, seedIds.materialId));
      await tx
        .delete(materialPages)
        .where(eq(materialPages.materialId, seedIds.materialId));
      await tx.delete(materials).where(eq(materials.id, seedIds.materialId));
      await tx.delete(subjects).where(eq(subjects.id, seedIds.subjectId));
      await tx.delete(users).where(eq(users.id, seedIds.userId));

      await userRepository.create({
        id: seedIds.userId,
        displayName: 'Ada Lovelace',
      });

      await subjectRepository.create({
        id: seedIds.subjectId,
        userId: seedIds.userId,
        name: 'Linear Algebra',
        description: 'Vectors, matrices, and transformations.',
      });

      const material = await materialRepository.create({
        id: seedIds.materialId,
        userId: seedIds.userId,
        subjectId: seedIds.subjectId,
        title: 'Week 1 Lecture Notes',
        sourceType: 'pdf',
        originalFilename: 'linear-algebra-week-1.pdf',
        mimeType: 'application/pdf',
        status: 'completed',
        contentHash: createHash('sha256')
          .update('week-1-lecture-notes')
          .digest('hex'),
        language: 'en',
        pageCount: 3,
        extractionMethod: 'native-pdf',
        storageKey: 'materials/linear-algebra/week-1.pdf',
      });

      const pages = await materialPageRepository.createMany([
        {
          id: seedIds.pageOneId,
          materialId: material.id,
          pageNumber: 1,
          rawText: 'Vectors describe magnitude and direction.',
          normalizedText: 'vectors describe magnitude and direction',
          extractionMethod: 'native-pdf',
        },
        {
          id: seedIds.pageTwoId,
          materialId: material.id,
          pageNumber: 2,
          rawText: 'Matrices transform vectors.',
          normalizedText: 'matrices transform vectors',
          extractionMethod: 'native-pdf',
        },
        {
          id: seedIds.pageThreeId,
          materialId: material.id,
          pageNumber: 3,
          rawText: 'Eigenvalues scale eigenvectors.',
          normalizedText: 'eigenvalues scale eigenvectors',
          extractionMethod: 'native-pdf',
        },
      ]);

      await materialChunkRepository.createMany([
        {
          id: seedIds.chunkOneId,
          materialId: material.id,
          pageId: pages[0]?.id,
          chunkIndex: 0,
          content: 'A vector has magnitude and direction.',
          tokenEstimate: 8,
          startOffset: 0,
          endOffset: 38,
        },
        {
          id: seedIds.chunkTwoId,
          materialId: material.id,
          pageId: pages[1]?.id,
          chunkIndex: 1,
          content: 'A matrix can rotate or scale a vector.',
          tokenEstimate: 10,
          startOffset: 39,
          endOffset: 80,
        },
        {
          id: seedIds.chunkThreeId,
          materialId: material.id,
          pageId: pages[2]?.id,
          chunkIndex: 2,
          content: 'Eigenvectors keep direction during transformation.',
          tokenEstimate: 9,
          startOffset: 81,
          endOffset: 132,
        },
        {
          id: seedIds.chunkFourId,
          materialId: material.id,
          pageId: null,
          chunkIndex: 3,
          content: 'Determinants capture area scaling.',
          tokenEstimate: 5,
          startOffset: 133,
          endOffset: 168,
        },
      ]);
    });
  } finally {
    await connection.close();
  }
}

await seed();
