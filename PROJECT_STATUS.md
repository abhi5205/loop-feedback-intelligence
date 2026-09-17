# LOOP — AI Customer-Feedback Intelligence Platform
## Project Status Document (Handoff Edition)

**Last Updated:** 2026-09-17  
**Environment:** Local Development — Windows 11, Node.js v24.11.1, npm 11.6.2, Git 2.52.0  
**Build Status:** ✅ `next build` exits 0 — all 21 routes compile cleanly  
**Database Status:** ✅ PostgreSQL 18 local on port 5432, `loop_db` database migrated and seeded  

---

## Current Implementation Phase

**Phase 5 of 15 — Core AI Features COMPLETE**

All foundational work through Phase 5 is done and confirmed building. No uncommitted changes remain in the working tree.

---

## Completed Features (Verified & Committed)

### ✅ Phase 1 — Project Setup
- Next.js 14.2.24 (App Router, TypeScript, Tailwind CSS v3)
- Vitest test harness configured
- `.gitignore` protecting `.env`
- All npm dependencies installed (`node_modules/` present)

### ✅ Phase 2 — Database & Prisma
- Prisma schema: **Workspace**, **User**, **Feedback**, **Theme**, **FeedbackTheme**, **Embedding**, **Report**
- Enums: `Role (ADMIN|ANALYST|VIEWER)`, `Channel`, `Sentiment`, `FeedbackStatus`
- Optimized compound indexes on `workspaceId + createdAt/sentiment/status/channel`
- Initial migration applied: `prisma/migrations/20260917124649_init/`
- Prisma singleton client at `lib/prisma.ts`
- **120+ realistic feedback records seeded** via `prisma/seed.ts`
  - Demo workspace: `acme-corp`
  - Demo users: `admin@acme.com` (ADMIN), `analyst@acme.com` (ANALYST), `viewer@acme.com` (VIEWER)
  - Password for all demo accounts: `password123` (bcrypt hashed)

### ✅ Phase 3 — Authentication (NextAuth v4)
- Credentials provider with bcrypt password verification
- JWT sessions scoped with `workspaceId`, `role`, `userId`
- RBAC middleware at `middleware.ts` (protects `/dashboard`, `/inbox`, `/themes`, `/reports`, `/ask`)
- Route-level role guards via `lib/rbac.ts`
- Session tenant isolation via `lib/tenant.ts`
- Pages: `/login`, `/signup`, `/unauthorized`

### ✅ Phase 4 — Feedback CRUD & Data Ingestion
- REST API: `GET/POST /api/feedback`, `GET/PATCH/DELETE /api/feedback/[id]`
- CSV bulk import: `POST /api/feedback/import-csv` (PapaParse, multi-row, per-row validation)
- Simulated real-time stream: `POST /api/feedback/simulate` (generates 5 random entries)
- Feedback Inbox UI at `/inbox` with search, channel/sentiment filter, pagination, status update
- `CsvUploadModal` and `IngestModal` components

### ✅ Phase 5 — AI Intelligence Engine
- **Claude 3 Haiku classifier** (`lib/ai/classifier.ts`)
  - Classifies sentiment, score, featureArea, themes, rationale
  - Graceful heuristic fallback when `ANTHROPIC_API_KEY` is absent
  - Zod schema validation on AI output
  - `POST /api/feedback/[id]/classify`
- **Embeddings** (`lib/ai/embeddings.ts`)
  - Text-to-vector via Claude's `voyage-02` model (or deterministic TF-IDF fallback)
  - Stored as JSON in `Embedding` table for universal PostgreSQL compatibility
  - Cosine similarity search for RAG retrieval
- **Ask LOOP RAG** (`lib/ai/rag.ts`)
  - Vector search → Claude Haiku grounded synthesis
  - Citations from retrieved feedback items
  - Deterministic grounded answer fallback when no API key
  - `POST /api/ask`
  - UI at `/ask`
- **VoC Report Generation** (`lib/ai/voc.ts`)
  - `POST /api/reports` generates full report with date range, sentiment distribution, top themes, key takeaways, AI recommendations
  - `GET /api/reports`, `GET/DELETE /api/reports/[id]`
  - Reports UI at `/reports`
