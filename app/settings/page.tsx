"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Building2, Shield, Users, Save, Trash2, CheckCircle2, AlertCircle, RefreshCw, Crown, UserCheck, Eye } from "lucide-react";
import { useSession } from "next-auth/react";

interface Member {
  id: string;
  name: string | null;
  email: string;
  role: "ADMIN" | "ANALYST" | "VIEWER";
  createdAt: string;
}

export default function SettingsPage() {
  const { data: session, update: updateSession } = useSession();
  const currentUser = session?.user as any;
  const isAdmin = currentUser?.role === "ADMIN";

  const [workspaceName, setWorkspaceName] = useState("");
  const [initialName, setInitialName] = useState("");
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingName, setSavingName] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [updatingUser, setUpdatingUser] = useState<string | null>(null);

  const fetchWorkspaceAndMembers = async () => {
    setLoading(true);
    setError(null);
    try {
      const [wsRes, membersRes] = await Promise.all([
        fetch("/api/workspace"),
        fetch("/api/workspace/members"),
      ]);

      if (wsRes.ok) {
        const wsData = await wsRes.json();
        setWorkspaceName(wsData.workspace.name);
        setInitialName(wsData.workspace.name);
      }

      if (membersRes.ok) {
        const mData = await membersRes.json();
        setMembers(mData.members || []);
      }
    } catch (err: any) {
      setError("Failed to load workspace configuration settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkspaceAndMembers();
  }, []);

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceName.trim() || workspaceName === initialName) return;

    setSavingName(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch("/api/workspace", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: workspaceName.trim() }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to update workspace name");
      }

      setInitialName(data.name);
      setSuccessMsg("Workspace name updated successfully");
      if (updateSession) {
        await updateSession();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSavingName(false);
    }
  };

  const handleChangeRole = async (userId: string, newRole: "ADMIN" | "ANALYST" | "VIEWER") => {
    setUpdatingUser(userId);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch("/api/workspace/members", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: newRole }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to update member role");
      }

      setMembers((prev) => prev.map((m) => (m.id === userId ? { ...m, role: newRole } : m)));
      setSuccessMsg("Member role updated");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUpdatingUser(null);
    }
  };

  const handleRemoveMember = async (userId: string, userEmail: string) => {
    if (!confirm(`Are you sure you want to remove ${userEmail} from this workspace?`)) return;

    setUpdatingUser(userId);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch(`/api/workspace/members?userId=${encodeURIComponent(userId)}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to remove member");
      }

      setMembers((prev) => prev.filter((m) => m.id !== userId));
      setSuccessMsg(data.message || "Member removed from workspace");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUpdatingUser(null);
    }
  };

  return (
    <AppShell>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
              <Building2 className="w-6 h-6 text-indigo-400" />
              Workspace Settings
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Manage organization preferences, team member access control, and tenant security.
            </p>
          </div>
          <button
            onClick={fetchWorkspaceAndMembers}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition flex items-center gap-2 self-start sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {/* Banners */}
        {error && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Section 1: Workspace Profile */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2.5 text-indigo-400 font-bold text-base">
            <Building2 className="w-5 h-5" />
            <span>General Preferences</span>
          </div>

          <form onSubmit={handleUpdateName} className="space-y-4 max-w-xl">
            <div>
              <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
                Workspace Name
              </label>
              <input
                type="text"
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                disabled={!isAdmin || loading}
                placeholder="e.g. Acme Corp Feedback Hub"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-indigo-500 disabled:opacity-50"
              />
              {!isAdmin && (
                <p className="text-xs text-slate-500 mt-1.5">
                  Only Workspace Administrators can modify the organization name.
                </p>
              )}
            </div>

            {isAdmin && (
              <button
                type="submit"
                disabled={savingName || workspaceName === initialName || !workspaceName.trim()}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-xs font-semibold text-white shadow-md shadow-indigo-600/20 transition flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {savingName ? "Saving..." : "Save Workspace Name"}
              </button>
            )}
          </form>
        </div>

        {/* Section 2: Team Members & RBAC */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-indigo-400 font-bold text-base">
              <Users className="w-5 h-5" />
              <span>Team Members & Role-Based Access Control</span>
            </div>
            <span className="text-xs text-slate-400 bg-slate-800 px-3 py-1 rounded-full border border-slate-700 font-mono">
              {members.length} {members.length === 1 ? "member" : "members"}
            </span>
          </div>

          {loading ? (
            <div className="py-8 text-center text-sm text-slate-500 animate-pulse">
              Loading team directory...
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-950/80 text-xs text-slate-400 uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3 font-semibold">User</th>
                    <th className="px-4 py-3 font-semibold">Email</th>
                    <th className="px-4 py-3 font-semibold">Current Role</th>
                    <th className="px-4 py-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
                  {members.map((member) => {
                    const isSelf = member.id === currentUser?.id;
                    return (
                      <tr key={member.id} className="hover:bg-slate-800/30 transition">
                        <td className="px-4 py-3.5 font-medium text-white flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-indigo-300">
                            {(member.name || member.email)[0].toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold">{member.name || "Unnamed User"}</div>
                            {isSelf && (
                              <span className="text-[10px] text-indigo-400 font-mono">(You)</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-slate-400 font-mono text-xs">
                          {member.email}
                        </td>
                        <td className="px-4 py-3.5">
                          {isAdmin && !isSelf ? (
                            <select
                              value={member.role}
                              disabled={updatingUser === member.id}
                              onChange={(e) =>
                                handleChangeRole(member.id, e.target.value as any)
                              }
                              className="bg-slate-950 border border-slate-700 rounded-lg text-xs font-semibold px-2.5 py-1 text-slate-200 focus:outline-none focus:border-indigo-500"
                            >
                              <option value="ADMIN">ADMIN</option>
                              <option value="ANALYST">ANALYST</option>
                              <option value="VIEWER">VIEWER</option>
                            </select>
                          ) : (
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-extrabold uppercase border ${
                                member.role === "ADMIN"
                                  ? "bg-rose-500/20 text-rose-300 border-rose-500/30"
                                  : member.role === "ANALYST"
                                  ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/30"
                                  : "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                              }`}
                            >
                              {member.role === "ADMIN" && <Crown className="w-3 h-3" />}
                              {member.role === "ANALYST" && <UserCheck className="w-3 h-3" />}
                              {member.role === "VIEWER" && <Eye className="w-3 h-3" />}
                              {member.role}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          {isAdmin && !isSelf ? (
                            <button
                              onClick={() => handleRemoveMember(member.id, member.email)}
                              disabled={updatingUser === member.id}
                              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
                              title="Remove member"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          ) : (
                            <span className="text-xs text-slate-600">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
