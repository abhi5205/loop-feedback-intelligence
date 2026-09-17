import Anthropic from "@anthropic-ai/sdk";
import prisma from "@/lib/prisma";
import { Sentiment } from "@prisma/client";

export interface VoCMetrics {
  totalFeedback: number;
  sentimentDistribution: {
    positive: number;
    neutral: number;
    negative: number;
    negativePercent: number;
    positivePercent: number;
  };
  topThemes: Array<{
    theme: string;
    count: number;
    negativeRatio: number;
  }>;
  representativeFeedback: string[];
}

export interface GeneratedReportOutput {
  title: string;
  summary: string;
  keyTakeaways: string[];
  recommendations: string[];
  metrics: VoCMetrics;
}

export async function computeVoCMetrics(
  workspaceId: string,
  startDate: Date,
  endDate: Date
): Promise<VoCMetrics> {
  const feedbacks = await prisma.feedback.findMany({
    where: {
      workspaceId,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      themes: {
        include: { theme: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const total = feedbacks.length;
  let pos = 0, neu = 0, neg = 0;
  const themeCounts = new Map<string, { count: number; neg: number }>();

  feedbacks.forEach((fb) => {
    if (fb.sentiment === Sentiment.POSITIVE) pos++;
    else if (fb.sentiment === Sentiment.NEUTRAL) neu++;
    else if (fb.sentiment === Sentiment.NEGATIVE) neg++;

    fb.themes.forEach((ft) => {
      const entry = themeCounts.get(ft.theme.name) || { count: 0, neg: 0 };
      entry.count++;
      if (fb.sentiment === Sentiment.NEGATIVE) entry.neg++;
      themeCounts.set(ft.theme.name, entry);
    });
  });

  const topThemes = Array.from(themeCounts.entries())
    .map(([theme, stats]) => ({
      theme,
      count: stats.count,
      negativeRatio: stats.count > 0 ? parseFloat((stats.neg / stats.count).toFixed(2)) : 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const representativeFeedback = feedbacks.slice(0, 6).map((f) => f.content);

  return {
    totalFeedback: total,
    sentimentDistribution: {
      positive: pos,
      neutral: neu,
      negative: neg,
      negativePercent: total > 0 ? parseFloat(((neg / total) * 100).toFixed(1)) : 0,
      positivePercent: total > 0 ? parseFloat(((pos / total) * 100).toFixed(1)) : 0,
    },
    topThemes,
    representativeFeedback,
  };
}

export async function generateVoCReport(
  workspaceId: string,
  startDate: Date,
  endDate: Date,
  customTitle?: string
): Promise<GeneratedReportOutput> {
  const metrics = await computeVoCMetrics(workspaceId, startDate, endDate);

  const title = customTitle || `Executive Voice-of-Customer Brief (${startDate.toISOString().split("T")[0]} to ${endDate.toISOString().split("T")[0]})`;

  const apiKey = process.env.ANTHROPIC_API_KEY;

  // Local deterministic report generator if no API key or offline
  const fallbackGenerate = (): GeneratedReportOutput => {
    return {
      title,
      summary: `During this evaluation period, ${metrics.totalFeedback} total customer feedback records were analyzed across all active channels. Overall customer sentiment reflects ${metrics.sentimentDistribution.positivePercent}% positive satisfaction against ${metrics.sentimentDistribution.negativePercent}% negative friction points. The dominant themes driving customer discussions are ${metrics.topThemes.map((t) => t.theme).join(", ")}.`,
      keyTakeaways: [
        `Feedback volume totaled ${metrics.totalFeedback} records with ${metrics.sentimentDistribution.positive} positive and ${metrics.sentimentDistribution.negative} negative signals.`,
        metrics.topThemes.length > 0
          ? `Top customer priority was "${metrics.topThemes[0].theme}" with ${metrics.topThemes[0].count} recorded issues and a ${(metrics.topThemes[0].negativeRatio * 100).toFixed(0)}% negative ratio.`
          : "No specific theme clustering detected.",
        "Representative customer comments highlight critical needs for streamlined export reliability and performance stability.",
      ],
      recommendations: [
        `Prioritize engineering focus on the highest friction area: ${metrics.topThemes[0]?.theme || "Platform Performance"}.`,
        "Implement proactive alerting when negative feedback ratios exceed 40% on any single feature area.",
        "Establish customer success follow-ups for users reporting recurring timeout or billing friction.",
      ],
      metrics,
    };
  };

  if (!apiKey || apiKey.includes("placeholder") || apiKey.trim() === "") {
    return fallbackGenerate();
  }

  const prompt = `You are the lead executive product intelligence analyst for LOOP.
Given the verified database metrics below, generate an executive Voice-of-Customer (VoC) report.

CRITICAL INSTRUCTIONS:
- You must strictly use the provided numbers. Do NOT alter or invent statistics or percentages.
- Output ONLY valid JSON matching this exact structure:
{
  "summary": "2-3 paragraphs synthesizing the customer sentiment trends, highlights, and primary churn hazards",
  "keyTakeaways": ["takeaway 1 with exact numbers", "takeaway 2", "takeaway 3"],
  "recommendations": ["strategic recommendation 1", "recommendation 2", "recommendation 3"]
}

VERIFIED METRICS:
Total Customer Records: ${metrics.totalFeedback}
Positive Feedback: ${metrics.sentimentDistribution.positive} (${metrics.sentimentDistribution.positivePercent}%)
Neutral Feedback: ${metrics.sentimentDistribution.neutral}
Negative Feedback: ${metrics.sentimentDistribution.negative} (${metrics.sentimentDistribution.negativePercent}%)
Top Themes & Negative Ratios:
${metrics.topThemes.map((t) => `- ${t.theme}: ${t.count} items (Negative ratio: ${(t.negativeRatio * 100).toFixed(0)}%)`).join("\n")}
Representative Quotes:
${metrics.representativeFeedback.map((q) => `"${q}"`).join("\n")}`;

  try {
    const anthropic = new Anthropic({ apiKey });
    const response = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 1000,
      temperature: 0.1,
      messages: [{ role: "user", content: prompt }],
    });

    const responseText = response.content[0].type === "text" ? response.content[0].text.trim() : "";
    const cleanJson = responseText.replace(/^```json\s*/, "").replace(/^```\s*/, "").replace(/```$/, "").trim();
    const parsed = JSON.parse(cleanJson);

    return {
      title,
      summary: parsed.summary || fallbackGenerate().summary,
      keyTakeaways: Array.isArray(parsed.keyTakeaways) ? parsed.keyTakeaways : fallbackGenerate().keyTakeaways,
      recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : fallbackGenerate().recommendations,
      metrics,
    };
  } catch (err: any) {
    console.error("VoC Claude API error, using deterministic synthesis:", err);
    return fallbackGenerate();
  }
}
