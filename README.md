# Visual Study Engine

Visual Study Engine is a tablet-first platform for turning academic material into structured, visual, and source-grounded study tools. This repository currently contains the Phase 1 application foundation only.

## Architecture

The project is a TypeScript modular monolith with independently runnable API, worker, and web processes. PostgreSQL is the planned source of truth, Redis is reserved for BullMQ infrastructure, and expensive document or AI work will run asynchronously. See [docs/architecture.md](docs/architecture.md) for component responsibilities and current boundaries.

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

Only `packages/shared` contains runtime behavior in Phase 1. The other packages are importable boundaries for work scheduled in later phases.

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
pnpm dev
```

The web application starts on `http://localhost:3000`, and the API starts on `http://localhost:3001`. Check the API with `curl http://localhost:3001/health` and `curl http://localhost:3001/ready`.

Stop the local services without deleting PostgreSQL data:

```sh
docker compose down
```

## Commands

| Command          | Purpose                                          |
| ---------------- | ------------------------------------------------ |
| `pnpm dev`       | Start API, worker, and web development processes |
| `pnpm build`     | Compile packages and applications                |
| `pnpm lint`      | Run ESLint and verify formatting                 |
| `pnpm typecheck` | Type-check the workspace                         |
| `pnpm test`      | Run the Vitest suite                             |

## Current limits

Phase 1 does not contain database schemas or clients, queues, AI workflows, document extraction, embeddings, storage providers, authentication, or offline service-worker behavior. PostgreSQL and Redis are available locally, but API readiness intentionally reports only the API process lifecycle. Database and Drizzle schema work is the next phase.

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
  │      │
  │      └── materials
  │             │
  │             ├── material_pages
  │             │       │
  │             │       └── material_chunks
  │             │
  │             └── material_chunks
  │
  └── materials