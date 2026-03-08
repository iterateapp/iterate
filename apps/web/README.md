# `apps/web`

Next.js 16 dashboard for the Iterate platform.

## Stack

- **Next.js 16.1** with App Router + Turbopack
- **React 19.2** with Server Components
- **Tailwind CSS v4** + shadcn/ui (Base UI)
- **TypeScript 5**

## Pages

| Route | Step | Description |
|-------|------|-------------|
| `/` | — | Landing / redirect |
| `/data` | 1. Data | Metrics, events, funnels, interviews, NPS |
| `/analysis` | 2. Analysis | AI-powered insight explorer with interactive chat |
| `/development` | 3. Development | Feature tracker, PR status, task breakdown |
| `/results` | 4. Results | A/B experiments, KPI tracking, feedback loop |
| `/data-sources` | — | Integration management (Amplitude, Zendesk, etc.) |

## Development

```bash
# From monorepo root
make dev-web

# Or directly
pnpm --filter web dev
```

Runs on [http://localhost:3000](http://localhost:3000).

## API Routes

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/ai/chat` | POST | AI chat with SSE streaming support |

## Key Directories

```
app/
├── api/ai/chat/       # AI chat endpoint
├── analysis/          # Step 2 — AI insight analysis + chat
├── data/              # Step 1 — Data dashboard
├── data-sources/      # Integration settings
├── development/       # Step 3 — Feature & PR tracker
├── results/           # Step 4 — Experiment results
└── layout.tsx         # Root layout with header + sidebar
components/
├── dashboard/         # Iteration loop, header, shared dashboard UI
└── ui/                # shadcn/ui primitives
lib/
├── mock-data.ts       # Demo data (ahoda hotel booking scenario)
└── utils.ts           # Utilities (cn, etc.)
```

## Dependencies

- `@iterate/ai` — AI provider abstraction (workspace package)
- `@iterate/database` — Prisma database client (workspace package)
