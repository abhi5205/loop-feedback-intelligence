"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Lock, Mail, Sparkles, AlertCircle, Shield, UserCheck, Eye } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        setError("Invalid email or password. Please verify credentials.");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err: any) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoFill = (roleEmail: string) => {
    setEmail(roleEmail);
    setPassword("Password123!");
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-white">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center gap-2 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center font-black text-2xl text-white shadow-lg shadow-indigo-500/30">
            ∞
          </div>
          <span className="text-2xl font-black tracking-tight text-white">LOOP</span>
        </Link>
        <h2 className="text-2xl font-bold tracking-tight text-slate-100">
          Sign in to your workspace
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          Access your feedback intelligence and customer analytics
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-slate-900/90 py-8 px-6 shadow-2xl border border-slate-800 rounded-2xl sm:px-10 backdrop-blur">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Work Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@loop.dev"
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium rounded-xl shadow-lg shadow-indigo-600/20 transition flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* 1-Click Demo Logins for Evaluation Reviewers */}
          <div className="mt-8 pt-6 border-t border-slate-800">
            <div className="text-center mb-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                ⚡ 1-Click Demo Evaluation Roles
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleDemoFill("admin@loop.dev")}
                className="p-2 text-center rounded-lg bg-slate-800/60 hover:bg-indigo-600/20 border border-slate-700 hover:border-indigo-500/40 text-xs font-medium text-slate-300 transition"
              >
                <Shield className="w-3.5 h-3.5 mx-auto mb-1 text-indigo-400" />
                Admin
              </button>
              <button
                type="button"
                onClick={() => handleDemoFill("analyst@loop.dev")}
                className="p-2 text-center rounded-lg bg-slate-800/60 hover:bg-violet-600/20 border border-slate-700 hover:border-violet-500/40 text-xs font-medium text-slate-300 transition"
              >
                <UserCheck className="w-3.5 h-3.5 mx-auto mb-1 text-violet-400" />
                Analyst
              </button>
              <button
                type="button"
                onClick={() => handleDemoFill("viewer@loop.dev")}
                className="p-2 text-center rounded-lg bg-slate-800/60 hover:bg-emerald-600/20 border border-slate-700 hover:border-emerald-500/40 text-xs font-medium text-slate-300 transition"
              >
                <Eye className="w-3.5 h-3.5 mx-auto mb-1 text-emerald-400" />
                Viewer
              </button>
            </div>
            <p className="text-[11px] text-slate-500 text-center mt-2">
              Password for all seeded accounts: <code className="text-indigo-300">Password123!</code>
            </p>
          </div>

          <div className="mt-6 text-center text-sm text-slate-400">
            Don&apos;t have a workspace?{" "}
            <Link href="/signup" className="text-indigo-400 hover:text-indigo-300 font-semibold underline underline-offset-4">
              Create one here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
