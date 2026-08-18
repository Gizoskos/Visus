import { pgEnum } from 'drizzle-orm/pg-core';

export const materialSourceTypeEnum = pgEnum('material_source_type', [
  'text',
  'pdf',
]);

export const materialStatusEnum = pgEnum('material_status', [
  'pending',
  'processing',
  'completed',
  'failed',
]);

export const extractionMethodEnum = pgEnum('extraction_method', [
  'text',
  'native-pdf',
  'ocr',
  'vision',
]);
