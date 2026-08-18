# Architecture

## Overview

Visual Study Engine is a TypeScript modular monolith with a dedicated background worker. The API accepts short-lived requests, PostgreSQL will remain the source of truth, and expensive OCR, AI, embedding, and document work will run outside HTTP request lifecycles. Generated material will retain source page or chunk references whenever practical.

Phase 2 adds the database foundation while still avoiding speculative application services and infrastructure wrappers.

## Components

### API

The Fastify API owns HTTP transport, request validation, and application orchestration. It currently exposes process-level health and readiness endpoints. Future ingestion endpoints will enqueue work rather than wait for document processing.

### Worker

The Node.js worker is the execution boundary for future BullMQ jobs. Its current runtime proves startup and graceful signal-driven shutdown without pretending that queues already exist.

### Web

The Next.js application is the tablet-first reading and visual-learning interface. The frontend will render semantic visual structures supplied by the backend; models will not generate arbitrary executable HTML or SVG.

### Database

PostgreSQL now holds the foundational ownership and ingestion records for users, subjects, materials, pages, and chunks. Drizzle is the default access layer for CRUD, relations, migrations, transactions, and typed repositories. The local PostgreSQL image already includes pgvector support, but pgvector and similarity-search tables remain deferred.

### Redis and BullMQ

Redis will provide BullMQ's queue infrastructure, retries, and job coordination. PostgreSQL remains authoritative; Redis is not domain storage. Queue connections and job definitions are deferred until a real job is introduced.

### AI

`packages/ai` will contain bounded LangGraph.js workflows and Zod-validated model outputs. Provider integrations will sit behind interfaces when the first provider is implemented.

### Extraction

`packages/extraction` will normalize digital PDFs, scanned PDFs, handwritten exports, and text into traceable document chunks. OCR and parsing are asynchronous concerns.

### Visual

`packages/visual` will define semantic diagrams, concept maps, formula cards, and other visual structures. Rendering belongs to the web application.

### Study

`packages/study` will own study notes, flashcards, quizzes, recall exercises, and adaptive review behavior independently of HTTP and queue frameworks.

### Storage

`packages/storage` will own original and derived object persistence. An object-storage interface and Oracle Object Storage implementation will be introduced together when storage behavior is required.

### Shared

`packages/shared` contains the small cross-process foundation used today: validated environment configuration, logging, and project identity. It is not a catch-all for domain logic.

## Runtime flow

Each application validates its environment and initializes logging at startup. Fastify marks itself ready after its own startup hooks complete. The worker waits on an abort signal and shuts down cleanly on SIGINT or SIGTERM. `packages/db` centralizes PostgreSQL connections, migrations, schema, repositories, and deterministic seed data without coupling that behavior to Fastify or the worker.

## Database flow

Document ownership is anchored on `users`, grouped optionally by `subjects`, and stored in `materials`. Extracted page-level data lives in `material_pages`, and chunk-level data lives in `material_chunks`. Deletes are intentionally conservative at ownership boundaries: deleting a subject detaches materials instead of destroying them, and deleting a user is restricted while owned academic data exists.
