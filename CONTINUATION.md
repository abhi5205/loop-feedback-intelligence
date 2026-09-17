# LOOP — Continuation Guide for Next Developer / Environment

> **Read this first.** This document tells you exactly where we stopped, how to get running, and what to build next.

---

## TL;DR — What Is Done

LOOP is a fully working Next.js 14 full-stack AI customer feedback platform. As of the last commit:

- ✅ Database schema designed, migrated, and seeded (120+ records)
- ✅ Authentication (NextAuth v4) with JWT + RBAC (3 roles)
- ✅ Full feedback CRUD + CSV bulk import + simulated stream
- ✅ Claude AI classifier with graceful heuristic fallback
- ✅ RAG-based "Ask LOOP" question-answering system
- ✅ VoC report generation engine
- ✅ Analytics dashboard (Recharts area/pie/bar charts)
- ✅ `next build` passes with exit code 0 (21 routes)

---

## Environment Requirements

| Tool | Version | Notes |
|------|---------|-------|
| Node.js | v18+ (v24 confirmed working) | |
| npm | v9+ | |
| PostgreSQL | 14+ (v18 confirmed) | Must be running on port 5432 |
| Git | any | |

---

## Getting Started (New Machine)

```bash
# 1. Clone the repo
git clone <your-repo-url> loop
cd loop

# 2. Install dependencies
npm install

# 3. Create your .env file (copy template, fill password)
copy .env.example .env
# Edit .env and set DATABASE_URL with real postgres password

# 4. Generate Prisma client
npx prisma generate

# 5. Create the database (if not exists)
# Connect to psql and run:
#   CREATE DATABASE loop_db;

# 6. Apply migrations
npx prisma migrate deploy

# 7. Seed the database
npm run db:seed

# 8. Start dev server
npm run dev
# → http://localhost:3000
```

---

## Environment Variables (.env)

```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/loop_db?schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="any-random-32-char-string"
ANTHROPIC_API_KEY="sk-ant-..."   # Optional — heuristic fallback works without it
```

> **For production:** Replace `localhost:5432` with your Neon/Railway/Supabase connection string.

---

## Demo Login Credentials

After seeding, these accounts exist in workspace `acme-corp`:

| Email | Password | Role |
|-------|----------|------|
| admin@acme.com | password123 | ADMIN |
| analyst@acme.com | password123 | ANALYST |
| viewer@acme.com | password123 | VIEWER |

---

## Architecture Overview

```
Next.js 14 App Router
├── Client pages (React Server Components + Client Components)
├── API Routes (Edge-compatible route handlers)
├── NextAuth v4 (JWT, Credentials provider)
├── Prisma ORM → PostgreSQL 18
└── AI Layer (Anthropic Claude SDK with fallbacks)
```

**Multi-tenancy:** Every database query is scoped by `workspaceId` extracted from the JWT session. Users only see data from their own workspace.

**AI fallbacks:** The app works fully without an Anthropic API key — classification uses keyword heuristics, embeddings use TF-IDF, RAG uses deterministic grounded synthesis.

---

## What to Build Next (Priority Order)

### Priority 1 — Tests (Needed for Evaluation)
Create `tests/` files using Vitest:

```bash
# Already configured — just write test files:
# tests/classifier.test.ts
# tests/rbac.test.ts
# tests/api.test.ts (uses fetch mock or test DB)
npm test
```

Key things to test:
- `classifyFeedback()` heuristic path (no API key needed)
- RBAC `requireRole()` guard function
- `searchRelevantFeedback()` cosine similarity

### Priority 2 — GitHub Actions CI
Create `.github/workflows/ci.yml`:
```yaml
on: [push, pull_request]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: npx prisma generate
      - run: npm run build
      - run: npm test
```

