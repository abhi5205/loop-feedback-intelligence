"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Inbox,
  Tags,
  MessageSquareQuote,
  FileBarChart2,
  PlusCircle,
  UploadCloud,
  Radio,
  LogOut,
  Building2,
  Shield,
  Menu,
  X,
  Sparkles,
  Settings as SettingsIcon,
} from "lucide-react";
import { IngestModal } from "@/components/IngestModal";
import { CsvUploadModal } from "@/components/CsvUploadModal";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [ingestModalOpen, setIngestModalOpen] = useState(false);
  const [csvModalOpen, setCsvModalOpen] = useState(false);
  const [simulating, setSimulating] = useState(false);

  const user = session?.user as any;
  const role = user?.role || "VIEWER";
  const workspaceName = user?.workspaceName || "Demo Workspace";
  const isViewer = role === "VIEWER";

  const navItems = [
    { label: "Overview Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Feedback Inbox", href: "/inbox", icon: Inbox },
    { label: "Themes & Trends", href: "/themes", icon: Tags },
    { label: "Ask LOOP (RAG)", href: "/ask", icon: MessageSquareQuote },
    { label: "VoC Reports", href: "/reports", icon: FileBarChart2 },
    { label: "Settings & Team", href: "/settings", icon: SettingsIcon },
  ];

  const handleSimulate = async () => {
    if (isViewer) return;
    setSimulating(true);
    try {
      const res = await fetch("/api/feedback/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count: 3 }),
      });
      const data = await res.json();
      if (res.ok) {
        window.location.reload();
      } else {
        alert(data.error || "Simulation failed");
      }
    } catch {
      alert("Simulation failed");
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex w-64 flex-col border-r border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 h-screen z-30">
        {/* Brand */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center font-black text-lg text-white shadow-md shadow-indigo-500/20">
              ∞
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight text-white block">LOOP</span>
              <span className="text-[10px] text-slate-400 font-medium block">Feedback Intelligence</span>
            </div>
          </Link>
        </div>

        {/* Tenant Workspace Badge */}
        <div className="px-4 py-3 border-b border-slate-800/60 bg-slate-950/40">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Building2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span className="truncate font-semibold text-slate-200">{workspaceName}</span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                  active
                    ? "bg-indigo-600/15 text-indigo-400 border border-indigo-500/30"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? "text-indigo-400" : "text-slate-400"}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Profile & Role */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-indigo-300">
                {user?.name ? user.name[0].toUpperCase() : "U"}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-200 truncate">{user?.name || "User"}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span
                    className={`inline-block text-[10px] uppercase tracking-wider font-extrabold px-1.5 py-0.2 rounded ${
                      role === "ADMIN"
                        ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                        : role === "ANALYST"
                        ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                        : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                    }`}
                  >
                    {role}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              title="Sign Out"
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="h-16 border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-20 px-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium hidden sm:inline">Workspace:</span>
              <span className="text-sm font-semibold text-white bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700/80">
                {workspaceName}
              </span>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={handleSimulate}
              disabled={isViewer || simulating}
              title={isViewer ? "Viewer role cannot trigger simulations" : "Generate 3 simulated live reviews"}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 disabled:opacity-40 border border-slate-700 text-xs font-medium text-slate-200 transition flex items-center gap-1.5"
            >
              <Radio className={`w-3.5 h-3.5 text-pink-400 ${simulating ? "animate-pulse" : ""}`} />
              <span className="hidden sm:inline">Simulate Feed</span>
            </button>

            <button
              onClick={() => setCsvModalOpen(true)}
              disabled={isViewer}
              title={isViewer ? "Viewer role cannot upload CSVs" : "Bulk import feedback via CSV"}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 disabled:opacity-40 border border-slate-700 text-xs font-medium text-slate-200 transition flex items-center gap-1.5"
            >
              <UploadCloud className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Upload CSV</span>
            </button>

            <button
              onClick={() => setIngestModalOpen(true)}
              disabled={isViewer}
              title={isViewer ? "Viewer role cannot create feedback" : "Submit new customer feedback"}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-xs font-semibold text-white shadow-md shadow-indigo-600/20 transition flex items-center gap-1.5"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>+ Ingest</span>
            </button>
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-slate-800 bg-slate-900 px-4 py-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium ${
                    active ? "bg-indigo-600/20 text-indigo-400" : "text-slate-400"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        )}

        {/* Page Content */}
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>

      {/* Modals */}
      <IngestModal isOpen={ingestModalOpen} onClose={() => setIngestModalOpen(false)} />
      <CsvUploadModal isOpen={csvModalOpen} onClose={() => setCsvModalOpen(false)} />
    </div>
  );
}
