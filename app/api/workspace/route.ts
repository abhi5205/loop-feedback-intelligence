import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth, requireAdmin } from "@/lib/rbac";
import { z } from "zod";

const patchWorkspaceSchema = z.object({
  name: z.string().min(2, "Workspace name must be at least 2 characters").optional(),
});

/**
 * GET /api/workspace
 * Returns workspace info + member count for the authenticated user's workspace.
 */
export async function GET(_req: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  try {
    const workspace = await prisma.workspace.findUnique({
      where: { id: auth.workspaceId },
      include: {
        _count: { select: { users: true, feedbacks: true, reports: true } },
      },
    });

    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    return NextResponse.json(workspace);
  } catch (err: any) {
    console.error("GET /api/workspace error:", err);
    return NextResponse.json({ error: "Failed to load workspace", details: err.message }, { status: 500 });
  }
}

/**
 * PATCH /api/workspace
 * Admin-only: update workspace name.
 */
export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const parsed = patchWorkspaceSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.format() }, { status: 400 });
    }

    const updated = await prisma.workspace.update({
      where: { id: auth.workspaceId },
      data: { name: parsed.data.name },
    });

    return NextResponse.json(updated);
  } catch (err: any) {
    console.error("PATCH /api/workspace error:", err);
    return NextResponse.json({ error: "Failed to update workspace", details: err.message }, { status: 500 });
  }
}
