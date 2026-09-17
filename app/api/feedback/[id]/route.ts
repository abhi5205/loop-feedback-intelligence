import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requireAuth, requireAnalystOrAdmin, requireAdmin } from "@/lib/rbac";
import { assertFeedbackBelongsToWorkspace } from "@/lib/tenant";
import { FeedbackStatus } from "@prisma/client";

const updateFeedbackSchema = z.object({
  status: z.nativeEnum(FeedbackStatus).optional(),
  featureArea: z.string().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const { id } = params;

  // Strict tenant boundary check
  const belongs = await assertFeedbackBelongsToWorkspace(id, auth.workspaceId);
  if (!belongs) {
    return NextResponse.json({ error: "Feedback not found" }, { status: 404 });
  }

  const feedback = await prisma.feedback.findUnique({
    where: { id },
    include: {
      themes: {
        include: { theme: true },
      },
      embedding: true,
    },
  });

  return NextResponse.json(feedback);
}

export async function PATCH(
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
    const body = await req.json();
    const parsed = updateFeedbackSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid update data", details: parsed.error.format() }, { status: 400 });
    }

    const updated = await prisma.feedback.update({
      where: { id },
      data: {
        ...(parsed.data.status ? { status: parsed.data.status } : {}),
        ...(parsed.data.featureArea ? { featureArea: parsed.data.featureArea } : {}),
      },
      include: {
        themes: {
          include: { theme: true },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to update feedback", details: err.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  const { id } = params;

  const belongs = await assertFeedbackBelongsToWorkspace(id, auth.workspaceId);
  if (!belongs) {
    return NextResponse.json({ error: "Feedback not found" }, { status: 404 });
  }

  await prisma.feedback.delete({ where: { id } });

  return NextResponse.json({ message: "Feedback deleted successfully" });
}
