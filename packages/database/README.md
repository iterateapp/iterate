# `@iterate/database`

Prisma ORM package for the Iterate platform. Provides the database schema and generated client shared across all apps.

## Setup

```bash
# From monorepo root
make db-up         # Start PostgreSQL
make db-push       # Push schema to database
make db-studio     # Open Prisma Studio
```

## Commands

```bash
pnpm --filter @iterate/database db:generate   # Generate Prisma client
pnpm --filter @iterate/database db:migrate    # Run migrations
pnpm --filter @iterate/database db:push       # Push schema (dev)
pnpm --filter @iterate/database db:studio     # Open Studio GUI
```

## Usage

```typescript
import { prisma } from "@iterate/database"

const insights = await prisma.insight.findMany({
  where: { status: "detected" },
  orderBy: { createdAt: "desc" },
})
```

## Environment Variables

```bash
DATABASE_URL="postgresql://iterate:iterate@localhost:5432/iterate_dev"
```
