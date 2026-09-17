import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requireAuth, requireAnalystOrAdmin } from "@/lib/rbac";
import { generateVoCReport } from "@/lib/ai/voc";

const createReportSchema = z.object({
  title: z.string().optional(),
  startDate: z.string().refine((d) => !isNaN(Date.parse(d)), "Invalid start date"),
  endDate: z.string().refine((d) => !isNaN(Date.parse(d)), "Invalid end date"),
});

export async function GET(req: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  try {
    const reports = await prisma.report.findMany({
      where: { workspaceId: auth.workspaceId },
      orderBy: { createdAt: "desc" },
      include: {
        createdBy: {
          select: { name: true, email: true },
        },
      },
    });

    return NextResponse.json({ reports });
  } catch (err: any) {
    console.error("GET /api/reports error:", err);
    return NextResponse.json({ error: "Failed to fetch reports", details: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAnalystOrAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const parsed = createReportSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid date range", details: parsed.error.format() }, { status: 400 });
    }

    const { title, startDate, endDate } = parsed.data;
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) {
      return NextResponse.json({ error: "Start date cannot be after end date" }, { status: 400 });
    }

    // Generate VoC report using verified DB statistics + Claude synthesis
    const reportData = await generateVoCReport(auth.workspaceId, start, end, title);

    // Save report in PostgreSQL
    const saved = await prisma.report.create({
      data: {
        workspaceId: auth.workspaceId,
        title: reportData.title,
        dateRangeStart: start,
        dateRangeEnd: end,
        totalFeedback: reportData.metrics.totalFeedback,
        sentimentDistribution: reportData.metrics.sentimentDistribution as any,
        topThemes: reportData.metrics.topThemes as any,
        summary: reportData.summary,
        keyTakeaways: reportData.keyTakeaways as any,
        recommendations: reportData.recommendations as any,
        createdById: auth.user.id,
      },
      include: {
        createdBy: {
          select: { name: true, email: true },
        },
      },
    });

    return NextResponse.json(saved, { status: 201 });
  } catch (err: any) {
    console.error("POST /api/reports error:", err);
    return NextResponse.json({ error: "Failed to generate report", details: err.message }, { status: 500 });
  }
}
