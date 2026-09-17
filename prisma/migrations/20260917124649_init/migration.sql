-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'ANALYST', 'VIEWER');

-- CreateEnum
CREATE TYPE "Channel" AS ENUM ('EMAIL', 'APP_STORE', 'WEB_FORM', 'INTERCOM', 'SURVEY');

-- CreateEnum
CREATE TYPE "Sentiment" AS ENUM ('POSITIVE', 'NEUTRAL', 'NEGATIVE');

-- CreateEnum
CREATE TYPE "FeedbackStatus" AS ENUM ('NEW', 'REVIEWED', 'ACTIONED');

-- CreateTable
CREATE TABLE "workspaces" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workspaces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'ANALYST',
    "workspaceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feedbacks" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "customerName" TEXT,
    "customerEmail" TEXT,
    "channel" "Channel" NOT NULL DEFAULT 'WEB_FORM',
    "sentiment" "Sentiment" NOT NULL DEFAULT 'NEUTRAL',
    "sentimentScore" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "featureArea" TEXT,
    "aiRationale" TEXT,
    "status" "FeedbackStatus" NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feedbacks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "themes" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT DEFAULT '#6366f1',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "themes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feedback_themes" (
    "feedbackId" TEXT NOT NULL,
    "themeId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,

    CONSTRAINT "feedback_themes_pkey" PRIMARY KEY ("feedbackId","themeId")
);

-- CreateTable
CREATE TABLE "embeddings" (
    "id" TEXT NOT NULL,
    "feedbackId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "vectorJson" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "embeddings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reports" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "dateRangeStart" TIMESTAMP(3) NOT NULL,
    "dateRangeEnd" TIMESTAMP(3) NOT NULL,
    "totalFeedback" INTEGER NOT NULL,
    "sentimentDistribution" JSONB NOT NULL,
    "topThemes" JSONB NOT NULL,
    "summary" TEXT NOT NULL,
    "keyTakeaways" JSONB NOT NULL,
    "recommendations" JSONB NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "workspaces_slug_key" ON "workspaces"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_workspaceId_idx" ON "users"("workspaceId");

-- CreateIndex
CREATE INDEX "feedbacks_workspaceId_createdAt_idx" ON "feedbacks"("workspaceId", "createdAt");

-- CreateIndex
CREATE INDEX "feedbacks_workspaceId_status_idx" ON "feedbacks"("workspaceId", "status");

-- CreateIndex
CREATE INDEX "feedbacks_workspaceId_sentiment_idx" ON "feedbacks"("workspaceId", "sentiment");

-- CreateIndex
CREATE INDEX "feedbacks_workspaceId_channel_idx" ON "feedbacks"("workspaceId", "channel");

-- CreateIndex
CREATE INDEX "themes_workspaceId_idx" ON "themes"("workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "themes_workspaceId_name_key" ON "themes"("workspaceId", "name");

-- CreateIndex
CREATE INDEX "feedback_themes_workspaceId_idx" ON "feedback_themes"("workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "embeddings_feedbackId_key" ON "embeddings"("feedbackId");

-- CreateIndex
CREATE INDEX "embeddings_workspaceId_idx" ON "embeddings"("workspaceId");

-- CreateIndex
CREATE INDEX "reports_workspaceId_createdAt_idx" ON "reports"("workspaceId", "createdAt");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedbacks" ADD CONSTRAINT "feedbacks_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "themes" ADD CONSTRAINT "themes_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedback_themes" ADD CONSTRAINT "feedback_themes_feedbackId_fkey" FOREIGN KEY ("feedbackId") REFERENCES "feedbacks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedback_themes" ADD CONSTRAINT "feedback_themes_themeId_fkey" FOREIGN KEY ("themeId") REFERENCES "themes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "embeddings" ADD CONSTRAINT "embeddings_feedbackId_fkey" FOREIGN KEY ("feedbackId") REFERENCES "feedbacks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "embeddings" ADD CONSTRAINT "embeddings_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
