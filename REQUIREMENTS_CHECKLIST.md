# LOOP — Requirements Traceability & Evaluation Checklist

This checklist tracks every core requirement from the internship brief to ensure 100% testable, defendable coverage for the final evaluation.

## Legend
- ⏳ **Pending**: Scheduled for corresponding phase
- 🟡 **In Progress**: Active implementation
- ✅ **Verified**: Implemented, tested, and code-referenced

---

## 1. Multi-Tenancy & Workspace Isolation (Mandatory)
| Requirement | Status | Code Location | Test / Verification Method |
| :--- | :--- | :--- | :--- |
| Workspace model scoping all tenant records | ⏳ Pending (Phase 2) | `prisma/schema.prisma` | Schema inspection & migration |
| User scoped to Workspace | ⏳ Pending (Phase 2) | `prisma/schema.prisma` | DB relation check |
| Feedback scoped to Workspace | ⏳ Pending (Phase 2) | `prisma/schema.prisma` | Foreign key checks |
| Theme scoped to Workspace | ⏳ Pending (Phase 2) | `prisma/schema.prisma` | Foreign key checks |
| Report scoped to Workspace | ⏳ Pending (Phase 2) | `prisma/schema.prisma` | Foreign key checks |
| Embedding scoped to Workspace | ⏳ Pending (Phase 2) | `prisma/schema.prisma` | Foreign key checks |
| Server-side workspace isolation on all queries | ⏳ Pending (Phase 4) | `lib/tenant.ts`, API routes | Vitest: Tenant A cannot query Tenant B ID |
| No relying on frontend hiding for tenant isolation | ⏳ Pending (Phase 4) | API handlers | Direct API curl with mismatched tenant ID |

---

## 2. Authentication & RBAC
| Requirement | Status | Code Location | Test / Verification Method |
| :--- | :--- | :--- | :--- |
| Signup creates Workspace + ADMIN User | ⏳ Pending (Phase 3) | `app/api/auth/signup/route.ts` | Unit/integration test signup flow |
| Secure login / logout with persistent sessions | ⏳ Pending (Phase 3) | `lib/auth.ts`, NextAuth handlers | Session cookie inspection |
| Password hashing (bcrypt) | ⏳ Pending (Phase 3) | `lib/auth.ts` | Passwords never stored in plaintext |
| Protected routes via middleware | ⏳ Pending (Phase 3) | `middleware.ts` | Unauthenticated redirect to /login |
| 3 Roles: ADMIN, ANALYST, VIEWER | ⏳ Pending (Phase 4) | `prisma/schema.prisma` | Role enum in schema |
| Server-side authorization guards (401 & 403) | ⏳ Pending (Phase 4) | `lib/rbac.ts` | Attempting mutation as VIEWER returns 403 |
| Dedicated 403 and 404 error pages | ⏳ Pending (Phase 4) | `app/unauthorized/page.tsx`, `app/not-found.tsx` | Visual check and route tests |

---

## 3. Database & Seeding
| Requirement | Status | Code Location | Test / Verification Method |
| :--- | :--- | :--- | :--- |
| Models: Workspace, User, Feedback, Theme, FeedbackTheme, Embedding, Report | ⏳ Pending (Phase 2) | `prisma/schema.prisma` | Prisma generate / push |
| Proper foreign keys, indexes, timestamps, enums | ⏳ Pending (Phase 2) | `prisma/schema.prisma` | Schema lint & DB constraints |
| Seed script generates 1 Demo Workspace | ⏳ Pending (Phase 2) | `prisma/seed.ts` | `npx prisma db seed` |
| Seed script generates 3 Users (ADMIN, ANALYST, VIEWER) | ⏳ Pending (Phase 2) | `prisma/seed.ts` | DB query / login verification |
| Seed script generates 120+ realistic feedback items | ⏳ Pending (Phase 2) | `prisma/seed.ts` | DB count > 120 |
| Multiple channels, sentiments, themes, dates | ⏳ Pending (Phase 2) | `prisma/seed.ts` | Distribution query check |

---

## 4. Ingestion & Feedback Inbox
| Requirement | Status | Code Location | Test / Verification Method |
| :--- | :--- | :--- | :--- |
| Single feedback submission with Zod validation | ⏳ Pending (Phase 5) | `app/api/feedback/route.ts` | Invalid payload returns 400 with details |
| CSV bulk upload with partial failure handling | ⏳ Pending (Phase 6) | `app/api/feedback/import-csv/route.ts` | Upload CSV with 1 broken row; others succeed |
| CSV import returns success count, failure count & errors | ⏳ Pending (Phase 6) | `app/api/feedback/import-csv/route.ts` | API JSON response inspection |
| Simulated feedback generator / channel | ⏳ Pending (Phase 6) | `app/api/feedback/simulate/route.ts` | Trigger simulation; new records appear |
| Inbox server-side pagination | ⏳ Pending (Phase 7) | `app/inbox/page.tsx`, API | Query param `page=2&limit=10` |
| Inbox filters: channel, sentiment, theme, status, date range | ⏳ Pending (Phase 7) | Inbox components | Combined filter queries |
| Search across feedback content | ⏳ Pending (Phase 7) | Inbox search bar | Full text / substring match query |
| Inline status update (NEW -> REVIEWED -> ACTIONED) | ⏳ Pending (Phase 7) | Inbox item actions | PATCH status and DB state update |

---

