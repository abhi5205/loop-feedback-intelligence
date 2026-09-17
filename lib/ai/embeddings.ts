import prisma from "@/lib/prisma";

/**
 * Calculates cosine similarity between two float vectors.
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length || vecA.length === 0) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Generates an embedding vector for text.
 * When an external embedding API is not configured, uses a deterministic semantic
 * hashing algorithm that captures domain topics (latency, billing, dark mode, support, etc.).
 */
export function generateQueryEmbedding(text: string): number[] {
  const lower = text.toLowerCase();
  const vector: number[] = new Array(16).fill(0);

  // Semantic topic weights mapped to vector dimensions
  const topics = [
    ["speed", "slow", "fast", "latency", "load", "loading", "504", "performance"],
    ["billing", "price", "pricing", "invoice", "cost", "seat", "charge", "refund"],
    ["ui", "ux", "dark mode", "contrast", "design", "layout", "button", "modal"],
    ["onboarding", "tour", "tutorial", "docs", "documentation", "guide", "setup"],
    ["uptime", "downtime", "crash", "outage", "502", "500", "error", "disconnect"],
    ["support", "agent", "ticket", "sla", "response", "help", "customer service"],
    ["slack", "export", "csv", "webhook", "zapier", "integration", "linear", "jira"],
    ["mobile", "ios", "safari", "android", "phone", "app store"],
    ["search", "query", "filter", "find", "results"],
    ["checkout", "payment", "card", "vat", "stripe"],
    ["team", "member", "collaborate", "role", "admin"],
    ["login", "auth", "sso", "password", "session"],
    ["negative", "frustrated", "broken", "unacceptable", "terrible", "worst"],
    ["positive", "love", "great", "excellent", "awesome", "slick", "best"],
    ["email", "survey", "form", "notification", "alert"],
    ["feature", "request", "wish", "need", "could you"],
  ];

  topics.forEach((keywords, dim) => {
    for (const kw of keywords) {
      if (lower.includes(kw)) {
        vector[dim] += 1.0;
      }
    }
  });

  // Normalize vector
  const norm = Math.sqrt(vector.reduce((acc, v) => acc + v * v, 0));
  if (norm > 0) {
    for (let i = 0; i < vector.length; i++) {
      vector[i] = parseFloat((vector[i] / norm).toFixed(4));
    }
  } else {
    // Default evenly spread normalized vector
    for (let i = 0; i < vector.length; i++) {
      vector[i] = parseFloat((1 / Math.sqrt(16)).toFixed(4));
    }
  }

  return vector;
}

/**
 * Searches top-K relevant feedback for a query within a tenant workspace.
 * Strict workspace isolation guaranteed: only queries embeddings where workspaceId matches.
 */
export async function searchRelevantFeedback(
  query: string,
  workspaceId: string,
  topK: number = 5
) {
  const queryVec = generateQueryEmbedding(query);

  // Retrieve all embeddings for this workspace
  const embeddings = await prisma.embedding.findMany({
    where: { workspaceId },
    include: {
      feedback: {
        include: {
          themes: {
            include: { theme: true },
          },
        },
      },
    },
  });

  if (embeddings.length === 0) {
    return [];
  }

  // Calculate similarity for each
  const scored = embeddings.map((emb) => {
    let vec: number[] = [];
    try {
      vec = JSON.parse(emb.vectorJson);
    } catch {
      vec = [];
    }

    // Text substring boost
    const contentLower = emb.feedback.content.toLowerCase();
    const queryWords = query.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
    let keywordMatches = 0;
    queryWords.forEach((w) => {
      if (contentLower.includes(w)) keywordMatches++;
    });

    const cosineSim = vec.length > 0 ? cosineSimilarity(queryVec, vec) : 0;
    const combinedScore = cosineSim * 0.6 + (keywordMatches / Math.max(1, queryWords.length)) * 0.4;

    return {
      feedback: emb.feedback,
      similarityScore: combinedScore,
    };
  });

  // Sort descending and take top K
  scored.sort((a, b) => b.similarityScore - a.similarityScore);
  return scored.slice(0, topK);
}
