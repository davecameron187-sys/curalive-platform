/**
 * AdminPanel — Unified Admin Hub
 *
 * Wired to real backend:
 *   - trpc.admin.listUsers — live user list with role management
 *   - trpc.admin.updateUserRole — promote/demote users
 *   - trpc.billing.getClients — billing client count
 *   - trpc.billing.getBillingInvoices — invoice overview
 *
 * Quick-links to sub-pages: /admin/users, /admin/billing, /admin/clients
 */
import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Users, Settings, Search, AlertCircle,
  ChevronRight, Shield, DollarSign, FileText,
  RefreshCw, Loader2, UserCheck, Building2,
  BarChart3, Zap, Lock,
} from "lucide-react";

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-red-900/40 text-red-300 border border-red-800/40",
  operator: "bg-indigo-900/40 text-indigo-300 border border-indigo-800/40",
  user: "bg-slate-700/60 text-slate-300 border border-slate-600/40",
};

export default function AdminPanel() {
  const { user, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  // Real data from backend
  const { data: userList, isLoading: usersLoading, refetch: refetchUsers } = trpc.admin.listUsers.useQuery(
    undefined,
    { enabled: user?.role === "admin" }
  );

  const { data: billingClients } = trpc.billing.getClients.useQuery(
    undefined,
    { enabled: user?.role === "admin" }
  );

  const { data: invoices } = trpc.billing.getBillingInvoices.useQuery(
    { limit: 5 },
    { enabled: user?.role === "admin" }
  );

  const updateRole = trpc.admin.updateUserRole.useMutation({
    onSuccess: () => {
      refetchUsers();
      toast.success("Role updated successfully");
      setUpdatingId(null);
    },
    onError: (err) => {
      toast.error(err.message ?? "Failed to update role");
      setUpdatingId(null);
    },
  });

  // Auth guard
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#080c14] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen bg-[#080c14] flex items-center justify-center">
        <div className="text-center space-y-3">
          <Lock className="w-10 h-10 text-red-400 mx-auto" />
          <div className="text-white font-semibold">Admin Access Required</div>
          <div className="text-slate-400 text-sm">You need admin privileges to view this page.</div>
          <Button variant="outline" onClick={() => navigate("/")}>Go Home</Button>
        </div>
      </div>
    );
  }

  const filteredUsers = (userList ?? []).filter(u =>
    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalUsers = userList?.length ?? 0;
  const adminCount = userList?.filter(u => u.role === "admin").length ?? 0;
  const operatorCount = userList?.filter(u => u.role === "operator").length ?? 0;
  const clientCount = billingClients?.length ?? 0;
  const overdueInvoices = invoices?.filter((inv: any) => inv.status === "overdue").length ?? 0;

  return (
    <div className="min-h-screen bg-[#080c14] text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      {/* Header */}
      <header className="border-b border-white/8 bg-[#0d1117]/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
            <Shield className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">Admin Panel</h1>
            <p className="text-xs text-slate-400">Platform management & oversight</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => refetchUsers()} className="gap-2 text-xs">
            <RefreshCw className="w-3 h-3" /> Refresh
          </Button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6 space-y-6">

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-[#0d1117] border-white/8 p-4 cursor-pointer hover:border-indigo-500/30 transition-colors" onClick={() => navigate("/admin/users")}>
            <div className="flex items-center justify-between mb-2">
              <Users className="w-4 h-4 text-indigo-400" />
              <ChevronRight className="w-4 h-4 text-slate-600" />
            </div>
            <div className="text-2xl font-bold">{totalUsers}</div>
            <div className="text-xs text-slate-400 mt-1">Total Users</div>
            <div className="text-xs text-slate-500 mt-1">{adminCount} admin · {operatorCount} operator</div>
          </Card>

          <Card className="bg-[#0d1117] border-white/8 p-4 cursor-pointer hover:border-emerald-500/30 transition-colors" onClick={() => navigate("/admin/clients")}>
            <div className="flex items-center justify-between mb-2">
              <Building2 className="w-4 h-4 text-emerald-400" />
              <ChevronRight className="w-4 h-4 text-slate-600" />
            </div>
            <div className="text-2xl font-bold">{clientCount}</div>
            <div className="text-xs text-slate-400 mt-1">Billing Clients</div>
            <div className="text-xs text-slate-500 mt-1">Active accounts</div>
          </Card>

          <Card className="bg-[#0d1117] border-white/8 p-4 cursor-pointer hover:border-amber-500/30 transition-colors" onClick={() => navigate("/admin/billing")}>
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="w-4 h-4 text-amber-400" />
              <ChevronRight className="w-4 h-4 text-slate-600" />
            </div>
            <div className="text-2xl font-bold">{overdueInvoices}</div>
            <div className="text-xs text-slate-400 mt-1">Overdue Invoices</div>
            <div className="text-xs text-slate-500 mt-1">Requires attention</div>
          </Card>

          <Card className="bg-[#0d1117] border-white/8 p-4 cursor-pointer hover:border-violet-500/30 transition-colors" onClick={() => navigate("/admin/feature-flags")}>
            <div className="flex items-center justify-between mb-2">
              <Zap className="w-4 h-4 text-violet-400" />
              <ChevronRight className="w-4 h-4 text-slate-600" />
            </div>
            <div className="text-2xl font-bold">FF</div>
            <div className="text-xs text-slate-400 mt-1">Feature Flags</div>
            <div className="text-xs text-slate-500 mt-1">Manage toggles</div>
          </Card>
        </div>

        {/* Quick Navigation */}
        <div>
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Admin Modules</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { icon: Users, label: "User Management", desc: "Manage roles, access, and permissions", path: "/admin/users", color: "text-indigo-400", bg: "bg-indigo-500/10 border-indigo-500/20" },
              { icon: Building2, label: "Billing Clients", desc: "View and manage client accounts", path: "/admin/clients", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
              { icon: DollarSign, label: "Billing Dashboard", desc: "Quotes, invoices, and payments", path: "/admin/billing", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
              { icon: Zap, label: "Feature Flags", desc: "Toggle features per environment", path: "/admin/feature-flags", color: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/20" },
              { icon: BarChart3, label: "Analytics", desc: "Platform usage and metrics", path: "/analytics", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
              { icon: Settings, label: "Settings", desc: "System configuration", path: "/operator/preferences/default", color: "text-slate-400", bg: "bg-slate-500/10 border-slate-500/20" },
            ].map(({ icon: Icon, label, desc, path, color, bg }) => (
              <button
                key={path}
                onClick={() => navigate(path)}
                className={`flex items-start gap-3 p-4 rounded-xl border ${bg} text-left hover:opacity-80 transition-opacity`}
              >
                <Icon className={`w-5 h-5 ${color} mt-0.5 shrink-0`} />
                <div>
                  <div className="font-semibold text-sm text-white">{label}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{desc}</div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-600 ml-auto mt-0.5 shrink-0" />
              </button>
            ))}
          </div>
        </div>

        {/* Live User List */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Users</h2>
            <Button size="sm" variant="ghost" className="text-xs gap-1" onClick={() => navigate("/admin/users")}>
              Full Management <ChevronRight className="w-3 h-3" />
            </Button>
          </div>

          <div className="flex items-center gap-2 mb-3 max-w-sm">
            <Search className="w-4 h-4 text-slate-500 shrink-0" />
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-[#0d1117] border-white/10 text-sm h-8"
            />
          </div>

          <Card className="bg-[#0d1117] border-white/8 overflow-hidden">
            {usersLoading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                <Users className="w-8 h-8 mb-2 opacity-40" />
                <span className="text-sm">No users found</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/8 bg-white/2">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400">Name</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400">Email</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400">Role</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400">Last Seen</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.slice(0, 10).map((u) => (
                      <tr key={u.id} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                        <td className="px-4 py-3 text-sm font-medium">{u.name ?? "—"}</td>
                        <td className="px-4 py-3 text-sm text-slate-400">{u.email ?? "—"}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ROLE_COLORS[u.role] ?? ROLE_COLORS.user}`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500">
                          {u.lastSignedIn ? new Date(u.lastSignedIn).toLocaleDateString() : "Never"}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            {u.role !== "operator" && u.id !== user.id && (
                              <button
                                onClick={() => { setUpdatingId(u.id); updateRole.mutate({ userId: u.id, role: "operator" }); }}
                                disabled={updatingId === u.id}
                                className="text-xs text-indigo-400 hover:text-indigo-300 px-2 py-1 rounded border border-indigo-500/20 hover:bg-indigo-500/10 transition-colors disabled:opacity-50"
                              >
                                {updatingId === u.id ? <Loader2 className="w-3 h-3 animate-spin" /> : "→ Operator"}
                              </button>
                            )}
                            {u.role !== "admin" && u.id !== user.id && (
                              <button
                                onClick={() => { setUpdatingId(u.id); updateRole.mutate({ userId: u.id, role: "admin" }); }}
                                disabled={updatingId === u.id}
                                className="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded border border-red-500/20 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                              >
                                → Admin
                              </button>
                            )}
                            {u.id === user.id && (
                              <span className="text-xs text-slate-500 italic">You</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {filteredUsers.length > 10 && (
              <div className="px-4 py-3 border-t border-white/8 text-xs text-slate-400">
                Showing 10 of {filteredUsers.length} users.{" "}
                <button onClick={() => navigate("/admin/users")} className="text-indigo-400 hover:underline">
                  View all →
                </button>
              </div>
            )}
          </Card>
        </div>

        {/* Recent Invoices */}
        {invoices && invoices.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Recent Invoices</h2>
              <Button size="sm" variant="ghost" className="text-xs gap-1" onClick={() => navigate("/admin/billing")}>
                View All <ChevronRight className="w-3 h-3" />
              </Button>
            </div>
            <Card className="bg-[#0d1117] border-white/8 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/8 bg-white/2">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400">Invoice #</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400">Client</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400">Amount</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400">Due</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.slice(0, 5).map((inv: any) => (
                      <tr
                        key={inv.id}
                        className="border-b border-white/5 hover:bg-white/2 transition-colors cursor-pointer"
                        onClick={() => navigate(`/admin/billing/invoice/${inv.id}`)}
                      >
                        <td className="px-4 py-3 text-sm font-mono text-indigo-400">{inv.invoiceNumber}</td>
                        <td className="px-4 py-3 text-sm">{inv.clientName ?? "—"}</td>
                        <td className="px-4 py-3 text-sm font-semibold">
                          {inv.currency} {((inv.totalCents ?? 0) / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            inv.status === "paid" ? "bg-emerald-500/20 text-emerald-400" :
                            inv.status === "overdue" ? "bg-red-500/20 text-red-400" :
                            inv.status === "sent" ? "bg-amber-500/20 text-amber-400" :
                            "bg-slate-500/20 text-slate-400"
                          }`}>
                            {inv.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-400">
                          {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
