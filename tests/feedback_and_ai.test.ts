import { describe, it, expect } from "vitest";
import Papa from "papaparse";
import { z } from "zod";
import { classificationSchema } from "@/lib/ai/classifier";
import { generateQueryEmbedding, cosineSimilarity } from "@/lib/ai/embeddings";

describe("Phase 5 & 6: Feedback Ingestion & CSV Parsing", () => {
  const csvRowSchema = z.object({
    content: z.string().min(5, "Content must have at least 5 characters"),
    customerName: z.string().optional().nullable(),
    customerEmail: z.string().email().optional().nullable().or(z.literal("")),
  });

  it("handles partial success and captures row-specific errors without crashing", () => {
    const rawCsv = `content,customerName,customerEmail
"Great real-time webhook performance!",Alice,alice@example.com
"Bad",Bob,bob@example.com
"Valid feedback entry with bad email",Charlie,not-an-email
"The dark mode looks stunning on OLED screens",David,david@example.com`;

    const parsed = Papa.parse(rawCsv, {
      header: true,
      skipEmptyLines: true,
    });

    expect(parsed.data.length).toBe(4);

    const valid: any[] = [];
    const errors: Array<{ row: number; reason: string }> = [];

    (parsed.data as any[]).forEach((row, idx) => {
      const rowNum = idx + 2;
      const res = csvRowSchema.safeParse(row);
      if (!res.success) {
        errors.push({ row: rowNum, reason: res.error.errors.map((e) => e.message).join(", ") });
      } else {
        valid.push(res.data);
      }
    });

    // 2 rows valid, 2 rows with errors
    expect(valid.length).toBe(2);
    expect(errors.length).toBe(2);
    expect(errors[0].row).toBe(3); // Row 3 has "Too short" (< 5 chars)
    expect(errors[1].row).toBe(4); // Row 4 has invalid email
    expect(valid[0].customerName).toBe("Alice");
    expect(valid[1].customerName).toBe("David");
  });
});

describe("Phase 9 & 11: AI Classification & RAG Vector Search", () => {
  it("validates structured classification schema strictly with Zod", () => {
    const validOutput = {
      sentiment: "NEGATIVE",
      sentimentScore: -0.85,
      featureArea: "CSV Export",
      themes: ["Performance & Latency", "Integrations & Export"],
      rationale: "Customer is unable to export 50k rows due to 504 gateway timeout.",
    };

    const parsed = classificationSchema.safeParse(validOutput);
    expect(parsed.success).toBe(true);

    const invalidScore = {
      ...validOutput,
      sentimentScore: -5.0, // outside [-1, 1]
    };
    expect(classificationSchema.safeParse(invalidScore).success).toBe(false);

    const missingThemes = {
      ...validOutput,
      themes: [], // min 1 required
    };
    expect(classificationSchema.safeParse(missingThemes).success).toBe(false);
  });

  it("calculates cosine similarity and vector embeddings properly", () => {
    const vecA = [1, 0, 0, 0];
    const vecB = [1, 0, 0, 0];
    const vecC = [0, 1, 0, 0];

    expect(cosineSimilarity(vecA, vecB)).toBeCloseTo(1.0, 4);
    expect(cosineSimilarity(vecA, vecC)).toBeCloseTo(0.0, 4);

    const embLatency = generateQueryEmbedding("Latency is very slow and export timed out");
    const embBilling = generateQueryEmbedding("Pricing plan and invoice charges are confusing");

    expect(embLatency.length).toBe(16);
    expect(embBilling.length).toBe(16);

    // Queries about latency should match latency embedding higher than billing
    const queryEmb = generateQueryEmbedding("Why is CSV export slow?");
    const simLatency = cosineSimilarity(queryEmb, embLatency);
    const simBilling = cosineSimilarity(queryEmb, embBilling);

    expect(simLatency).toBeGreaterThan(simBilling);
  });
});