- **Themes Intelligence** (`GET /api/themes`)
  - Theme CRUD scoped per workspace
  - UI at `/themes`
- **Analytics Overview** (`GET /api/analytics/overview`)
  - Total feedback count, sentiment breakdown, weekly delta, daily volume time series, top themes
- **Dashboard** (`/dashboard`)
  - Recharts: AreaChart (volume over time), PieChart (sentiment donut), BarChart (top themes)
  - 4 KPI stat cards

---

## Features Currently In Progress / Next Steps

These phases are **planned but NOT yet implemented:**

### 🔲 Phase 6 — Polling / Real-Time Updates
- Server-Sent Events (SSE) or WebSocket for live feedback stream on dashboard
- Auto-refresh inbox when simulate endpoint fires

### 🔲 Phase 7 — Advanced Filtering & Search
- Full-text search on feedback content (PostgreSQL `pg_trgm` or `to_tsvector`)
- Multi-filter combination (sentiment + channel + theme + date range)
- Saved filter presets per user

### 🔲 Phase 8 — Multi-Workspace Admin Panel
- Create/manage workspaces (super-admin role)
- Invite users via email token
- Workspace settings page

### 🔲 Phase 9 — Notification & Alerting
- Threshold alerts (e.g. negative ratio > 30% triggers alert)
- Email notification via Resend or Nodemailer
- Alert configuration per workspace

### 🔲 Phase 10 — Export & Integrations
- Export feedback to PDF report
- Slack webhook integration
- Zapier/n8n compatible webhook output

### 🔲 Phase 11 — Enhanced VoC Reports
- Scheduled reports (weekly digest)
- Compare two time periods
- Executive summary PDF download

### 🔲 Phase 12 — Unit & Integration Tests
- Vitest tests for AI classifier (heuristic path)
- API route integration tests with test database
- Playwright E2E for auth flow

### 🔲 Phase 13 — CI/CD Pipeline
- GitHub Actions workflow for lint + type-check + test on push
- Auto-deploy to Vercel or Railway on main branch merge

### 🔲 Phase 14 — Production Deployment
- Deploy to Vercel (frontend + API routes)
- PostgreSQL on Neon (serverless) or Railway
- Seed production database with demo data

### 🔲 Phase 15 — Final Polish & Evaluation Prep
- Onboarding walkthrough modal for new users
- Demo mode (read-only guest access)
- Final README with screenshots
- Evaluation presentation deck

---

## Known Bugs / Issues

| # | Description | Severity | Status |
|---|-------------|----------|--------|
| 1 | `ANTHROPIC_API_KEY` is placeholder in `.env` — AI runs heuristic fallback | Medium | Expected — needs real key |
| 2 | Embeddings stored as JSON text (not pgvector) — cosine similarity computed in JS | Low | Works, less scalable at 10k+ records |
| 3 | No email verification on signup — any email accepted | Low | Demo only |
| 4 | `/api/feedback/simulate` uses `Math.random()` — not reproducible | Low | By design |

---

## Database Setup

### Local PostgreSQL 18

```
Host:     localhost
Port:     5432
Database: loop_db
User:     postgres
Password: (stored only in local .env — never committed)
```

### Schema Summary
- **workspaces** — tenant isolation root
- **users** — bcrypt passwords, RBAC roles, workspace-scoped
- **feedbacks** — core data; sentiment, channel, feature area, AI rationale
- **themes** — tag taxonomy per workspace
- **feedback_themes** — many-to-many join
- **embeddings** — vector JSON for RAG search
- **reports** — persisted VoC reports

### Migration & Seed Commands
```bash
# Apply migrations (already applied)
npx prisma migrate deploy

# Re-generate Prisma Client after schema changes
npx prisma generate

# Re-seed (WARNING: adds duplicate records if run again — use with care)
npm run db:seed
```

---

## Required Environment Variables

Copy `.env.example` to `.env` and fill in real values:

