import Link from "next/link";
import { ShieldAlert, ArrowLeft, Home } from "lucide-react";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-white">
      <div className="max-w-md w-full text-center space-y-6 bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-bold tracking-widest text-rose-400 uppercase">
            Error 403 &bull; Forbidden
          </span>
          <h1 className="text-2xl font-bold text-white">Access Denied</h1>
          <p className="text-sm text-slate-400 leading-relaxed">
            Your role does not have permission to access this resource or perform this action. If you believe this is an error, please contact your workspace administrator.
          </p>
        </div>

        <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-sm font-medium transition shadow-md shadow-indigo-600/20"
          >
            <Home className="w-4 h-4" />
            Dashboard
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-sm font-medium text-slate-300 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Switch Account
          </Link>
        </div>
      </div>
    </div>
  );
}
