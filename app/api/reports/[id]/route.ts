import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth, requireAdmin } from "@/lib/rbac";
import { assertReportBelongsToWorkspace } from "@/lib/tenant";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const { id } = params;

  const belongs = await assertReportBelongsToWorkspace(id, auth.workspaceId);
  if (!belongs) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  const report = await prisma.report.findUnique({
    where: { id },
    include: {
      createdBy: {
        select: { name: true, email: true },
      },
    },
  });

  return NextResponse.json(report);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  const { id } = params;

  const belongs = await assertReportBelongsToWorkspace(id, auth.workspaceId);
  if (!belongs) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  await prisma.report.delete({ where: { id } });

  return NextResponse.json({ message: "Report deleted successfully" });
}
