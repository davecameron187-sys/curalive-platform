/**
 * AdminUsers — User Role Management
 * Admin-only page to view all users and promote/demote roles (user / moderator / operator / admin)
 * Features: quick-promote banner, role statistics, role-change reason popover,
 *           full role-change audit log with CSV export.
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import {
  Shield, Users, RefreshCw, AlertCircle, Lock, UserCheck, Zap,
  ClipboardList, ArrowRight, Download, X, Check, Upload,
} from "lucide-react";
import { toast } from "sonner";

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-red-900/40 text-red-300 border border-red-800/40",
  operator: "bg-indigo-900/40 text-indigo-300 border border-indigo-800/40",
  moderator: "bg-amber-900/40 text-amber-300 border border-amber-800/40",
  user: "bg-slate-700/60 text-slate-300 border border-slate-600/40",
};

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  operator: "Operator",
  moderator: "Moderator",
  user: "User",
};

type RoleKey = "user" | "moderator" | "operator" | "admin";

/** CSV Bulk Import Form */
function BulkImportForm({
  onImportComplete,
}: {
  onImportComplete: () => void;
}) {
  const [csvText, setCsvText] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const bulkImport = trpc.admin.bulkImportRoles.useMutation({
    onSuccess: (result) => {
      toast.success(`Imported ${result.successful} users, ${result.failed} failed`);
      setCsvText("");
      setIsOpen(false);
      onImportComplete();
    },
    onError: (err) => {
      toast.error(err.message ?? "Import failed");
    },
  });

  const handleImport = () => {
    const lines = csvText.trim().split("\n").filter(l => l.trim());
    if (lines.length < 2) {
      toast.error("CSV must have at least a header row and one data row");
      return;
    }
    const headers = lines[0].toLowerCase().split(",").map(h => h.trim());
    const emailIdx = headers.indexOf("email");
    const roleIdx = headers.indexOf("role");
    if (emailIdx === -1 || roleIdx === -1) {
      toast.error("CSV must have 'email' and 'role' columns");
      return;
    }
    const records = lines.slice(1).map(line => {
      const cols = line.split(",").map(c => c.trim());
      return { email: cols[emailIdx], role: cols[roleIdx] };
    });
    bulkImport.mutate({ records });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-[#0f172a] border border-slate-700 rounded-lg p-6 max-w-lg w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-200">Bulk Import Roles</h3>
          <button onClick={() => setIsOpen(false)} className="text-slate-500 hover:text-slate-300">
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-slate-400 text-sm mb-4">
          Paste CSV with columns: <code className="bg-slate-800 px-1 rounded text-xs">email,role</code>. Roles: user, moderator, operator, admin.
        </p>
        <textarea
          value={csvText}
          onChange={(e) => setCsvText(e.target.value)}
          placeholder="email,role\njohn@example.com,operator\njane@example.com,moderator"
          rows={6}
          className="w-full bg-slate-800 border border-slate-700 rounded text-xs text-slate-200 placeholder-slate-500 px-3 py-2 resize-none focus:outline-none focus:border-indigo-500 mb-4 font-mono"
        />
        <div className="flex gap-2">
          <button
            onClick={handleImport}
            disabled={bulkImport.isPending || !csvText.trim()}
            className="flex-1 flex items-center justify-center gap-1.5 bg-indigo-700 hover:bg-indigo-600 text-white text-sm font-semibold px-4 py-2 rounded transition-colors disabled:opacity-50"
          >
            <Upload className="w-4 h-4" />
            {bulkImport.isPending ? "Importing…" : "Import"}
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-sm transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

/** Inline popover that appears when clicking a role button */
function RoleChangePopover({
  targetName,
  currentRole,
  newRole,
  onConfirm,
  onCancel,
  isPending,
}: {
  targetName: string;
  currentRole: string;
  newRole: RoleKey;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  const [reason, setReason] = useState("");
  return (
    <div
      className="absolute z-50 top-full left-0 mt-1 w-72 bg-[#0f172a] border border-slate-700 rounded-lg shadow-xl p-3"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-slate-200">Confirm Role Change</span>
        <button onClick={onCancel} className="text-slate-500 hover:text-slate-300">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      <p className="text-slate-400 text-[11px] mb-2 leading-relaxed">
        Change <span className="text-slate-200 font-medium">{targetName}</span> from{" "}
        <span className={`font-semibold px-1 rounded text-[10px] ${ROLE_COLORS[currentRole] ?? "bg-slate-700 text-slate-300"}`}>
          {ROLE_LABELS[currentRole] ?? currentRole}
        </span>{" "}
        →{" "}
        <span className={`font-semibold px-1 rounded text-[10px] ${ROLE_COLORS[newRole]}`}>
          {ROLE_LABELS[newRole]}
        </span>
      </p>
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        maxLength={512}
        placeholder="Reason (optional — logged in audit trail)"
        rows={2}
        className="w-full bg-slate-800 border border-slate-700 rounded text-xs text-slate-200 placeholder-slate-500 px-2 py-1.5 resize-none focus:outline-none focus:border-indigo-500 mb-2"
      />
      <div className="flex gap-2">
        <button
          onClick={() => onConfirm(reason.trim())}
          disabled={isPending}
          className="flex-1 flex items-center justify-center gap-1 bg-indigo-700 hover:bg-indigo-600 text-white text-[11px] font-semibold px-3 py-1.5 rounded transition-colors disabled:opacity-50"
        >
          <Check className="w-3 h-3" />
          {isPending ? "Saving…" : "Confirm"}
        </button>
        <button
          onClick={onCancel}
          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 text-[11px] rounded transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

/** Download an array of objects as a CSV file */
function downloadCsv(filename: string, rows: Record<string, unknown>[]) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    const s = v == null ? "" : String(v);
    return s.includes(",") || s.includes('"') || s.includes("\n")
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  };
  const csv = [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => escape(r[h])).join(",")),
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AdminUsers() {
  const { user, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [popover, setPopover] = useState<{ userId: number; newRole: RoleKey } | null>(null);
  const [showBulkImport, setShowBulkImport] = useState(false);

  const { data: userList, isLoading, refetch } = trpc.admin.listUsers.useQuery(undefined, {
    enabled: user?.role === "admin",
  });
  const { data: roleStats, refetch: refetchStats } = trpc.rbac.getRoleStatistics.useQuery(undefined, {
    enabled: user?.role === "admin",
  });
  const { data: auditLog, refetch: refetchAudit } = trpc.rbac.getRoleAuditLog.useQuery(
    { limit: 100 },
    { enabled: user?.role === "admin" }
  );

  const updateRole = trpc.rbac.updateUserRole.useMutation({
    onSuccess: (data) => {
      refetch();
      refetchStats();
      refetchAudit();
      setPopover(null);
      toast.success(
        `Role updated: ${ROLE_LABELS[data.oldRole] ?? data.oldRole} → ${ROLE_LABELS[data.newRole] ?? data.newRole}`
      );
      setUpdatingId(null);
    },
    onError: (err) => {
      toast.error(err.message ?? "Failed to update role");
      setPopover(null);
      setUpdatingId(null);
    },
  });

  const handleRoleChange = (userId: number, newRole: RoleKey, reason: string) => {
    setUpdatingId(userId);
    updateRole.mutate({ userId, newRole, reason: reason || undefined });
  };

  const quickPromote = (userId: number, role: "operator" | "admin") => {
    setUpdatingId(userId);
    updateRole.mutate({ userId, newRole: role });
  };

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
          <button onClick={() => navigate("/")} className="mt-4 text-indigo-400 text-sm hover:underline">
            Go home
          </button>
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
          <p className="text-slate-500 text-sm mt-1">
            Your current role is <span className="text-slate-300">{user.role}</span>.
          </p>
          <button onClick={() => navigate("/occ")} className="mt-4 text-indigo-400 text-sm hover:underline">
            Back to OCC
          </button>
        </div>
      </div>
    );
  }

  const pendingUsers = (userList ?? []).filter((u) => u.role === "user" && u.id !== user.id);

  return (
    <div
      className="min-h-screen bg-[#080c14] text-slate-200"
      style={{ fontFamily: "'Space Grotesk', sans-serif" }}
      onClick={() => setPopover(null)}
    >
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
            onClick={() => { refetch(); refetchStats(); refetchAudit(); }}
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
        {pendingUsers.length > 0 && (
          <div className="mb-6 bg-indigo-900/20 border border-indigo-700/40 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <UserCheck className="w-4 h-4 text-indigo-400" />
              <span className="text-indigo-300 text-sm font-semibold">
                {pendingUsers.length} team member{pendingUsers.length > 1 ? "s" : ""} with basic access
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {pendingUsers.map((u) => (
                <div key={u.id} className="flex items-center gap-2 bg-[#0f172a] border border-slate-700 rounded-lg px-3 py-2">
                  <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-300">
                    {(u.name ?? u.email ?? "?")[0].toUpperCase()}
                  </div>
                  <span className="text-slate-300 text-xs font-medium">
                    {u.name ?? u.email ?? `User #${u.id}`}
                  </span>
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

        {roleStats && (
          <div className="mb-6 grid grid-cols-5 gap-3">
            {[
              { label: "Total Users", value: roleStats.totalUsers, color: "text-slate-200", bg: "bg-slate-800/60 border-slate-700" },
              { label: "Admins", value: roleStats.admins, color: "text-red-300", bg: "bg-red-900/20 border-red-800/40" },
              { label: "Operators", value: roleStats.operators, color: "text-indigo-300", bg: "bg-indigo-900/20 border-indigo-800/40" },
              { label: "Moderators", value: (roleStats as any).moderators ?? 0, color: "text-amber-300", bg: "bg-amber-900/20 border-amber-800/40" },
              { label: "Users", value: roleStats.users, color: "text-slate-300", bg: "bg-slate-800/40 border-slate-700/60" },
            ].map(({ label, value, color, bg }) => (
              <div key={label} className={`rounded-lg border px-4 py-3 flex items-center justify-between ${bg}`}>
                <span className="text-slate-400 text-xs font-medium">{label}</span>
                <span className={`text-2xl font-bold ${color}`}>{value}</span>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { role: "user", desc: "Default role. Can register for events and view event rooms." },
            { role: "moderator", desc: "Can moderate Q&A queues and approve/reject attendee questions." },
            { role: "operator", desc: "Can access the OCC, create events, manage webcasts, and use all operator tools." },
            { role: "admin", desc: "Full access including User Management, seed data tools, and all operator capabilities." },
          ].map(({ role, desc }) => (
            <div key={role} className="bg-[#0f172a] border border-slate-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded ${ROLE_COLORS[role]}`}>
                  {ROLE_LABELS[role]}
                </span>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        <div className="bg-[#0f172a] border border-slate-800 rounded-lg overflow-hidden mb-8">
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
                  <tr
                    key={u.id}
                    className={`border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors ${
                      u.id === user.id ? "bg-indigo-900/10" : ""
                    }`}
                  >
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
                        {ROLE_LABELS[u.role ?? "user"] ?? u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {u.id === user.id ? (
                        <span className="text-slate-600 text-xs italic">Cannot change own role</span>
                      ) : (
                        <div className="relative flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          {(["user", "moderator", "operator", "admin"] as RoleKey[]).map((r) => (
                            <button
                              key={r}
                              disabled={u.role === r || updatingId === u.id}
                              onClick={() =>
                                setPopover(
                                  popover?.userId === u.id && popover?.newRole === r
                                    ? null
                                    : { userId: u.id, newRole: r }
                                )
                              }
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                                u.role === r
                                  ? ROLE_COLORS[r] + " opacity-60"
                                  : "bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200"
                              }`}
                            >
                              {updatingId === u.id && u.role !== r ? "…" : ROLE_LABELS[r]}
                            </button>
                          ))}
                          {popover?.userId === u.id && (
                            <RoleChangePopover
                              targetName={u.name ?? u.email ?? `User #${u.id}`}
                              currentRole={u.role ?? "user"}
                              newRole={popover.newRole}
                              onConfirm={(reason) => handleRoleChange(u.id, popover.newRole, reason)}
                              onCancel={() => setPopover(null)}
                              isPending={updatingId === u.id}
                            />
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="bg-[#0f172a] border border-slate-800 rounded-lg overflow-hidden mb-8">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-slate-400" />
              <span className="font-semibold text-sm">Role Change Audit Log</span>
              {auditLog && <span className="text-slate-500 text-xs">({auditLog.length} entries)</span>}
            </div>
            <div className="flex items-center gap-2">
              {auditLog && auditLog.length > 0 && (
                <button
                  onClick={() => {
                    const rows = auditLog.map((e) => ({
                      id: e.id,
                      user: e.userName,
                      user_email: e.userEmail,
                      old_role: e.oldRole,
                      new_role: e.newRole,
                      reason: e.reason ?? "",
                      changed_by: e.changedByName,
                      changed_by_email: e.changedByEmail,
                      timestamp: e.createdAt ? new Date(e.createdAt).toISOString() : "",
                    }));
                    downloadCsv(`role-audit-log-${new Date().toISOString().slice(0, 10)}.csv`, rows);
                    toast.success("Audit log exported as CSV");
                  }}
                  className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-900/30 hover:bg-emerald-800/50 text-emerald-400 border border-emerald-800/40 rounded text-xs font-medium transition-colors"
                >
                  <Download className="w-3 h-3" /> Export CSV
                </button>
              )}
              <button
                onClick={() => refetchAudit()}
                className="flex items-center gap-1 px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded text-xs transition-colors"
              >
                <RefreshCw className="w-3 h-3" />
              </button>
            </div>
          </div>

          {!auditLog || auditLog.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-sm">No role changes recorded yet.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500 text-xs uppercase tracking-wider">
                  <th className="text-left px-4 py-2.5 font-medium">User</th>
                  <th className="text-left px-4 py-2.5 font-medium">Change</th>
                  <th className="text-left px-4 py-2.5 font-medium">Changed By</th>
                  <th className="text-left px-4 py-2.5 font-medium">Reason</th>
                  <th className="text-left px-4 py-2.5 font-medium">When</th>
                </tr>
              </thead>
              <tbody>
                {auditLog.map((entry) => (
                  <tr key={entry.id} className="border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-200 text-xs">{entry.userName}</div>
                      <div className="text-slate-500 text-[10px]">{entry.userEmail}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${ROLE_COLORS[entry.oldRole] ?? "bg-slate-700 text-slate-300"}`}>
                          {ROLE_LABELS[entry.oldRole] ?? entry.oldRole}
                        </span>
                        <ArrowRight className="w-3 h-3 text-slate-500" />
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${ROLE_COLORS[entry.newRole] ?? "bg-slate-700 text-slate-300"}`}>
                          {ROLE_LABELS[entry.newRole] ?? entry.newRole}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-slate-300 text-xs">{entry.changedByName}</div>
                      <div className="text-slate-500 text-[10px]">{entry.changedByEmail}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs italic max-w-[180px] truncate" title={entry.reason ?? ""}>
                      {entry.reason ? entry.reason : <span className="text-slate-600">—</span>}
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">
                      {entry.createdAt ? new Date(entry.createdAt).toLocaleString() : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="mt-6 bg-amber-900/20 border border-amber-800/30 rounded-lg px-4 py-3 flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-amber-300 text-xs font-semibold mb-0.5">Role changes take effect immediately and are permanently logged</p>
            <p className="text-amber-400/70 text-xs">
              <strong>Moderator</strong> — can moderate Q&A queues and approve/reject questions. <strong>Operator</strong> — can access the OCC, create and manage events, and use all conference management tools. <strong>Admin</strong> — additionally grants access to this User Management page. Every role change is recorded in the audit log with the admin's name and an optional reason. Use <strong>Export CSV</strong> to download the full log for compliance evidence packages.
            </p>
          </div>
        </div>
        {showBulkImport && <BulkImportForm onImportComplete={() => { refetch(); refetchStats(); refetchAudit(); }} />}
      </div>
    </div>
  );
}
