import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/rbac";
import { Sentiment, FeedbackStatus } from "@prisma/client";

export async function GET(req: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  try {
    const workspaceId = auth.workspaceId;
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // 1. Core Counts
    const [
      totalFeedback,
      positiveCount,
      neutralCount,
      negativeCount,
      newThisWeekCount,
      prevWeekCount,
      statusNewCount,
      statusReviewedCount,
      statusActionedCount,
    ] = await Promise.all([
      prisma.feedback.count({ where: { workspaceId } }),
      prisma.feedback.count({ where: { workspaceId, sentiment: Sentiment.POSITIVE } }),
      prisma.feedback.count({ where: { workspaceId, sentiment: Sentiment.NEUTRAL } }),
      prisma.feedback.count({ where: { workspaceId, sentiment: Sentiment.NEGATIVE } }),
      prisma.feedback.count({
        where: { workspaceId, createdAt: { gte: sevenDaysAgo } },
      }),
      prisma.feedback.count({
        where: {
          workspaceId,
          createdAt: { gte: fourteenDaysAgo, lt: sevenDaysAgo },
        },
      }),
      prisma.feedback.count({ where: { workspaceId, status: FeedbackStatus.NEW } }),
      prisma.feedback.count({ where: { workspaceId, status: FeedbackStatus.REVIEWED } }),
      prisma.feedback.count({ where: { workspaceId, status: FeedbackStatus.ACTIONED } }),
    ]);

    const negativePercent = totalFeedback > 0 ? parseFloat(((negativeCount / totalFeedback) * 100).toFixed(1)) : 0;
    const positivePercent = totalFeedback > 0 ? parseFloat(((positiveCount / totalFeedback) * 100).toFixed(1)) : 0;
    const neutralPercent = totalFeedback > 0 ? parseFloat(((neutralCount / totalFeedback) * 100).toFixed(1)) : 0;
    const newThisWeekChange = prevWeekCount > 0
      ? parseFloat((((newThisWeekCount - prevWeekCount) / prevWeekCount) * 100).toFixed(1))
      : 0;

    // 2. Volume Over Time (Past 30 days)
    const recentFeedbacks = await prisma.feedback.findMany({
      where: {
        workspaceId,
        createdAt: { gte: thirtyDaysAgo },
      },
      select: {
        createdAt: true,
        sentiment: true,
      },
      orderBy: { createdAt: "asc" },
    });

    const dayMap = new Map<string, { date: string; total: number; positive: number; neutral: number; negative: number }>();
    
    // Initialize past 30 days in map
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().split("T")[0];
      dayMap.set(key, { date: key, total: 0, positive: 0, neutral: 0, negative: 0 });
    }

    recentFeedbacks.forEach((fb) => {
      const key = fb.createdAt.toISOString().split("T")[0];
      const entry = dayMap.get(key) || { date: key, total: 0, positive: 0, neutral: 0, negative: 0 };
      entry.total++;
      if (fb.sentiment === Sentiment.POSITIVE) entry.positive++;
      else if (fb.sentiment === Sentiment.NEUTRAL) entry.neutral++;
      else if (fb.sentiment === Sentiment.NEGATIVE) entry.negative++;
      dayMap.set(key, entry);
    });

    const volumeOverTime = Array.from(dayMap.values());

    // 3. Top Themes Breakdown
    const themes = await prisma.theme.findMany({
      where: { workspaceId },
      include: {
        feedbacks: {
          include: {
            feedback: {
              select: { sentiment: true },
            },
          },
        },
      },
    });

    const topThemes = themes
      .map((t) => {
        const count = t.feedbacks.length;
        let pos = 0, neu = 0, neg = 0;
        t.feedbacks.forEach((ft) => {
          if (ft.feedback.sentiment === Sentiment.POSITIVE) pos++;
          else if (ft.feedback.sentiment === Sentiment.NEUTRAL) neu++;
          else if (ft.feedback.sentiment === Sentiment.NEGATIVE) neg++;
        });

        return {
          id: t.id,
          name: t.name,
          color: t.color || "#6366f1",
          count,
          percentage: totalFeedback > 0 ? parseFloat(((count / totalFeedback) * 100).toFixed(1)) : 0,
          sentimentBreakdown: { positive: pos, neutral: neu, negative: neg },
        };
      })
      .sort((a, b) => b.count - a.count);

    return NextResponse.json({
      stats: {
        totalFeedback,
        negativeCount,
        negativePercent,
        positiveCount,
        positivePercent,
        neutralCount,
        neutralPercent,
        newThisWeekCount,
        prevWeekCount,
        newThisWeekChange,
        statuses: {
          new: statusNewCount,
          reviewed: statusReviewedCount,
          actioned: statusActionedCount,
        },
      },
      volumeOverTime,
      sentimentBreakdown: [
        { sentiment: "POSITIVE", count: positiveCount, percentage: positivePercent, color: "#10b981" },
        { sentiment: "NEUTRAL", count: neutralCount, percentage: neutralPercent, color: "#64748b" },
        { sentiment: "NEGATIVE", count: negativeCount, percentage: negativePercent, color: "#ef4444" },
      ],
      topThemes,
    });
  } catch (err: any) {
    console.error("GET /api/analytics/overview error:", err);
    return NextResponse.json({ error: "Failed to calculate analytics", details: err.message }, { status: 500 });
  }
}
