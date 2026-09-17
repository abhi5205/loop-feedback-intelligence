"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import {
  FileBarChart2,
  Calendar,
  Sparkles,
  Download,
  Printer,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  ChevronRight,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

export default function ReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [selectedReport, setSelectedReport] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Default date range: trailing 30 days
  const today = new Date().toISOString().split("T")[0];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const [startDate, setStartDate] = useState(thirtyDaysAgo);
  const [endDate, setEndDate] = useState(today);
  const [title, setTitle] = useState("");

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/reports");
      const data = await res.json();
      const list = data.reports || [];
      setReports(list);
      if (list.length > 0 && !selectedReport) {
        setSelectedReport(list[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    setError(null);

    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim() || undefined,
          startDate: new Date(startDate).toISOString(),
          endDate: new Date(endDate + "T23:59:59").toISOString(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to generate report");
      } else {
        setReports((prev) => [data, ...prev]);
        setSelectedReport(data);
        setTitle("");
      }
    } catch {
      setError("Network error generating VoC report");
    } finally {
      setGenerating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Voice-of-Customer (VoC) Executive Reports
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Verified SQL statistics synthesized into executive product briefings by Claude AI
            </p>
          </div>

          {selectedReport && (
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-xs font-semibold text-slate-200 transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Export PDF</span>
            </button>
          )}
        </div>

        {/* Generator Form */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-400">
            <Sparkles className="w-4 h-4" />
            <span>Generate New Executive Briefing</span>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleGenerate} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Custom Briefing Title (Optional)
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Q3 Mobile Performance & Churn Analysis"
                className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Start Date</label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">End Date</label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              />
            </div>

            <div className="sm:col-span-4 flex justify-end">
              <button
                type="submit"
                disabled={generating}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-xs font-bold text-white shadow-md shadow-indigo-600/20 transition flex items-center gap-2"
              >
                {generating ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Querying DB & Synthesizing AI Brief...</span>
                  </>
                ) : (
                  <>
                    <FileBarChart2 className="w-4 h-4" />
                    <span>Generate VoC Briefing</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Layout: Left Report History / Right Selected Report Viewer */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* History List */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Report Archive ({reports.length})
            </h2>

            {loading ? (
              <div className="text-xs text-slate-500 text-center py-6">Loading archives...</div>
            ) : reports.length === 0 ? (
              <div className="text-xs text-slate-500 text-center py-6">No reports generated yet.</div>
            ) : (
              <div className="space-y-2">
                {reports.map((rep) => (
                  <button
                    key={rep.id}
                    onClick={() => setSelectedReport(rep)}
                    className={`w-full text-left p-3 rounded-xl border transition ${
                      selectedReport?.id === rep.id
                        ? "bg-indigo-600/15 border-indigo-500/40 text-white"
                        : "bg-slate-800/40 border-slate-800 text-slate-300 hover:bg-slate-800"
                    }`}
                  >
                    <p className="text-xs font-bold truncate">{rep.title}</p>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
                      <span>{rep.totalFeedback} feedback items</span>
                      <span>&bull;</span>
                      <span>{new Date(rep.createdAt).toLocaleDateString()}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Report Content View */}
          <div className="lg:col-span-2">
            {selectedReport ? (
              <div className="p-6 md:p-8 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-6">
                {/* Header */}
                <div className="border-b border-slate-800 pb-5">
                  <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-widest block mb-1">
                    Voice-of-Customer Intelligence
                  </span>
                  <h2 className="text-2xl font-bold text-white">{selectedReport.title}</h2>
                  <div className="flex items-center gap-3 text-xs text-slate-400 mt-2 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(selectedReport.dateRangeStart).toLocaleDateString()} &mdash;{" "}
                      {new Date(selectedReport.dateRangeEnd).toLocaleDateString()}
                    </span>
                    <span>&bull;</span>
                    <span>Generated by {selectedReport.createdBy?.name || "System Admin"}</span>
                  </div>
                </div>

                {/* Verified SQL Metric Badges */}
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                    <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">
                      Verified Volume
                    </span>
                    <span className="text-xl font-extrabold text-white">{selectedReport.totalFeedback}</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                    <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">
                      Positive Ratio
                    </span>
                    <span className="text-xl font-extrabold text-emerald-400">
                      {selectedReport.sentimentDistribution?.positivePercent || 0}%
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                    <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">
                      Negative Ratio
                    </span>
                    <span className="text-xl font-extrabold text-rose-400">
                      {selectedReport.sentimentDistribution?.negativePercent || 0}%
                    </span>
                  </div>
                </div>

                {/* Executive Summary */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Executive Summary
                  </h3>
                  <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
                    {selectedReport.summary}
                  </div>
                </div>

                {/* Key Takeaways */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Key Product Takeaways
                  </h3>
                  <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                    {Array.isArray(selectedReport.keyTakeaways) &&
                      selectedReport.keyTakeaways.map((takeaway: string, idx: number) => (
                        <div key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                          <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                          <span>{takeaway}</span>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Strategic Recommendations */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Strategic Recommendations
                  </h3>
                  <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                    {Array.isArray(selectedReport.recommendations) &&
                      selectedReport.recommendations.map((rec: string, idx: number) => (
                        <div key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                          <ChevronRight className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{rec}</span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-slate-500 rounded-2xl bg-slate-900 border border-slate-800">
                Select a briefing from the archive or generate a new one above.
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
