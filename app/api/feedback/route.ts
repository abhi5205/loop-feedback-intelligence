import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requireAuth, requireAnalystOrAdmin } from "@/lib/rbac";
import { classifyFeedback } from "@/lib/ai/classifier";
import { Channel, FeedbackStatus, Sentiment } from "@prisma/client";

const createFeedbackSchema = z.object({
  content: z.string().min(5, "Feedback content must be at least 5 characters"),
  customerName: z.string().optional().nullable(),
  customerEmail: z.string().email("Invalid email format").optional().nullable().or(z.literal("")),
  channel: z.nativeEnum(Channel).default(Channel.WEB_FORM),
  status: z.nativeEnum(FeedbackStatus).default(FeedbackStatus.NEW),
});

export async function GET(req: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "15")));
    const search = searchParams.get("search") || "";
    const channel = searchParams.get("channel") as Channel | null;
    const sentiment = searchParams.get("sentiment") as Sentiment | null;
    const status = searchParams.get("status") as FeedbackStatus | null;
    const themeId = searchParams.get("themeId") || "";
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Build filter strictly scoped to tenant workspace
    const where: any = {
      workspaceId: auth.workspaceId,
    };

    if (search.trim()) {
      where.OR = [
        { content: { contains: search, mode: "insensitive" } },
        { customerName: { contains: search, mode: "insensitive" } },
        { customerEmail: { contains: search, mode: "insensitive" } },
        { featureArea: { contains: search, mode: "insensitive" } },
      ];
    }

    if (channel && Object.values(Channel).includes(channel)) {
      where.channel = channel;
    }

    if (sentiment && Object.values(Sentiment).includes(sentiment)) {
      where.sentiment = sentiment;
    }

    if (status && Object.values(FeedbackStatus).includes(status)) {
      where.status = status;
    }

    if (themeId) {
      where.themes = {
        some: {
          themeId: themeId,
          workspaceId: auth.workspaceId,
        },
      };
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      prisma.feedback.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          themes: {
            include: {
              theme: true,
            },
          },
        },
      }),
      prisma.feedback.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore: page < totalPages,
      },
    });
  } catch (error: any) {
    console.error("GET /api/feedback error:", error);
    return NextResponse.json({ error: "Failed to fetch feedback", details: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  // RBAC: Analyst or Admin required to ingest feedback
  const auth = await requireAnalystOrAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const parsed = createFeedbackSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { content, customerName, customerEmail, channel, status } = parsed.data;

    // AI Classification
    const classification = await classifyFeedback(content, channel);

    // Create Feedback in tenant workspace
    const feedback = await prisma.feedback.create({
      data: {
        workspaceId: auth.workspaceId,
        content,
        customerName: customerName || null,
        customerEmail: customerEmail && customerEmail.trim() !== "" ? customerEmail : null,
        channel,
        sentiment: classification.sentiment,
        sentimentScore: classification.sentimentScore,
        featureArea: classification.featureArea,
        aiRationale: classification.rationale,
        status,
      },
    });

    // Map or create themes in tenant workspace
    for (const themeName of classification.themes) {
      // Find or create theme within this workspace
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

    const createdWithThemes = await prisma.feedback.findUnique({
      where: { id: feedback.id },
      include: {
        themes: {
          include: { theme: true },
        },
      },
    });

    return NextResponse.json(createdWithThemes, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/feedback error:", error);
    return NextResponse.json({ error: "Failed to create feedback", details: error.message }, { status: 500 });
  }
}
