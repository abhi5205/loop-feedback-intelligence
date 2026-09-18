import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAnalystOrAdmin } from "@/lib/rbac";
import { classifyFeedback } from "@/lib/ai/classifier";
import { Channel, FeedbackStatus } from "@prisma/client";
import { broadcastToWorkspace } from "@/lib/sse";

const SIMULATED_STREAM = [
  { content: "The PDF export generated an empty file when running analytics for yesterday's data.", channel: Channel.INTERCOM, name: "Marcus Brody", email: "marcus@brodycorp.com" },
  { content: "Love the new dashboard UI! The sentiment breakdown donut chart gives immediate clarity during standups.", channel: Channel.SURVEY, name: "Elena Vasquez", email: "elena@designlab.io" },
  { content: "Getting intermittent 429 rate limit errors when calling the feedback query API from our backend.", channel: Channel.EMAIL, name: "Arjun Mehta", email: "arjun@devops.co" },
  { content: "App crashes on launch on iOS 17.4 after the latest release update.", channel: Channel.APP_STORE, name: "Clara Oswald", email: "clara.o@icloud.com" },
  { content: "Support team helped us migrate our data in under 30 minutes. Super impressed!", channel: Channel.WEB_FORM, name: "Simon Baker", email: "sbaker@growthhub.com" },
];

export async function POST(req: NextRequest) {
  const auth = await requireAnalystOrAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const { count = 3 } = await req.json().catch(() => ({ count: 3 }));
    const toGenerate = Math.min(5, Math.max(1, count));

    const createdItems = [];

    for (let i = 0; i < toGenerate; i++) {
      const template = SIMULATED_STREAM[Math.floor(Math.random() * SIMULATED_STREAM.length)];
      const uniqueSuffix = ` (Simulated Feed #${Math.floor(1000 + Math.random() * 9000)})`;

      const classification = await classifyFeedback(template.content, template.channel);

      const feedback = await prisma.feedback.create({
        data: {
          workspaceId: auth.workspaceId,
          content: template.content + uniqueSuffix,
          customerName: template.name,
          customerEmail: template.email,
          channel: template.channel,
          sentiment: classification.sentiment,
          sentimentScore: classification.sentimentScore,
          featureArea: classification.featureArea,
          aiRationale: classification.rationale,
          status: FeedbackStatus.NEW,
        },
      });

      // Map or create themes
      for (const themeName of classification.themes) {
        let theme = await prisma.theme.findFirst({
          where: {
            workspaceId: auth.workspaceId,
            name: { equals: themeName, mode: "insensitive" },
          },
        });

        if (!theme) {
          theme = await prisma.theme.create({
            data: {
              workspaceId: auth.workspaceId,
              name: themeName,
              color: "#6366f1",
            },
          });
        }

        await prisma.feedbackTheme.create({
          data: {
            feedbackId: feedback.id,
            themeId: theme.id,
            workspaceId: auth.workspaceId,
          },
        });
      }

      createdItems.push(feedback);

      // Broadcast to SSE-connected clients in the same workspace
      broadcastToWorkspace(auth.workspaceId, {
        type: "new_feedback",
        feedback: {
          id: feedback.id,
          content: feedback.content,
          sentiment: feedback.sentiment,
          channel: feedback.channel,
          customerName: feedback.customerName,
          createdAt: feedback.createdAt,
        },
      });
    }

    return NextResponse.json({
      message: `Successfully simulated ${createdItems.length} incoming customer signals`,
      items: createdItems,
    });
  } catch (err: any) {
    console.error("Simulation error:", err);
    return NextResponse.json({ error: "Failed to simulate feedback stream", details: err.message }, { status: 500 });
  }
}