## 5. Analytics Dashboard
| Requirement | Status | Code Location | Test / Verification Method |
| :--- | :--- | :--- | :--- |
| Real database-backed calculations (no hardcoding) | ⏳ Pending (Phase 8) | `app/api/analytics/overview/route.ts` | Dynamic aggregation from Prisma |
| Stat cards: Total feedback, % negative, new this week | ⏳ Pending (Phase 8) | Dashboard component | Compare card value to direct SQL count |
| Chart 1: Feedback volume over time (Recharts) | ⏳ Pending (Phase 8) | `components/dashboard/VolumeChart.tsx` | Visual rendering & data match |
| Chart 2: Sentiment breakdown (Recharts) | ⏳ Pending (Phase 8) | `components/dashboard/SentimentChart.tsx` | Visual rendering & data match |
| Chart 3: Top themes breakdown (Recharts) | ⏳ Pending (Phase 8) | `components/dashboard/ThemesChart.tsx` | Visual rendering & data match |
| Polished Loading, Empty, and Error states | ⏳ Pending (Phase 8) | UI components | Simulating empty tenant & loading skeleton |

---

## 6. AI Feature 1 — Claude Auto-Classification
| Requirement | Status | Code Location | Test / Verification Method |
| :--- | :--- | :--- | :--- |
| Server-side Anthropic Claude invocation (key hidden) | ⏳ Pending (Phase 9) | `lib/ai/classifier.ts` | Browser network tab check: no API keys |
| Structured classification: sentiment, score, themes, rationale | ⏳ Pending (Phase 9) | `lib/ai/classifier.ts` | Zod schema validation of LLM output |
| Persisted to PostgreSQL (no recomputation on page load) | ⏳ Pending (Phase 9) | DB records | Inspect stored columns |
| Manual "Re-classify" action | ⏳ Pending (Phase 9) | Inbox UI / API | Re-classify button updates record |
| Fallback & retry handling for malformed LLM responses | ⏳ Pending (Phase 9) | `lib/ai/classifier.ts` | Mock invalid response test; marked for review |

---

## 7. AI Feature 2 — Themes & Trends Intelligence
| Requirement | Status | Code Location | Test / Verification Method |
| :--- | :--- | :--- | :--- |
| Theme list with counts, descriptions, feedback drill-down | ⏳ Pending (Phase 10) | `app/themes/page.tsx` | Clicking theme shows associated feedback |
| Volume trends & period comparisons (growth / spike detection) | ⏳ Pending (Phase 10) | `lib/analytics/trends.ts` | Formula test comparing previous vs current period |
| Real database calculations (no invented numbers) | ⏳ Pending (Phase 10) | API routes | Verified against raw counts |

---

## 8. AI Feature 3 — Ask LOOP (RAG System)
| Requirement | Status | Code Location | Test / Verification Method |
| :--- | :--- | :--- | :--- |
| Embeddings generation & storage | ⏳ Pending (Phase 11) | `lib/ai/embeddings.ts` | Embedding vector saved in DB |
| Workspace-scoped vector/semantic similarity search | ⏳ Pending (Phase 11) | `lib/ai/rag.ts` | Vector search returns only tenant feedback |
| Context assembly with top-K relevant feedback | ⏳ Pending (Phase 11) | `lib/ai/rag.ts` | Context prompt inspection |
| Claude generates grounded answer with citation IDs | ⏳ Pending (Phase 11) | `app/ask/page.tsx` | Output includes feedback references |
| Insufficient evidence handling (refuses to hallucinate) | ⏳ Pending (Phase 11) | `lib/ai/rag.ts` | Prompt query about unrelated topic returns warning |

---

## 9. AI Feature 4 — Voice-of-Customer (VoC) Reports
| Requirement | Status | Code Location | Test / Verification Method |
| :--- | :--- | :--- | :--- |
| User selects date range | ⏳ Pending (Phase 12) | `app/reports/page.tsx` | Date picker component |
| SQL statistics computed first (volume, sentiment, themes) | ⏳ Pending (Phase 12) | `lib/reports/metrics.ts` | Grounded stats payload to Claude |
| Claude generates narrative strictly adhering to stats | ⏳ Pending (Phase 12) | `lib/ai/voc.ts` | Compare report narrative to stats input |
| Report saved to DB with history list & export view | ⏳ Pending (Phase 12) | Report viewer & download | Re-opening past report from DB |

---

## 10. Security & Hardening
| Requirement | Status | Code Location | Test / Verification Method |
| :--- | :--- | :--- | :--- |
| Environment variables in `.env` (never committed) | ⏳ Pending (Phase 1) | `.gitignore`, `.env.example` | Git status check |
| Test: Unauthenticated API access -> 401 | ⏳ Pending (Phase 13) | `tests/security.test.ts` | Automated test suite |
| Test: Viewer role mutation attempt -> 403 | ⏳ Pending (Phase 13) | `tests/security.test.ts` | Automated test suite |
| Test: Cross-tenant data tampering -> 404 / 403 | ⏳ Pending (Phase 13) | `tests/security.test.ts` | Automated test suite |
| Secure headers & input sanitization | ⏳ Pending (Phase 13) | `next.config.ts`, Zod | Automated & manual checks |

---

## 11. Production Deployment & Deliverables
| Requirement | Status | Code Location | Test / Verification Method |
| :--- | :--- | :--- | :--- |
| Hosted PostgreSQL (Neon / Supabase / Vercel Postgres) | ⏳ Pending (Phase 14) | Remote DB connection | DB ping & migration |
| Vercel live deployment with public URL | ⏳ Pending (Phase 14) | Vercel production build | Live smoke test |
| Comprehensive README with architecture diagrams & instructions | ⏳ Pending (Phase 15) | `README.md` | Full review |
| Final evaluation video guide & submission artifacts | ⏳ Pending (Phase 15) | Docs / script guide | Review links & materials |
