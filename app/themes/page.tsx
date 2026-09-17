"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import {
  Tags,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  MessageSquare,
  Flame,
  CheckCircle2,
  ChevronRight,
  X,
} from "lucide-react";

export default function ThemesPage() {
  const [themes, setThemes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTheme, setSelectedTheme] = useState<any | null>(null);
  const [themeFeedbacks, setThemeFeedbacks] = useState<any[]>([]);
  const [loadingFeedbacks, setLoadingFeedbacks] = useState(false);

  const fetchThemes = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/themes");
      const data = await res.json();
      setThemes(data.themes || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchThemes();
  }, []);

  const handleSelectTheme = async (theme: any) => {
    setSelectedTheme(theme);
    setLoadingFeedbacks(true);
    try {
      const res = await fetch(`/api/feedback?themeId=${theme.id}&limit=20`);
      const data = await res.json();
      setThemeFeedbacks(data.items || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingFeedbacks(false);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Theme & Trend Intelligence
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Automated cluster extraction, spike detection, and trailing 14-day velocity comparisons
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-44 rounded-2xl bg-slate-900 border border-slate-800" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {themes.map((theme) => (
              <div
                key={theme.id}
                onClick={() => handleSelectTheme(theme)}
                className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-900/90 transition cursor-pointer flex flex-col justify-between group shadow-lg"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: theme.color }} />
                      <h3 className="font-bold text-white group-hover:text-indigo-400 transition">
                        {theme.name}
                      </h3>
                    </div>

                    {theme.isSpike && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse">
                        <Flame className="w-3 h-3 text-rose-400" />
                        Spike
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                    {theme.description || "Aggregated customer feedback topics identified by Claude AI."}
                  </p>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Total Mentions:</span>
                    <span className="font-bold text-white">{theme.totalCount} items</span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">14-Day Velocity:</span>
                    <span
                      className={`font-semibold flex items-center gap-1 ${
                        theme.growthRate >= 0 ? "text-rose-400" : "text-emerald-400"
                      }`}
                    >
                      {theme.growthRate >= 0 ? `+${theme.growthRate}%` : `${theme.growthRate}%`}
                    </span>
                  </div>

                  {/* Sentiment Bar */}
                  <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden flex mt-2">
                    <div
                      className="bg-emerald-500 h-full"
                      style={{
                        width: `${(theme.sentimentBreakdown.positive / Math.max(1, theme.totalCount)) * 100}%`,
                      }}
                      title={`Positive: ${theme.sentimentBreakdown.positive}`}
                    />
                    <div
                      className="bg-slate-500 h-full"
                      style={{
                        width: `${(theme.sentimentBreakdown.neutral / Math.max(1, theme.totalCount)) * 100}%`,
                      }}
                      title={`Neutral: ${theme.sentimentBreakdown.neutral}`}
                    />
                    <div
                      className="bg-rose-500 h-full"
                      style={{
                        width: `${(theme.sentimentBreakdown.negative / Math.max(1, theme.totalCount)) * 100}%`,
                      }}
                      title={`Negative: ${theme.sentimentBreakdown.negative}`}
                    />
                  </div>

                  <div className="pt-2 flex items-center justify-between text-[11px] text-indigo-400 font-semibold group-hover:translate-x-0.5 transition">
                    <span>Drill-down into feedback</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Theme Drill-Down Slide-Out */}
        {selectedTheme && (
          <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/80 backdrop-blur-sm">
            <div className="w-full max-w-xl bg-slate-900 border-l border-slate-800 h-full p-6 overflow-y-auto space-y-6 shadow-2xl relative text-white">
              <button
                onClick={() => setSelectedTheme(null)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: selectedTheme.color }} />
                <h2 className="text-xl font-bold text-white">{selectedTheme.name}</h2>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">TOTAL ITEMS</span>
                  <span className="text-lg font-bold text-white">{selectedTheme.totalCount}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">NEGATIVE RATIO</span>
                  <span className="text-lg font-bold text-rose-400">
                    {(selectedTheme.sentimentBreakdown.negativeRatio * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">14-DAY VELOCITY</span>
                  <span className="text-lg font-bold text-indigo-300">{selectedTheme.growthRate}%</span>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                  Customer Submissions for &quot;{selectedTheme.name}&quot;
                </h3>

                {loadingFeedbacks ? (
                  <div className="text-center py-8 text-xs text-slate-500">Loading drill-down feedback...</div>
                ) : (
                  <div className="space-y-3">
                    {themeFeedbacks.map((fb) => (
                      <div key={fb.id} className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                              fb.sentiment === "POSITIVE"
                                ? "bg-emerald-500/20 text-emerald-300"
                                : fb.sentiment === "NEGATIVE"
                                ? "bg-rose-500/20 text-rose-300"
                                : "bg-slate-500/20 text-slate-300"
                            }`}
                          >
                            {fb.sentiment}
                          </span>
                          <span className="text-slate-500 text-[11px]">{new Date(fb.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p className="text-xs text-slate-200 leading-relaxed">{fb.content}</p>
                        <div className="text-[11px] text-slate-500">{fb.customerName || "Customer"} &bull; {fb.channel}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
