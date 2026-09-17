import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAnalystOrAdmin } from "@/lib/rbac";
import { assertFeedbackBelongsToWorkspace } from "@/lib/tenant";
import { classifyFeedback } from "@/lib/ai/classifier";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAnalystOrAdmin();
  if (auth instanceof NextResponse) return auth;

  const { id } = params;

  const belongs = await assertFeedbackBelongsToWorkspace(id, auth.workspaceId);
  if (!belongs) {
    return NextResponse.json({ error: "Feedback not found" }, { status: 404 });
  }

  try {
    const feedback = await prisma.feedback.findUnique({
      where: { id },
    });

    if (!feedback) {
      return NextResponse.json({ error: "Feedback not found" }, { status: 404 });
    }

    // Run AI classification
    const classification = await classifyFeedback(feedback.content, feedback.channel);

    // Update feedback record
    const updated = await prisma.feedback.update({
      where: { id },
      data: {
        sentiment: classification.sentiment,
        sentimentScore: classification.sentimentScore,
        featureArea: classification.featureArea,
        aiRationale: classification.rationale,
      },
      include: {
        themes: {
          include: { theme: true },
        },
      },
    });

    return NextResponse.json({
      message: "Feedback re-classified successfully",
      feedback: updated,
      classification,
    });
  } catch (err: any) {
    console.error("Reclassification error:", err);
    return NextResponse.json({ error: "Failed to re-classify feedback", details: err.message }, { status: 500 });
  }
}
