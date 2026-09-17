import Anthropic from "@anthropic-ai/sdk";
import { searchRelevantFeedback } from "@/lib/ai/embeddings";

export interface AskLoopCitation {
  id: string;
  customerName?: string | null;
  channel: string;
  sentiment: string;
  snippet: string;
}

export interface AskLoopResponse {
  answer: string;
  hasSufficientEvidence: boolean;
  citations: AskLoopCitation[];
}

function generateLocalGroundedAnswer(
  query: string,
  retrieved: Array<{ feedback: any; similarityScore: number }>
): AskLoopResponse {
  if (retrieved.length === 0 || retrieved[0].similarityScore < 0.15) {
    return {
      answer: "There is insufficient customer feedback evidence in your workspace to answer this question. No related feedback items matched your query.",
      hasSufficientEvidence: false,
      citations: [],
    };
  }

  const citations: AskLoopCitation[] = retrieved.map((r) => ({
    id: r.feedback.id,
    customerName: r.feedback.customerName,
    channel: r.feedback.channel,
    sentiment: r.feedback.sentiment,
    snippet: r.feedback.content.length > 120 ? r.feedback.content.substring(0, 117) + "..." : r.feedback.content,
  }));

  const sentiments = retrieved.map((r) => r.feedback.sentiment);
  const negativeCount = sentiments.filter((s) => s === "NEGATIVE").length;
  const positiveCount = sentiments.filter((s) => s === "POSITIVE").length;

  let sentimentSummary = "mixed";
  if (negativeCount > positiveCount) sentimentSummary = "predominantly negative";
  else if (positiveCount > negativeCount) sentimentSummary = "largely positive";

  const topQuotes = retrieved.slice(0, 3).map((r) => `"${r.feedback.content}" (${r.feedback.customerName || "Customer"})`).join(" | ");

  const answer = `Based on ${retrieved.length} relevant customer feedback entries retrieved from your workspace, sentiment regarding this topic is ${sentimentSummary}.\n\nKey signals identified:\n- ${topQuotes}\n\nReview the cited customer feedback records below for complete context.`;

  return {
    answer,
    hasSufficientEvidence: true,
    citations,
  };
}

export async function askLoopQuestion(
  query: string,
  workspaceId: string
): Promise<AskLoopResponse> {
  // 1. Vector/semantic search within tenant workspace
  const retrieved = await searchRelevantFeedback(query, workspaceId, 5);

  const apiKey = process.env.ANTHROPIC_API_KEY;

  // If no Claude API key or offline, use deterministic grounded synthesis
  if (!apiKey || apiKey.includes("placeholder") || apiKey.trim() === "") {
    return generateLocalGroundedAnswer(query, retrieved);
  }

  // Check minimum similarity threshold
  if (retrieved.length === 0 || retrieved[0].similarityScore < 0.15) {
    return {
      answer: "There is insufficient customer feedback evidence in your workspace to answer this question. No related feedback items matched your query.",
      hasSufficientEvidence: false,
      citations: [],
    };
  }

  const contextBlocks = retrieved.map((item, idx) => {
    return `[Citation ${idx + 1}] ID: ${item.feedback.id}
Customer: ${item.feedback.customerName || "Anonymous"} (${item.feedback.channel})
Sentiment: ${item.feedback.sentiment} (Score: ${item.feedback.sentimentScore})
Content: "${item.feedback.content}"`;
  }).join("\n\n");

  const systemPrompt = `You are Ask LOOP, an AI customer feedback intelligence assistant.
You answer user questions strictly based on retrieved customer feedback.

CRITICAL RULES:
1. Answer ONLY based on the provided context feedback.
2. If the context does not contain enough relevant information to answer the question, state explicitly: "There is insufficient customer feedback evidence in your workspace to answer this question."
3. Do NOT make up statistics, customer quotes, or facts not present in the context.
4. Always reference supporting citations using [Citation 1], [Citation 2], etc.`;

  try {
    const anthropic = new Anthropic({ apiKey });
    const response = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 600,
      temperature: 0.1,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: `Retrieved Feedback Context:\n${contextBlocks}\n\nUser Question: ${query}`,
        },
      ],
    });

    const answer = response.content[0].type === "text" ? response.content[0].text.trim() : "";
    const hasSufficientEvidence = !answer.toLowerCase().includes("insufficient customer feedback evidence");

    const citations: AskLoopCitation[] = retrieved.map((r) => ({
      id: r.feedback.id,
      customerName: r.feedback.customerName,
      channel: r.feedback.channel,
      sentiment: r.feedback.sentiment,
      snippet: r.feedback.content.length > 120 ? r.feedback.content.substring(0, 117) + "..." : r.feedback.content,
    }));

    return {
      answer,
      hasSufficientEvidence,
      citations: hasSufficientEvidence ? citations : [],
    };
  } catch (err: any) {
    console.error("Ask LOOP Claude API error, falling back to local synthesis:", err);
    return generateLocalGroundedAnswer(query, retrieved);
  }
}
