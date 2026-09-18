# LOOP — AI Customer-Feedback Intelligence Platform

[![CI Pipeline](https://github.com/abhi5205/loop-feedback-intelligence/actions/workflows/ci.yml/badge.svg)](https://github.com/abhi5205/loop-feedback-intelligence/actions)
[![Next.js](https://img.shields.io/badge/Next.js-14.2_App_Router-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7_Strict-blue?logo=typescript)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-18-blue?logo=postgresql)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.22-darkblue?logo=prisma)](https://www.prisma.io/)
[![Anthropic Claude](https://img.shields.io/badge/AI-Claude_SDK-violet)](https://www.anthropic.com/)

---

## 🚀 Overview

**LOOP** is an enterprise-grade, multi-tenant AI customer-feedback intelligence platform built as a single-handed internship project. It unifies fragmented customer feedback signals—from App Store reviews, support emails, chat tickets, and NPS surveys—into an actionable product intelligence engine powered by Claude AI and Retrieval-Augmented Generation (RAG).

---

## ✨ Key Features

### 🏢 1. Multi-Tenancy & Role-Based Access Control (RBAC)
- **Strict Server-Side Isolation**: All API routes and queries filter strictly by `workspaceId`.
- **Granular Roles**:
  - `ADMIN`: Full workspace management, member role updates, and feedback operations.
  - `ANALYST`: Ingest, re-classify feedback, create themes, and generate VoC reports.
  - `VIEWER`: Read-only access to dashboards, inbox, and reports.

### 🤖 2. Claude AI Auto-Classification Engine
- **Structured Schema Validation**: Validated using Zod schemas for guaranteed type safety.
- **Sentiment Scoring**: Scores sentiment from `-10` (Extremely Negative) to `+10` (Extremely Positive).
- **Categorization**: Auto-assigns Feature Area (e.g., `Analytics`, `Billing`, `UI/UX`, `Performance`) and extracts emergent customer themes.
- **Graceful Fallbacks**: Heuristic fallback engine ensures continuous functionality even if AI API keys are unconfigured.

### 🔍 3. Ask LOOP (RAG Engine)
- **Semantic Search**: Vector similarity matching over feedback embeddings.
- **Grounded Responses**: Answers product questions strictly using customer feedback context.
- **Citation System**: Provides exact source feedback citations (Customer Name, Channel, Score) to prevent hallucination.

### ⚡ 4. Real-Time Stream & Bulk Ingestion
- **Server-Sent Events (SSE)**: Live streaming feed updates to connected client inboxes without manual refresh.
- **Bulk CSV Upload**: Fault-tolerant CSV parser (`PapaParse`) with row-level validation and error reporting.
- **Stream Simulator**: Built-in signal simulator to test real-time feedback flows.

### 📊 5. Dynamic Analytics & VoC Reports
- **Overview Dashboard**: Real-time KPI summary cards, sentiment distribution charts, channel breakdowns, and spike detection.
- **Voice of Customer (VoC) Reports**: Deterministic analytics paired with AI executive summaries, key friction points, and recommendations.

---

## 🛠️ Technology Stack

- **Framework**: Next.js 14 (App Router, Server Actions & API Routes)
- **Language**: TypeScript 5.7 (Strict Mode enabled)
- **Styling**: Tailwind CSS & Lucide Icons
- **Database & ORM**: PostgreSQL 18 with Prisma ORM 5.22
- **Authentication**: NextAuth.js v4 (JWT session strategy, bcryptjs password hashing)
- **AI Integration**: Anthropic Claude SDK (`@anthropic-ai/sdk`)
- **Testing**: Vitest with unit & security suite
- **CI/CD**: GitHub Actions workflow

---

## 🗝️ Evaluation Demo Accounts

Pre-populated in the seed script (`npm run db:seed`):

| Role | Email | Password | Access Rights |
| :--- | :--- | :--- | :--- |
| **ADMIN** | `admin@loop.dev` | `Password123!` | Full admin rights, settings & member management |
| **ANALYST** | `analyst@loop.dev` | `Password123!` | Ingest feedback, re-classify, generate reports |
| **VIEWER** | `viewer@loop.dev` | `Password123!` | Read-only analytics & inbox access |

---

## ⚡ Quick Start (Local Setup)

### Prerequisites
- **Node.js**: `v20.x` or higher
- **PostgreSQL**: `16` or `18` running on port `5432`

### 1. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Ensure `.env` contains your PostgreSQL credentials:
```env
DATABASE_URL="postgresql://postgres:Postgres%401234@localhost:5432/loop_db?schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="super-secret-key-change-in-production-min-32-chars"
ANTHROPIC_API_KEY="" # Optional: Heuristic fallback active if omitted
NODE_ENV="development"
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Database Migration & Seeding
```bash
# Generate Prisma client and run migrations
npx prisma migrate dev --name init

# Populate database with 120+ realistic customer feedback records
npm run db:seed
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Run Automated Tests
```bash
npm test
```

---

## 🌐 Production Build & Deployment

To build the production artifact locally:
```bash
npm run build
npm run start
```

### Vercel + Cloud PostgreSQL (Neon / Supabase / Railway)
1. Push project to GitHub.
2. Connect repository to Vercel.
3. Configure Environment Variables (`DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `ANTHROPIC_API_KEY`).
4. Deployment command automatically executes `prisma generate && next build`.

---

## 📜 License & Acknowledgments

Developed as a solo student internship project demonstrating full-stack engineering, AI integration, and multi-tenant cloud architecture.