```env
# PostgreSQL — local or Neon
DATABASE_URL="postgresql://postgres:<PASSWORD>@localhost:5432/loop_db?schema=public"

# NextAuth — required
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="<random 32+ char string>"

# Anthropic Claude — optional (heuristic fallback if missing)
ANTHROPIC_API_KEY="sk-ant-..."
```

---

## Commands to Run the Project

```bash
# 1. Install dependencies (already done if node_modules/ exists)
npm install

# 2. Generate Prisma client
npx prisma generate

# 3. Apply migrations to local DB
npx prisma migrate deploy

# 4. Seed database (skip if already seeded)
npm run db:seed

# 5. Start development server
npm run dev
# → http://localhost:3000

# 6. Build for production (verify no TS errors)
npm run build

# 7. Run tests
npm test
```

---

## Demo Login Credentials (after seed)

| Email | Password | Role |
|-------|----------|------|
| admin@acme.com | password123 | ADMIN |
| analyst@acme.com | password123 | ANALYST |
| viewer@acme.com | password123 | VIEWER |

---

## Current Deployment Status

- **Local:** Fully functional (dev server + production build both pass)
- **Remote:** Not yet deployed — GitHub repository not yet configured with remote
- **CI/CD:** Not yet configured

---

## Key File Map

```
c:\Users\bhush\OneDrive\Desktop\zidio\
├── app/
│   ├── layout.tsx                  Root layout + SessionProvider
│   ├── page.tsx                    Landing / redirect to dashboard
│   ├── globals.css                 Tailwind base + custom utilities
│   ├── login/page.tsx              Login form
│   ├── signup/page.tsx             Signup form
│   ├── dashboard/page.tsx          KPI cards + Recharts dashboard
│   ├── inbox/page.tsx              Feedback list + CRUD + CSV import
│   ├── themes/page.tsx             Theme management UI
│   ├── ask/page.tsx                Ask LOOP RAG chat UI
│   ├── reports/page.tsx            VoC report generator + history
│   ├── unauthorized/page.tsx       403 error page
│   └── api/
│       ├── health/route.ts         GET /api/health
│       ├── auth/[...nextauth]/     NextAuth handler
│       ├── auth/signup/            POST /api/auth/signup
│       ├── feedback/               GET/POST feedback
│       ├── feedback/[id]/          GET/PATCH/DELETE single feedback
│       ├── feedback/[id]/classify/ POST → Claude AI classify
│       ├── feedback/import-csv/    POST bulk CSV import
│       ├── feedback/simulate/      POST generate random entries
│       ├── analytics/overview/     GET dashboard analytics
│       ├── themes/                 GET/POST themes
│       ├── ask/                    POST Ask LOOP RAG
│       └── reports/                GET/POST VoC reports
│           └── [id]/               GET/DELETE single report
├── components/
│   ├── AppShell.tsx                Nav + sidebar layout shell
│   ├── Providers.tsx               SessionProvider wrapper
│   ├── CsvUploadModal.tsx          CSV upload modal UI
│   └── IngestModal.tsx             Manual feedback entry modal
├── lib/
│   ├── prisma.ts                   Prisma singleton client
│   ├── auth.ts                     NextAuth config + JWT callbacks
│   ├── rbac.ts                     Role-based access guards
│   ├── tenant.ts                   Session → workspaceId extraction
│   ├── utils.ts                    Shared utilities
│   └── ai/
│       ├── classifier.ts           Claude Haiku sentiment classifier
│       ├── embeddings.ts           Text → vector + cosine search
│       ├── rag.ts                  Ask LOOP RAG engine
│       └── voc.ts                  VoC report generator
├── prisma/
│   ├── schema.prisma               Full multi-tenant schema
│   ├── seed.ts                     120+ record realistic seed
│   └── migrations/                 Applied PostgreSQL migrations
├── types/                          Shared TypeScript types
├── middleware.ts                   Route protection (NextAuth)
├── .env                            Local secrets (NOT committed)
├── .env.example                    Template (safe to commit)
└── .gitignore                      Protects .env and node_modules
```
