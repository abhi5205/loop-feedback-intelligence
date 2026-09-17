"use client";

import { useEffect, useState, useCallback } from "react";
import { AppShell } from "@/components/AppShell";
import {
  Search,
  Filter,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  RefreshCw,
  Mail,
  Smartphone,
  Globe,
  MessageCircle,
  HelpCircle,
  Clock,
  CheckCircle,
  AlertTriangle,
  X,
  User,
  ExternalLink,
} from "lucide-react";

export default function InboxPage() {
  const [items, setItems] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [channel, setChannel] = useState("ALL");
  const [sentiment, setSentiment] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const [themeId, setThemeId] = useState("");
  const [themes, setThemes] = useState<any[]>([]);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [reclassifyingId, setReclassifyingId] = useState<string | null>(null);

  // Fetch available themes for filter
  useEffect(() => {
    fetch("/api/themes")
      .then((r) => r.json())
      .then((d) => setThemes(d.themes || []))
      .catch(() => {});
  }, []);

  const fetchFeedback = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", pagination.page.toString());
      params.set("limit", "10");
      if (search.trim()) params.set("search", search.trim());
      if (channel !== "ALL") params.set("channel", channel);
      if (sentiment !== "ALL") params.set("sentiment", sentiment);
      if (status !== "ALL") params.set("status", status);
      if (themeId) params.set("themeId", themeId);

      const res = await fetch(`/api/feedback?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load feedback");
      const data = await res.json();
      setItems(data.items || []);
      setPagination(data.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, search, channel, sentiment, status, themeId]);

  useEffect(() => {
    fetchFeedback();
  }, [fetchFeedback]);

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/feedback/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setItems((prev) =>
          prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
        );
        if (selectedItem?.id === id) {
          setSelectedItem((prev: any) => ({ ...prev, status: newStatus }));
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleReclassify = async (id: string) => {
    setReclassifyingId(id);
    try {
      const res = await fetch(`/api/feedback/${id}/classify`, {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        setItems((prev) =>
          prev.map((item) => (item.id === id ? data.feedback : item))
        );
        if (selectedItem?.id === id) {
          setSelectedItem(data.feedback);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setReclassifyingId(null);
    }
  };

  const getChannelIcon = (ch: string) => {
    switch (ch) {
      case "EMAIL":
        return <Mail className="w-3.5 h-3.5 text-blue-400" />;
      case "APP_STORE":
        return <Smartphone className="w-3.5 h-3.5 text-pink-400" />;
      case "INTERCOM":
        return <MessageCircle className="w-3.5 h-3.5 text-violet-400" />;
      case "SURVEY":
        return <HelpCircle className="w-3.5 h-3.5 text-amber-400" />;
      default:
        return <Globe className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Customer Feedback Inbox
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Search, filter, and inspect verified customer feedback items with AI classification
            </p>
          </div>
          <div className="text-xs text-slate-400 font-medium">
            Showing {items.length} of {pagination.total} records
          </div>
        </div>

        {/* Filter Bar */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          {/* Top Search Input */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              placeholder="Search feedback keywords, feature areas, customer names, or emails..."
              className="w-full pl-10 pr-4 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            />
          </div>

          {/* Secondary Filter Dropdowns */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">
                Channel
              </label>
              <select
                value={channel}
                onChange={(e) => {
                  setChannel(e.target.value);
                  setPagination((p) => ({ ...p, page: 1 }));
                }}
                className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ALL">All Channels</option>
                <option value="WEB_FORM">Web Form</option>
                <option value="EMAIL">Email</option>
                <option value="INTERCOM">Intercom / Chat</option>
                <option value="APP_STORE">App Store</option>
                <option value="SURVEY">Survey / NPS</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">
                Sentiment
              </label>
              <select
                value={sentiment}
                onChange={(e) => {
                  setSentiment(e.target.value);
                  setPagination((p) => ({ ...p, page: 1 }));
                }}
                className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ALL">All Sentiments</option>
                <option value="POSITIVE">Positive</option>
                <option value="NEUTRAL">Neutral</option>
                <option value="NEGATIVE">Negative</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPagination((p) => ({ ...p, page: 1 }));
                }}
                className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ALL">All Statuses</option>
                <option value="NEW">New</option>
                <option value="REVIEWED">Reviewed</option>
                <option value="ACTIONED">Actioned</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">
                Theme
              </label>
              <select
                value={themeId}
                onChange={(e) => {
                  setThemeId(e.target.value);
                  setPagination((p) => ({ ...p, page: 1 }));
                }}
                className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Themes</option>
                {themes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Feedback Table / List */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          {loading ? (
            <div className="p-12 text-center text-slate-400 space-y-3">
              <div className="w-6 h-6 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto" />
              <p className="text-xs">Loading feedback items...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="p-12 text-center text-slate-400 space-y-3">
              <AlertTriangle className="w-8 h-8 mx-auto text-slate-500" />
              <p className="text-sm font-semibold text-slate-300">No feedback items match your filters</p>
              <p className="text-xs text-slate-500">Try adjusting your search query or reset filter dropdowns.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {items.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className="p-4 hover:bg-slate-800/50 transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1 min-w-0 pr-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                        {getChannelIcon(item.channel)}
                        <span>{item.channel}</span>
                      </span>

                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          item.sentiment === "POSITIVE"
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                            : item.sentiment === "NEGATIVE"
                            ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                            : "bg-slate-500/20 text-slate-300 border border-slate-500/30"
                        }`}
                      >
                        {item.sentiment} ({item.sentimentScore > 0 ? `+${item.sentimentScore}` : item.sentimentScore})
                      </span>

                      {item.featureArea && (
                        <span className="text-[11px] px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-medium">
                          {item.featureArea}
                        </span>
                      )}

                      {item.themes?.map((t: any) => (
                        <span
                          key={t.themeId}
                          className="text-[10px] px-1.5 py-0.5 rounded text-slate-300 bg-slate-800/80 border border-slate-700"
                        >
                          {t.theme?.name}
                        </span>
                      ))}
                    </div>

                    <p className="text-sm font-medium text-slate-200 line-clamp-2">
                      {item.content}
                    </p>

                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span>{item.customerName || "Anonymous Customer"}</span>
                      <span>&bull;</span>
                      <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Inline Status Controls */}
                  <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <select
                      value={item.status}
                      onChange={(e) => handleStatusChange(item.id, e.target.value)}
                      className={`text-xs font-semibold px-2.5 py-1 rounded-lg border focus:outline-none transition ${
                        item.status === "NEW"
                          ? "bg-amber-500/10 text-amber-300 border-amber-500/30"
                          : item.status === "REVIEWED"
                          ? "bg-indigo-500/10 text-indigo-300 border-indigo-500/30"
                          : "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                      }`}
                    >
                      <option value="NEW">NEW</option>
                      <option value="REVIEWED">REVIEWED</option>
                      <option value="ACTIONED">ACTIONED</option>
                    </select>

                    <button
                      onClick={() => handleReclassify(item.id)}
                      disabled={reclassifyingId === item.id}
                      title="Re-classify with Claude AI"
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-indigo-600/20 border border-slate-700 hover:border-indigo-500/30 text-slate-400 hover:text-indigo-400 transition"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${reclassifyingId === item.id ? "animate-spin text-indigo-400" : ""}`} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination Footer */}
          <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>
              Page {pagination.page} of {pagination.totalPages || 1}
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={pagination.page <= 1}
                onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 disabled:opacity-40 text-slate-200 transition flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Previous
              </button>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 disabled:opacity-40 text-slate-200 transition flex items-center gap-1"
              >
                Next
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Feedback Detail Slide-Out Modal */}
        {selectedItem && (
          <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/80 backdrop-blur-sm">
            <div className="w-full max-w-xl bg-slate-900 border-l border-slate-800 h-full p-6 overflow-y-auto space-y-6 shadow-2xl relative text-white">
              <button
                onClick={() => setSelectedItem(null)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-mono">ID: {selectedItem.id}</span>
              </div>

              <div>
                <h2 className="text-xl font-bold text-white mb-2">Feedback Details</h2>
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                      selectedItem.sentiment === "POSITIVE"
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        : selectedItem.sentiment === "NEGATIVE"
                        ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                        : "bg-slate-500/20 text-slate-300 border border-slate-500/30"
                    }`}
                  >
                    {selectedItem.sentiment} (Score: {selectedItem.sentimentScore})
                  </span>

                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                    Channel: {selectedItem.channel}
                  </span>
                </div>
              </div>

              {/* Feedback Content Box */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                  Raw Customer Submission
                </label>
                <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
                  {selectedItem.content}
                </p>
              </div>

              {/* AI Classification Insights */}
              <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-500/30 space-y-3">
                <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider">
                  <Sparkles className="w-4 h-4" />
                  <span>Claude AI Classification Breakdown</span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Feature Area</span>
                    <span className="font-semibold text-white">{selectedItem.featureArea || "General"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Sentiment Confidence</span>
                    <span className="font-semibold text-indigo-300">
                      {Math.abs(selectedItem.sentimentScore * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>

                {selectedItem.aiRationale && (
                  <div className="pt-2 border-t border-indigo-500/20">
                    <span className="text-slate-400 block text-[11px] mb-1">AI Rationale</span>
                    <p className="text-xs text-slate-300 leading-relaxed">{selectedItem.aiRationale}</p>
                  </div>
                )}
              </div>

              {/* Customer Metadata */}
              <div className="space-y-2 text-xs border-t border-slate-800 pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Customer Name:</span>
                  <span className="text-white font-medium">{selectedItem.customerName || "N/A"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Customer Email:</span>
                  <span className="text-white font-medium">{selectedItem.customerEmail || "N/A"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Received Date:</span>
                  <span className="text-white font-medium">
                    {new Date(selectedItem.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
