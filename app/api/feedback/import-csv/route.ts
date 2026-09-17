import { NextRequest, NextResponse } from "next/server";
import Papa from "papaparse";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requireAnalystOrAdmin } from "@/lib/rbac";
import { Channel, FeedbackStatus, Sentiment } from "@prisma/client";

const csvRowSchema = z.object({
  content: z.string().min(5, "Content must have at least 5 characters"),
  customerName: z.string().optional().nullable(),
  customerEmail: z.string().email().optional().nullable().or(z.literal("")),
  channel: z.string().optional().nullable(),
  status: z.string().optional().nullable(),
});

export async function POST(req: NextRequest) {
  const auth = await requireAnalystOrAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const contentType = req.headers.get("content-type") || "";
    let csvText = "";

    if (contentType.includes("application/json")) {
      const body = await req.json();
      csvText = body.csvData || "";
    } else if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      if (!file) {
        return NextResponse.json({ error: "No CSV file provided" }, { status: 400 });
      }
      csvText = await file.text();
    } else {
      csvText = await req.text();
    }

    if (!csvText.trim()) {
      return NextResponse.json({ error: "CSV data is empty" }, { status: 400 });
    }

    // Parse CSV
    const parsed = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim().toLowerCase().replace(/[\s_-]+/g, ""),
    });

    if (parsed.errors.length > 0 && parsed.data.length === 0) {
      return NextResponse.json({ error: "Malformed CSV structure", details: parsed.errors }, { status: 400 });
    }

    const rows = parsed.data as any[];
    const validRecords: any[] = [];
    const errors: Array<{ row: number; reason: string }> = [];

    rows.forEach((rawRow, idx) => {
      const rowNum = idx + 2; // header is row 1, 1-indexed

      // Map flexible header variations
      const normalized = {
        content: rawRow.content || rawRow.feedback || rawRow.comment || rawRow.text || "",
        customerName: rawRow.customername || rawRow.name || rawRow.user || null,
        customerEmail: rawRow.customeremail || rawRow.email || null,
        channel: rawRow.channel || rawRow.source || "WEB_FORM",
        status: rawRow.status || "NEW",
      };

      const val = csvRowSchema.safeParse(normalized);
      if (!val.success) {
        const errorMessages = val.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ");
        errors.push({ row: rowNum, reason: errorMessages });
        return;
      }

      // Channel mapping
      let resolvedChannel: Channel = Channel.WEB_FORM;
      const upperCh = (normalized.channel || "").toUpperCase().replace(/[\s-]+/g, "_");
      if (Object.values(Channel).includes(upperCh as any)) {
        resolvedChannel = upperCh as Channel;
      }

      // Status mapping
      let resolvedStatus: FeedbackStatus = FeedbackStatus.NEW;
      const upperSt = (normalized.status || "").toUpperCase();
      if (Object.values(FeedbackStatus).includes(upperSt as any)) {
        resolvedStatus = upperSt as FeedbackStatus;
      }

      validRecords.push({
        workspaceId: auth.workspaceId,
        content: normalized.content.trim(),
        customerName: normalized.customerName ? normalized.customerName.trim() : null,
        customerEmail: normalized.customerEmail && normalized.customerEmail.trim() !== "" ? normalized.customerEmail.trim() : null,
        channel: resolvedChannel,
        status: resolvedStatus,
        sentiment: Sentiment.NEUTRAL,
        sentimentScore: 0.0,
      });
    });

    // Batch insert valid records without failing on bad rows
    let successCount = 0;
    if (validRecords.length > 0) {
      const result = await prisma.feedback.createMany({
        data: validRecords,
      });
      successCount = result.count;
    }

    return NextResponse.json({
      message: `Import processed: ${successCount} imported successfully, ${errors.length} rows skipped due to errors.`,
      successCount,
      failureCount: errors.length,
      errors,
    });
  } catch (err: any) {
    console.error("CSV import error:", err);
    return NextResponse.json({ error: "Failed to process CSV import", details: err.message }, { status: 500 });
  }
}
