CREATE TYPE "public"."extraction_method" AS ENUM('text', 'native-pdf', 'ocr', 'vision');--> statement-breakpoint
CREATE TYPE "public"."material_source_type" AS ENUM('text', 'pdf');--> statement-breakpoint
CREATE TYPE "public"."material_status" AS ENUM('pending', 'processing', 'completed', 'failed');--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"display_name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subjects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "materials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"subject_id" uuid,
	"title" text NOT NULL,
	"source_type" "material_source_type" NOT NULL,
	"original_filename" text,
	"mime_type" text,
	"status" "material_status" DEFAULT 'pending' NOT NULL,
	"content_hash" text,
	"language" text,
	"page_count" integer,
	"extraction_method" "extraction_method",
	"storage_key" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "material_pages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"material_id" uuid NOT NULL,
	"page_number" integer NOT NULL,
	"image_storage_key" text,
	"raw_text" text,
	"normalized_text" text,
	"extraction_method" "extraction_method",
	"ocr_confidence" double precision,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "material_chunks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"material_id" uuid NOT NULL,
	"page_id" uuid,
	"chunk_index" integer NOT NULL,
	"content" text NOT NULL,
	"token_estimate" integer,
	"start_offset" integer,
	"end_offset" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "subjects" ADD CONSTRAINT "subjects_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "materials" ADD CONSTRAINT "materials_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "materials" ADD CONSTRAINT "materials_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "material_pages" ADD CONSTRAINT "material_pages_material_id_materials_id_fk" FOREIGN KEY ("material_id") REFERENCES "public"."materials"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "material_chunks" ADD CONSTRAINT "material_chunks_material_id_materials_id_fk" FOREIGN KEY ("material_id") REFERENCES "public"."materials"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "material_chunks" ADD CONSTRAINT "material_chunks_page_id_material_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."material_pages"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "subjects_user_id_idx" ON "subjects" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "materials_user_id_idx" ON "materials" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "materials_subject_id_idx" ON "materials" USING btree ("subject_id");--> statement-breakpoint
CREATE INDEX "materials_status_idx" ON "materials" USING btree ("status");--> statement-breakpoint
CREATE INDEX "materials_content_hash_idx" ON "materials" USING btree ("content_hash");--> statement-breakpoint
CREATE UNIQUE INDEX "materials_content_hash_unique_idx" ON "materials" USING btree ("content_hash") WHERE "materials"."content_hash" is not null;--> statement-breakpoint
CREATE INDEX "material_pages_material_id_idx" ON "material_pages" USING btree ("material_id");--> statement-breakpoint
CREATE UNIQUE INDEX "material_pages_material_page_number_idx" ON "material_pages" USING btree ("material_id","page_number");--> statement-breakpoint
CREATE INDEX "material_chunks_material_id_idx" ON "material_chunks" USING btree ("material_id");--> statement-breakpoint
CREATE INDEX "material_chunks_page_id_idx" ON "material_chunks" USING btree ("page_id");--> statement-breakpoint
CREATE UNIQUE INDEX "material_chunks_material_chunk_idx" ON "material_chunks" USING btree ("material_id","chunk_index");