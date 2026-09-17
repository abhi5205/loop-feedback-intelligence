import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/rbac";
import { askLoopQuestion } from "@/lib/ai/rag";

const askSchema = z.object({
  query: z.string().min(3, "Query must be at least 3 characters long"),
});

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const parsed = askSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid query payload", details: parsed.error.format() }, { status: 400 });
    }

    const { query } = parsed.data;

    // Strict workspace isolation enforced inside askLoopQuestion
    const response = await askLoopQuestion(query, auth.workspaceId);

    return NextResponse.json(response);
  } catch (err: any) {
    console.error("POST /api/ask error:", err);
    return NextResponse.json({ error: "Failed to process question", details: err.message }, { status: 500 });
  }
}
