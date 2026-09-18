import Link from "next/link";
import { 
  Sparkles, 
  BarChart3, 
  MessageSquare, 
  BrainCircuit, 
  FileText, 
  ShieldCheck, 
  ArrowRight,
  Database,
  Layers
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-900 text-white selection:bg-indigo-500 selection:text-white">
      {/* Header / Nav */}
      <header className="border-b border-slate-800/80 backdrop-blur sticky top-0 z-50 bg-slate-900/80">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center font-black text-xl text-white shadow-lg shadow-indigo-500/30">
              ∞
            </div>
            <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              LOOP
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-medium ml-2">
              v1.0 AI Intelligence
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-medium text-slate-300 hover:text-white transition px-3 py-2"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg shadow-md shadow-indigo-600/20 transition flex items-center gap-1.5"
            >
              Get Started
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-24 pb-20 px-6 overflow-hidden">
        <div className="absolute inset-0 -z-10 flex items-center justify-center">
          <div className="w-[650px] h-[650px] bg-indigo-500/10 rounded-full blur-3xl" />
          <div className="w-[450px] h-[450px] bg-violet-500/10 rounded-full blur-2xl -translate-y-20" />
        </div>

        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/90 border border-slate-700 text-xs text-indigo-300">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Autonomous Customer Feedback Intelligence with Claude AI</span>
          </div>

          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.15] bg-gradient-to-b from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
            Turn fragmented feedback into actionable product clarity.
          </h1>

          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            LOOP ingests customer signals from App Store reviews, support tickets, and surveys, categorizes sentiment and emergent themes, and gives your product team instant answers with grounded RAG search.
          </p>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/login"
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-6 py-3 rounded-xl shadow-lg shadow-indigo-600/30 transition flex items-center gap-2"
            >
              Launch Demo Workspace
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/signup"
              className="bg-slate-800/90 hover:bg-slate-750 text-slate-200 border border-slate-700 font-semibold px-6 py-3 rounded-xl hover:bg-slate-800 transition"
            >
              Register New Tenant
            </Link>
          </div>

          {/* Quick Demo Credentials Box for Evaluation */}
          <div className="pt-6 max-w-xl mx-auto">
            <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 backdrop-blur text-left space-y-2">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-indigo-400">
                <span>🔑 Evaluation Pre-configured Accounts</span>
                <span className="text-[10px] text-slate-400 font-mono">Password: Password123!</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs font-mono pt-1">
                <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-700/80">
                  <span className="text-[10px] text-rose-400 block font-sans font-bold">ADMIN</span>
                  <span className="text-slate-200">admin@loop.dev</span>
                </div>
                <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-700/80">
                  <span className="text-[10px] text-indigo-400 block font-sans font-bold">ANALYST</span>
                  <span className="text-slate-200">analyst@loop.dev</span>
                </div>
                <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-700/80">
                  <span className="text-[10px] text-emerald-400 block font-sans font-bold">VIEWER</span>
                  <span className="text-slate-200">viewer@loop.dev</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-slate-800/50 border border-slate-800 hover:border-slate-700 transition">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-4">
              <BrainCircuit className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Claude Auto-Classification</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Real-time sentiment scoring, feature area tagging, and theme extraction with verified Zod schema validation.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-800/50 border border-slate-800 hover:border-slate-700 transition">
            <div className="w-12 h-12 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400 flex items-center justify-center mb-4">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Ask LOOP (RAG Engine)</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Ask natural language questions about customer issues with zero hallucination. Verified source citations included.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-800/50 border border-slate-800 hover:border-slate-700 transition">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Voice-of-Customer Reports</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Deterministic SQL calculations combined with AI executive synthesis. Export shareable intelligence briefs.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-800/50 border border-slate-800 hover:border-slate-700 transition">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-4">
              <BarChart3 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Dynamic Analytics</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Volume trends, sentiment breakdowns, and spike detection computed directly from PostgreSQL.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-800/50 border border-slate-800 hover:border-slate-700 transition">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mb-4">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Multi-Tenancy & RBAC</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Strict server-side workspace isolation. ADMIN, ANALYST, and VIEWER roles with granular access controls.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-800/50 border border-slate-800 hover:border-slate-700 transition">
            <div className="w-12 h-12 rounded-xl bg-pink-500/10 border border-pink-500/20 text-pink-400 flex items-center justify-center mb-4">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Bulk CSV & Simulation</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Fault-tolerant CSV ingestion with partial failure recovery and simulated live incoming feedback streams.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-8 text-center text-sm text-slate-500">
        <p>LOOP — AI Customer-Feedback Intelligence Platform &bull; Built for Internship Evaluation</p>
      </footer>
    </div>
  );
}
