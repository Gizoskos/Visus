# Visual Study Engine

Visual Study Engine is a tablet-first platform for turning academic material into structured, visual, and source-grounded study tools. This repository now includes the Phase 2 database foundation.

## Architecture

The project is a TypeScript modular monolith with independently runnable API, worker, and web processes. PostgreSQL is the source of truth, Redis is reserved for BullMQ infrastructure, and expensive document or AI work will run asynchronously. See [docs/architecture.md](docs/architecture.md) for component responsibilities and current boundaries, and [docs/database.md](docs/database.md) for Phase 2 schema and workflow details.

## Repository structure

```text
apps/
  api/       Fastify HTTP application
  worker/    Background worker process
  web/       Next.js tablet-first web application
packages/
  ai/ embeddings/ extraction/ visual/ study/
  db/ queue/ storage/ shared/
docs/        Architecture documentation
```

`packages/shared` and `packages/db` now contain runtime behavior. The remaining packages are still importable boundaries for later phases.

## Prerequisites

- Node.js 22 or newer
- Corepack
- Docker with Docker Compose

## Local setup

```sh
cp .env.example .env
corepack enable
pnpm install
docker compose up -d
pnpm db:migrate
pnpm db:seed
pnpm dev
```

The web application starts on `http://localhost:3000`, and the API starts on `http://localhost:3001`. Check the API with `curl http://localhost:3001/health` and `curl http://localhost:3001/ready`.

Stop the local services without deleting PostgreSQL data:

```sh
docker compose down
```

## Commands

| Command            | Purpose                                          |
| ------------------ | ------------------------------------------------ |
| `pnpm dev`         | Start API, worker, and web development processes |
| `pnpm build`       | Compile packages and applications                |
| `pnpm db:generate` | Generate Drizzle migration files from schema     |
| `pnpm db:migrate`  | Apply generated SQL migrations                   |
| `pnpm db:push`     | Push schema changes directly for local dev only  |
| `pnpm db:seed`     | Seed a deterministic local development dataset   |
| `pnpm lint`        | Run ESLint and verify formatting                 |
| `pnpm typecheck`   | Type-check the workspace                         |
| `pnpm test`        | Run the Vitest suite                             |

You can also work package-locally when you only care about the database:

```sh
pnpm --filter @visual-study/db db:generate
pnpm --filter @visual-study/db db:push
pnpm --filter @visual-study/db db:migrate
pnpm --filter @visual-study/db db:seed
```

## Current limits

Phase 2 adds the initial PostgreSQL schema, Drizzle repositories, migrations, and a local seed flow. It still does not add pgvector, AI-specific tables, visual artifact tables, flashcards, quizzes, embeddings, recommendations, study sessions, authentication, or storage-provider implementations. API readiness still reports only API process lifecycle.

system architecture

              ┌──────────────┐
              │   Next.js    │
              │   apps/web   │
              └──────┬───────┘
                     │ HTTP
                     ▼
              ┌──────────────┐
              │   Fastify    │
              │   apps/api   │
              └──────┬───────┘
                     │
             ┌───────┴────────┐
             ▼                ▼
        PostgreSQL          BullMQ
                              │
                              ▼
                       ┌──────────────┐
                       │ apps/worker  │
                       └──────┬───────┘
                              │
             ┌────────────────┼─────────────┐
             ▼                ▼             ▼
        extraction           ai         embeddings# Visus

db

users
│
├── subjects
│ │
│ └── materials
│ │
│ ├── material_pages
│ │ │
│ │ └── material_chunks
│ │
│ └── material_chunks
│
└── materials
