import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/rbac";
import { z } from "zod";
import { Role } from "@prisma/client";

const patchMemberSchema = z.object({
  userId: z.string().min(1),
  role: z.nativeEnum(Role),
});

/**
 * GET /api/workspace/members
 * Admin-only: list all users in the authenticated workspace.
 */
export async function GET(_req: NextRequest) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const members = await prisma.user.findMany({
      where: { workspaceId: auth.workspaceId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ members });
  } catch (err: any) {
    console.error("GET /api/workspace/members error:", err);
    return NextResponse.json({ error: "Failed to load members", details: err.message }, { status: 500 });
  }
}

/**
 * PATCH /api/workspace/members
 * Admin-only: change a team member's role.
 * Cannot change your own role (prevent accidental self-demotion).
 */
export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const parsed = patchMemberSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.format() }, { status: 400 });
    }

    const { userId, role } = parsed.data;

    if (userId === auth.user.id) {
      return NextResponse.json({ error: "You cannot change your own role" }, { status: 400 });
    }

    // Verify target user is in same workspace
    const target = await prisma.user.findFirst({
      where: { id: userId, workspaceId: auth.workspaceId },
    });

    if (!target) {
      return NextResponse.json({ error: "User not found in this workspace" }, { status: 404 });
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: { id: true, email: true, name: true, role: true },
    });

    return NextResponse.json(updated);
  } catch (err: any) {
    console.error("PATCH /api/workspace/members error:", err);
    return NextResponse.json({ error: "Failed to update member role", details: err.message }, { status: 500 });
  }
}

/**
 * DELETE /api/workspace/members
 * Admin-only: remove a team member from the workspace.
 * Cannot remove yourself.
 */
export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId query parameter required" }, { status: 400 });
    }

    if (userId === auth.user.id) {
      return NextResponse.json({ error: "You cannot remove yourself from the workspace" }, { status: 400 });
    }

    const target = await prisma.user.findFirst({
      where: { id: userId, workspaceId: auth.workspaceId },
    });

    if (!target) {
      return NextResponse.json({ error: "User not found in this workspace" }, { status: 404 });
    }

    await prisma.user.delete({ where: { id: userId } });

    return NextResponse.json({ success: true, message: `${target.name || target.email} removed from workspace` });
  } catch (err: any) {
    console.error("DELETE /api/workspace/members error:", err);
    return NextResponse.json({ error: "Failed to remove member", details: err.message }, { status: 500 });
  }
}