### Priority 3 — Production Deployment
1. Create a [Neon](https://neon.tech) PostgreSQL database (free tier)
2. Set `DATABASE_URL` in Vercel environment variables
3. Connect GitHub repo to [Vercel](https://vercel.com) — auto-deploy on push
4. Run `npx prisma migrate deploy` in Vercel build command
5. Add seed step in post-build or run manually via Neon console

### Priority 4 — Real-Time Updates (SSE)
Add Server-Sent Events to `/api/feedback/stream` route:
```typescript
// app/api/feedback/stream/route.ts
export async function GET() {
  const stream = new ReadableStream({ ... });
  return new Response(stream, {
    headers: { 'Content-Type': 'text/event-stream' }
  });
}
```

### Priority 5 — PDF Export
Use `@react-pdf/renderer` or `puppeteer` to export VoC reports:
```bash
npm install @react-pdf/renderer
```

---

## Key Technical Decisions (Explain These in Evaluation)

| Decision | Why |
|----------|-----|
| Next.js App Router | Colocated API routes, Server Components, file-based routing — single repo |
| Prisma over raw SQL | Type-safe queries, migration history, easy schema iteration |
| JWT (not database sessions) | Stateless, scales to serverless; workspaceId baked into token |
| JSON embeddings (not pgvector) | Works on any PostgreSQL without extensions; acceptable for < 5k records |
| Claude Haiku (not GPT-4) | Cheaper per-token for classification; Haiku is fast enough |
| Heuristic fallback | Demo works without spending API credits — evaluator can run without key |
| Recharts (not Chart.js) | React-native, tree-shakeable, customizable with dark theme |

---

## File Map Quick Reference

```
app/                     → Pages + API routes
  api/analytics/         → Dashboard stats
  api/ask/               → RAG question answering
  api/auth/              → NextAuth + signup
  api/feedback/          → CRUD + CSV + simulate + classify
  api/reports/           → VoC report CRUD
  api/themes/            → Theme management
  dashboard/             → Analytics dashboard UI
  inbox/                 → Feedback inbox UI
  ask/                   → Ask LOOP chat UI
  reports/               → Reports UI
  themes/                → Themes UI
  login/ signup/         → Auth pages

components/              → Shared React components
  AppShell.tsx           → Nav sidebar layout
  CsvUploadModal.tsx     → CSV bulk import UI
  IngestModal.tsx        → Manual feedback entry
  Providers.tsx          → SessionProvider

lib/
  prisma.ts              → DB client singleton
  auth.ts                → NextAuth config
  rbac.ts                → Role guards
  tenant.ts              → workspaceId from session
  ai/
    classifier.ts        → Sentiment + feature classification
    embeddings.ts        → Vector search
    rag.ts               → Ask LOOP grounded QA
    voc.ts               → VoC report generation

prisma/
  schema.prisma          → Full DB schema
  seed.ts                → 120+ record seeder
  migrations/            → Applied migration SQL
```

---

## Commit History

```
d2cc0af  feat: complete feedback CRUD, CSV bulk import, simulated stream,
         Recharts dashboard, Claude AI classification, themes intelligence,
         Ask LOOP RAG, and VoC reports
f0b80b2  feat: generate and apply initial PostgreSQL migration for multi-tenant schema
7bfd253  feat: implement NextAuth credentials auth, JWT session scoping, RBAC
         guards, 401/403 handlers, and UI pages
b189f20  feat: design multi-tenant Prisma schema, singleton client, and 120+
         item realistic seed engine
a932e0e  feat: initialize Next.js 14 App Router project, Tailwind CSS,
         TypeScript, and testing harness
```

---

## Evaluation Talking Points

If you need to defend this project in a live evaluation, here's what to highlight:

1. **Multi-tenancy**: Every query filters by `workspaceId` — show in any API route
2. **RBAC**: Show `lib/rbac.ts` and how ADMIN/ANALYST/VIEWER routes are guarded
3. **AI pipeline**: classifier → embeddings → RAG (show `lib/ai/` folder)
4. **Graceful degradation**: Remove API key → heuristic fallback → still works
5. **Migration history**: `prisma/migrations/` shows schema evolution
6. **Build passes**: Run `npm run build` live to demonstrate no TypeScript errors

---

*Generated by Antigravity IDE — LOOP v1.0 Phase 5 complete*
