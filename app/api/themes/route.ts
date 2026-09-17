import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/rbac";
import { Sentiment } from "@prisma/client";

export async function GET(req: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  try {
    const workspaceId = auth.workspaceId;
    const now = new Date();
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const twentyEightDaysAgo = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);

    const themes = await prisma.theme.findMany({
      where: { workspaceId },
      include: {
        feedbacks: {
          include: {
            feedback: {
              select: {
                id: true,
                sentiment: true,
                createdAt: true,
              },
            },
          },
        },
      },
    });

    const enriched = themes.map((t) => {
      const allFbs = t.feedbacks.map((tf) => tf.feedback);
      const totalCount = allFbs.length;

      // Period comparison for growth / spike detection
      const recentCount = allFbs.filter((fb) => fb.createdAt >= fourteenDaysAgo).length;
      const priorCount = allFbs.filter(
        (fb) => fb.createdAt >= twentyEightDaysAgo && fb.createdAt < fourteenDaysAgo
      ).length;

      let growthRate = 0;
      let isSpike = false;

      if (priorCount > 0) {
        growthRate = parseFloat((((recentCount - priorCount) / priorCount) * 100).toFixed(1));
        if (growthRate >= 50 && recentCount >= 4) {
          isSpike = true;
        }
      } else if (recentCount >= 3) {
        growthRate = 100;
        isSpike = true;
      }

      let positive = 0;
      let neutral = 0;
      let negative = 0;

      allFbs.forEach((fb) => {
        if (fb.sentiment === Sentiment.POSITIVE) positive++;
        else if (fb.sentiment === Sentiment.NEUTRAL) neutral++;
        else if (fb.sentiment === Sentiment.NEGATIVE) negative++;
      });

      return {
        id: t.id,
        name: t.name,
        description: t.description,
        color: t.color || "#6366f1",
        totalCount,
        recentCount,
        priorCount,
        growthRate,
        isSpike,
        sentimentBreakdown: {
          positive,
          neutral,
          negative,
          negativeRatio: totalCount > 0 ? parseFloat((negative / totalCount).toFixed(2)) : 0,
        },
      };
    });

    // Sort by totalCount descending
    enriched.sort((a, b) => b.totalCount - a.totalCount);

    return NextResponse.json({ themes: enriched });
  } catch (err: any) {
    console.error("GET /api/themes error:", err);
    return NextResponse.json({ error: "Failed to fetch themes", details: err.message }, { status: 500 });
  }
}
