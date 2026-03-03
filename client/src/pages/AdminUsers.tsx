/**
 * AdminUsers — User Role Management
 * Admin-only page to view all users and promote/demote roles (user / operator / admin)
 * Includes quick-promote buttons and a banner for users with role=user who need operator access
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Shield, Users, RefreshCw, AlertCircle, Lock, UserCheck, Zap } from "lucide-react";
import { toast } from "sonner";

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-red-900/40 text-red-300 border border-red-800/40",
  operator: "bg-indigo-900/40 text-indigo-300 border border-indigo-800/40",
  user: "bg-slate-700/60 text-slate-300 border border-slate-600/40",
};

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  operator: "Operator",
  user: "User",
};

export default function AdminUsers() {
  const { user, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const { data: userList, isLoading, refetch } = trpc.admin.listUsers.useQuery(undefined, {
    enabled: user?.role === "admin",
  });

  const updateRole = trpc.admin.updateUserRole.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("Role updated successfully");
      setUpdatingId(null);
    },
    onError: (err) => {
      toast.error(err.message ?? "Failed to update role");
      setUpdatingId(null);
    },
  });

  const quickPromote = (userId: number, role: "operator" | "admin") => {
    setUpdatingId(userId);
    updateRole.mutate({ userId, role });
  };

  // Auth guard
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#080c14] flex items-center justify-center">
        <div className="text-slate-400 text-sm">Checking access…</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#080c14] flex items-center justify-center">
        <div className="text-center">
          <Lock className="w-10 h-10 text-slate-500 mx-auto mb-3" />
          <p className="text-slate-300 font-semibold">Login required</p>
          <button onClick={() => navigate("/")} className="mt-4 text-indigo-400 text-sm hover:underline">Go home</button>
        </div>
      </div>
    );
  }

  if (user.role !== "admin") {
    return (
      <div className="min-h-screen bg-[#080c14] flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <p className="text-slate-300 font-semibold">Admin access required</p>
          <p className="text-slate-500 text-sm mt-1">Your current role is <span className="text-slate-300">{user.role}</span>.</p>
          <button onClick={() => navigate("/occ")} className="mt-4 text-indigo-400 text-sm hover:underline">Back to OCC</button>
        </div>
      </div>
    );
  }

  // Users who need operator access (role=user, not the current admin)
  const pendingUsers = (userList ?? []).filter(u => u.role === "user" && u.id !== user.id);

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-200" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      {/* Header */}
      <header className="border-b border-slate-800 bg-[#0a0d14] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-red-900/40 border border-red-800/40 flex items-center justify-center">
            <Shield className="w-4 h-4 text-red-400" />
          </div>
          <div>
            <h1 className="font-bold text-base">User Management</h1>
            <p className="text-slate-500 text-xs">Chorus.AI Admin Panel</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => refetch()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs font-medium transition-colors"
          >
            <RefreshCw className="w-3 h-3" /> Refresh
          </button>
          <button
            onClick={() => navigate("/occ")}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-900/40 hover:bg-indigo-800/60 text-indigo-300 rounded text-xs font-medium transition-colors"
          >
            ← Back to OCC
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Quick Promote Banner — users who need operator access */}
        {pendingUsers.length > 0 && (
          <div className="mb-6 bg-indigo-900/20 border border-indigo-700/40 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <UserCheck className="w-4 h-4 text-indigo-400" />
              <span className="text-indigo-300 text-sm font-semibold">
                {pendingUsers.length} team member{pendingUsers.length > 1 ? "s" : ""} with basic access — promote to Operator to grant platform access
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {pendingUsers.map(u => (
                <div key={u.id} className="flex items-center gap-2 bg-[#0f172a] border border-slate-700 rounded-lg px-3 py-2">
                  <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-300">
                    {(u.name ?? u.email ?? "?")[0].toUpperCase()}
                  </div>
                  <span className="text-slate-300 text-xs font-medium">{u.name ?? u.email ?? `User #${u.id}`}</span>
                  <button
                    disabled={updatingId === u.id}
                    onClick={() => quickPromote(u.id, "operator")}
                    className="flex items-center gap-1 bg-indigo-700 hover:bg-indigo-600 text-white text-[10px] font-semibold px-2 py-0.5 rounded transition-colors disabled:opacity-50"
                  >
                    <Zap className="w-2.5 h-2.5" />
                    {updatingId === u.id ? "…" : "Make Operator"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Role Guide */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { role: "user", icon: Users, desc: "Default role. Can register for events and view event rooms." },
            { role: "operator", icon: Shield, desc: "Can access the OCC, create events, manage webcasts, and use all operator tools." },
            { role: "admin", icon: Shield, desc: "Full access including User Management, seed data tools, and all operator capabilities." },
          ].map(({ role, icon: Icon, desc }) => (
            <div key={role} className="bg-[#0f172a] border border-slate-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded ${ROLE_COLORS[role]}`}>{ROLE_LABELS[role]}</span>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        {/* User Table */}
        <div className="bg-[#0f172a] border border-slate-800 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-slate-400" />
              <span className="font-semibold text-sm">All Users</span>
              {userList && <span className="text-slate-500 text-xs">({userList.length})</span>}
            </div>
          </div>

          {isLoading ? (
            <div className="py-12 text-center text-slate-500 text-sm">Loading users…</div>
          ) : !userList || userList.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-sm">No users found.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500 text-xs uppercase tracking-wider">
                  <th className="text-left px-4 py-2.5 font-medium">User</th>
                  <th className="text-left px-4 py-2.5 font-medium">Email</th>
                  <th className="text-left px-4 py-2.5 font-medium">Login</th>
                  <th className="text-left px-4 py-2.5 font-medium">Last Seen</th>
                  <th className="text-left px-4 py-2.5 font-medium">Role</th>
                  <th className="text-left px-4 py-2.5 font-medium">Change Role</th>
                </tr>
              </thead>
              <tbody>
                {userList.map((u) => (
                  <tr key={u.id} className={`border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors ${u.id === user.id ? "bg-indigo-900/10" : ""}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-300">
                          {(u.name ?? u.email ?? "?")[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-slate-200 text-xs">{u.name ?? "—"}</div>
                          {u.id === user.id && <div className="text-indigo-400 text-[10px]">You</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{u.email ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs capitalize">{u.loginMethod ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">
                      {u.lastSignedIn ? new Date(u.lastSignedIn).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded ${ROLE_COLORS[u.role ?? "user"]}`}>
                        {ROLE_LABELS[u.role ?? "user"]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {u.id === user.id ? (
                        <span className="text-slate-600 text-xs italic">Cannot change own role</span>
                      ) : (
                        <div className="flex items-center gap-1">
                          {(["user", "operator", "admin"] as const).map((r) => (
                            <button
                              key={r}
                              disabled={u.role === r || updatingId === u.id}
                              onClick={() => {
                                setUpdatingId(u.id);
                                updateRole.mutate({ userId: u.id, role: r });
                              }}
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                                u.role === r
                                  ? ROLE_COLORS[r] + " opacity-60"
                                  : "bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200"
                              }`}
                            >
                              {updatingId === u.id && u.role !== r ? "…" : ROLE_LABELS[r]}
                            </button>
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Info box */}
        <div className="mt-6 bg-amber-900/20 border border-amber-800/30 rounded-lg px-4 py-3 flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-amber-300 text-xs font-semibold mb-0.5">Role changes take effect immediately</p>
            <p className="text-amber-400/70 text-xs">Users with the <strong>operator</strong> role can access the OCC, create and manage events, and use all conference management tools. The <strong>admin</strong> role additionally grants access to this User Management page. When a team member logs in for the first time, they appear here with role=user — use the quick-promote banner above to grant them operator access.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
