"use client";

import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import {
  MessageSquareQuote,
  Sparkles,
  Send,
  HelpCircle,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Info,
  Layers,
} from "lucide-react";

export default function AskLoopPage() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sampleQueries = [
    "Why are users complaining about CSV exports?",
    "How do customers feel about the new dark mode UI?",
    "What billing and pricing issues have been reported?",
    "Are customers happy with customer support response times?",
    "Tell me about issues with quantum teleportation features", // test insufficient evidence
  ];

  const handleAsk = async (questionToAsk?: string) => {
    const q = questionToAsk || query;
    if (!q.trim()) return;

    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to process question");
      } else {
        setResponse(data);
      }
    } catch {
      setError("Network error connecting to Ask LOOP engine");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Semantic Vector Search &bull; Zero Hallucination RAG</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Ask LOOP Intelligence</h1>
          <p className="text-sm text-slate-400 max-w-xl mx-auto">
            Ask any question about customer sentiment or feature pain points. LOOP synthesizes grounded answers strictly backed by cited feedback.
          </p>
        </div>

        {/* Input Card */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAsk();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. Why are customers complaining about CSV exports?"
              className="flex-1 px-4 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            />
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-sm font-semibold text-white shadow-md shadow-indigo-600/20 transition flex items-center gap-2 shrink-0"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <span>Ask</span>
                  <Send className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Example Chips */}
          <div className="pt-2 flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-semibold text-slate-500">Try asking:</span>
            {sampleQueries.map((sample, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setQuery(sample);
                  handleAsk(sample);
                }}
                className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-indigo-600/20 border border-slate-700 hover:border-indigo-500/30 text-slate-300 hover:text-indigo-300 transition text-left"
              >
                {sample}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Answer Output */}
        {response && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-400">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Grounded Answer Synthesis</span>
                </div>
                {response.hasSufficientEvidence ? (
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                    High Confidence Evidence
                  </span>
                ) : (
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400">
                    Insufficient Evidence
                  </span>
                )}
              </div>

              <div className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
                {response.answer}
              </div>
            </div>

            {/* Citations Box */}
            {response.citations?.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <Layers className="w-4 h-4 text-indigo-400" />
                  <span>Supporting Evidence & Citations ({response.citations.length})</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {response.citations.map((c: any, index: number) => (
                    <div
                      key={c.id}
                      className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2 hover:border-slate-700 transition"
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-indigo-400">Citation #{index + 1}</span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            c.sentiment === "POSITIVE"
                              ? "bg-emerald-500/20 text-emerald-300"
                              : c.sentiment === "NEGATIVE"
                              ? "bg-rose-500/20 text-rose-300"
                              : "bg-slate-500/20 text-slate-300"
                          }`}
                        >
                          {c.sentiment}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed italic">
                        &quot;{c.snippet}&quot;
                      </p>
                      <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-800/60 flex items-center justify-between">
                        <span>{c.customerName || "Anonymous"}</span>
                        <span>{c.channel}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
