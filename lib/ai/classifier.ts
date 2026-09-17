import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { Sentiment, Channel } from "@prisma/client";

export const classificationSchema = z.object({
  sentiment: z.enum(["POSITIVE", "NEUTRAL", "NEGATIVE"]),
  sentimentScore: z.number().min(-1).max(1),
  featureArea: z.string().min(1),
  themes: z.array(z.string()).min(1),
  rationale: z.string().min(5),
});

export type ClassificationOutput = z.infer<typeof classificationSchema>;

// Fallback heuristic classifier when API key is missing or Claude API is unreachable
function heuristicClassification(content: string): ClassificationOutput {
  const lower = content.toLowerCase();

  const positiveWords = ["great", "excellent", "love", "fast", "improvement", "smooth", "saved", "awesome", "slick", "outstanding", "helpful", "gorgeous"];
  const negativeWords = ["slow", "error", "timeout", "bug", "broken", "failed", "unacceptable", "terrible", "charged", "missing", "lag", "sluggish", "504", "502"];

  let posCount = 0;
  let negCount = 0;

  for (const w of positiveWords) {
    if (lower.includes(w)) posCount++;
  }
  for (const w of negativeWords) {
    if (lower.includes(w)) negCount++;
  }

  let sentiment: "POSITIVE" | "NEUTRAL" | "NEGATIVE" = "NEUTRAL";
  let score = 0.0;

  if (negCount > posCount) {
    sentiment = "NEGATIVE";
    score = Math.max(-1.0, -0.4 - (negCount * 0.15));
  } else if (posCount > negCount) {
    sentiment = "POSITIVE";
    score = Math.min(1.0, 0.4 + (posCount * 0.15));
  }

  // Feature Area detection
  let featureArea = "General";
  const themes: string[] = [];

  if (lower.includes("dashboard") || lower.includes("screen") || lower.includes("ui") || lower.includes("dark mode") || lower.includes("modal")) {
    featureArea = "UI & Usability";
    themes.push("UI & Usability");
  }
  if (lower.includes("load") || lower.includes("latency") || lower.includes("slow") || lower.includes("fast") || lower.includes("speed")) {
    featureArea = "Performance";
    themes.push("Performance & Latency");
  }
  if (lower.includes("pricing") || lower.includes("charged") || lower.includes("invoice") || lower.includes("tier") || lower.includes("billing")) {
    featureArea = "Billing & Pricing";
    themes.push("Billing & Pricing");
  }
  if (lower.includes("support") || lower.includes("agent") || lower.includes("ticket") || lower.includes("help")) {
    featureArea = "Customer Support";
    themes.push("Customer Support");
  }
  if (lower.includes("export") || lower.includes("slack") || lower.includes("webhook") || lower.includes("integration") || lower.includes("csv")) {
    featureArea = "Integrations & Export";
    themes.push("Integrations & Export");
  }
  if (lower.includes("uptime") || lower.includes("outage") || lower.includes("crash") || lower.includes("500") || lower.includes("502")) {
    featureArea = "Reliability";
    themes.push("Reliability & Uptime");
  }

  if (themes.length === 0) {
    themes.push("General Feedback");
  }

  return {
    sentiment,
    sentimentScore: parseFloat(score.toFixed(2)),
    featureArea,
    themes,
    rationale: `Automated heuristic classification detected ${sentiment.toLowerCase()} sentiment markers related to ${featureArea}.`,
  };
}

/**
 * Classifies feedback content using Claude 3.5 Sonnet / Haiku.
 * Validates output using Zod and falls back gracefully on network/API failure.
 */
export async function classifyFeedback(
  content: string,
  channel?: Channel
): Promise<ClassificationOutput> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  // Fallback if no real API key is configured
  if (!apiKey || apiKey.includes("placeholder") || apiKey.trim() === "") {
    return heuristicClassification(content);
  }

  const anthropic = new Anthropic({ apiKey });

  const systemPrompt = `You are the lead AI feedback classification engine for LOOP, an enterprise customer intelligence platform.
Analyze the provided customer feedback carefully.
Output your response as STRICT JSON matching this exact schema:
{
  "sentiment": "POSITIVE" | "NEUTRAL" | "NEGATIVE",
  "sentimentScore": number between -1.0 (extremely negative) and 1.0 (extremely positive),
  "featureArea": string (concise feature or component name, e.g., "Checkout", "CSV Export", "Dark Mode", "API Docs"),
  "themes": array of strings (relevant theme tags),
  "rationale": string (1-2 sentences explaining why this sentiment and feature area were assigned)
}
Do NOT output any markdown blocks, code formatting, or surrounding explanation. ONLY valid JSON.`;

  // Up to 2 attempts with retry
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const response = await anthropic.messages.create({
        model: "claude-3-haiku-20240307",
        max_tokens: 400,
        temperature: 0.1,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: `Customer Feedback: "${content}"\nChannel: ${channel || "UNKNOWN"}`,
          },
        ],
      });

      const responseText = response.content[0].type === "text" ? response.content[0].text.trim() : "";
      
      // Clean JSON if Claude wraps in backticks
      const cleanJson = responseText.replace(/^```json\s*/, "").replace(/^```\s*/, "").replace(/```$/, "").trim();
      const parsedRaw = JSON.parse(cleanJson);
      const validated = classificationSchema.safeParse(parsedRaw);

      if (validated.success) {
        return validated.data;
      }
      console.warn(`Claude output schema validation failed on attempt ${attempt}:`, validated.error);
    } catch (err: any) {
      console.error(`Claude classification attempt ${attempt} error:`, err.message);
    }
  }

  // Graceful fallback if Claude retries fail or output was malformed
  return heuristicClassification(content);
}
