/**
 * AdminBilling.tsx — CuraLive Enterprise Billing Dashboard
 *
 * Tabs:
 *   1. Overview — KPI cards, quote pipeline kanban, recent activity
 *   2. Clients — client list with search/filter, add/edit client
 *   3. Quotes — all quotes with status filter, create new quote
 *   4. Invoices — invoice tracker with payment status, overdue alerts
 *   5. Ageing Report — AR ageing buckets (0-30, 31-60, 61-90, 90+)
 */
import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  LayoutDashboard, Users, FileText, Receipt, BarChart3,
  Plus, Search, RefreshCw, Download, AlertTriangle,
  TrendingUp, Clock, CheckCircle2, XCircle, ChevronRight,
  Building2, Mail, Phone, Globe, DollarSign, Calendar,
  ArrowUpRight, ArrowDownRight, Loader2, Eye, Edit3,
  Send, Copy, MoreHorizontal, Filter, Zap, ExternalLink,
} from "lucide-react";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatCurrency(cents: number, currency = "ZAR") {
  const amount = cents / 100;
  if (currency === "ZAR") return `R ${amount.toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (currency === "USD") return `$${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (currency === "EUR") return `€${amount.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return `${currency} ${amount.toFixed(2)}`;
}

function daysSince(date: Date | string | null | undefined): number {
  if (!date) return 0;
  return Math.floor((Date.now() - new Date(date).getTime()) / 86_400_000);
}

function daysUntil(date: Date | string | null | undefined): number {
  if (!date) return 0;
  return Math.floor((new Date(date).getTime() - Date.now()) / 86_400_000);
}

function statusColor(status: string) {
  const map: Record<string, string> = {
    draft: "bg-slate-500/20 text-slate-400 border-slate-500/30",
    sent: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    viewed: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
    accepted: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    declined: "bg-red-500/20 text-red-400 border-red-500/30",
    invoiced: "bg-violet-500/20 text-violet-400 border-violet-500/30",
    expired: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    unpaid: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    partial: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    paid: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    overdue: "bg-red-500/20 text-red-400 border-red-500/30",
    cancelled: "bg-slate-500/20 text-slate-400 border-slate-500/30",
    prospect: "bg-slate-500/20 text-slate-300 border-slate-500/30",
    active: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    inactive: "bg-slate-500/20 text-slate-400 border-slate-500/30",
  };
  return map[status] ?? "bg-slate-500/20 text-slate-400 border-slate-500/30";
}

// ─── KPI Card ────────────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, icon: Icon, trend, color = "text-primary" }: {
  label: string; value: string; sub?: string;
  icon: React.ElementType; trend?: "up" | "down" | "neutral"; color?: string;
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
      <div className={`text-2xl font-bold mb-1 ${color}`}>{value}</div>
      {sub && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          {trend === "up" && <ArrowUpRight className="w-3 h-3 text-emerald-400" />}
          {trend === "down" && <ArrowDownRight className="w-3 h-3 text-red-400" />}
          {sub}
        </div>
      )}
    </div>
  );
}

// ─── Pipeline Kanban ─────────────────────────────────────────────────────────

const KANBAN_COLS = [
  { key: "draft", label: "Draft", color: "border-slate-500/40" },
  { key: "sent", label: "Sent", color: "border-blue-500/40" },
  { key: "viewed", label: "Viewed", color: "border-cyan-500/40" },
  { key: "accepted", label: "Accepted", color: "border-emerald-500/40" },
  { key: "invoiced", label: "Invoiced", color: "border-violet-500/40" },
];

function KanbanCard({ quote, onView }: { quote: any; onView: (id: number) => void }) {
  return (
    <div
      className="bg-background border border-border rounded-lg p-3 cursor-pointer hover:border-primary/40 transition-all"
      onClick={() => onView(quote.id)}
    >
      <div className="flex items-start justify-between mb-2">
        <span className="text-[10px] font-mono text-muted-foreground">{quote.quoteNumber}</span>
        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${statusColor(quote.status)}`}>
          {quote.status}
        </span>
      </div>
      <div className="font-semibold text-sm mb-1 line-clamp-2">{quote.title}</div>
      <div className="text-xs text-muted-foreground mb-2">{quote.clientName ?? "—"}</div>
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-primary">{formatCurrency(quote.totalCents, quote.currency)}</span>
        {quote.expiresAt && (
          <span className={`text-[10px] ${daysUntil(quote.expiresAt) < 3 ? "text-red-400" : "text-muted-foreground"}`}>
            {daysUntil(quote.expiresAt) >= 0 ? `${daysUntil(quote.expiresAt)}d left` : "Expired"}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Ageing Buckets ──────────────────────────────────────────────────────────

function AgeingReport({ invoices }: { invoices: any[] }) {
  const buckets = useMemo(() => {
    const b = { current: 0, d30: 0, d60: 0, d90: 0, over90: 0 };
    for (const inv of invoices) {
      if (inv.status === "paid" || inv.status === "cancelled") continue;
      const outstanding = (inv.totalCents - (inv.paidCents ?? 0));
      if (outstanding <= 0) continue;
      const days = daysSince(inv.dueAt);
      if (days <= 0) b.current += outstanding;
      else if (days <= 30) b.d30 += outstanding;
      else if (days <= 60) b.d60 += outstanding;
      else if (days <= 90) b.d90 += outstanding;
      else b.over90 += outstanding;
    }
    return b;
  }, [invoices]);

  const total = Object.values(buckets).reduce((a, b) => a + b, 0);

  const rows = [
    { label: "Current (not yet due)", value: buckets.current, color: "bg-emerald-500" },
    { label: "1–30 days overdue", value: buckets.d30, color: "bg-amber-500" },
    { label: "31–60 days overdue", value: buckets.d60, color: "bg-orange-500" },
    { label: "61–90 days overdue", value: buckets.d90, color: "bg-red-500" },
    { label: "90+ days overdue", value: buckets.over90, color: "bg-red-700" },
  ];

  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <div key={row.label} className="flex items-center gap-4">
          <div className="w-48 text-sm text-muted-foreground shrink-0">{row.label}</div>
          <div className="flex-1 bg-border rounded-full h-2 overflow-hidden">
            <div
              className={`h-full ${row.color} rounded-full transition-all`}
              style={{ width: total > 0 ? `${(row.value / total) * 100}%` : "0%" }}
            />
          </div>
          <div className="w-36 text-right text-sm font-semibold">{formatCurrency(row.value)}</div>
          <div className="w-12 text-right text-xs text-muted-foreground">
            {total > 0 ? `${Math.round((row.value / total) * 100)}%` : "0%"}
          </div>
        </div>
      ))}
      <div className="flex items-center gap-4 pt-2 border-t border-border">
        <div className="w-48 text-sm font-semibold">Total Outstanding</div>
        <div className="flex-1" />
        <div className="w-36 text-right text-sm font-bold text-primary">{formatCurrency(total)}</div>
        <div className="w-12" />
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

type Tab = "overview" | "clients" | "quotes" | "invoices" | "ageing";

export default function AdminBilling() {
  const [, navigate] = useLocation();
  const { user, loading: authLoading } = useAuth();
  const [tab, setTab] = useState<Tab>("overview");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [refreshKey, setRefreshKey] = useState(0);

  // ── Queries ──
  const { data: clients, isLoading: clientsLoading, refetch: refetchClients } =
    trpc.billing.getClients.useQuery(undefined, { enabled: !!user });

  const { data: quotes, isLoading: quotesLoading, refetch: refetchQuotes } =
    trpc.billing.getQuotes.useQuery(undefined, { enabled: !!user });

  const { data: invoices, isLoading: invoicesLoading, refetch: refetchInvoices } =
    trpc.billing.getInvoices.useQuery(undefined, { enabled: !!user });

  const { data: fxRates } = trpc.billing.getFxRates.useQuery(undefined, { enabled: !!user });

  // ── Mutations ──
  const sendQuoteMutation = trpc.billing.sendQuote.useMutation({
    onSuccess: () => { toast.success("Quote sent to client"); refetchQuotes(); },
    onError: (e: { message: string }) => toast.error(e.message),
  });

  const convertToInvoiceMutation = trpc.billing.convertToInvoice.useMutation({
    onSuccess: (data: { invoiceNumber: string }) => {
      toast.success(`Invoice ${data.invoiceNumber} created`);
      refetchQuotes(); refetchInvoices();
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });

  const markOverdueMutation = trpc.billing.markOverdueInvoices.useMutation({
    onSuccess: (data: { count: number }) => { toast.success(`${data.count} invoice(s) marked overdue`); refetchInvoices(); },
    onError: (e: { message: string }) => toast.error(e.message),
  });

  // ── Derived data ──
  const filteredClients = useMemo(() => {
    if (!clients) return [];
    return clients.filter(c =>
      !search || c.companyName.toLowerCase().includes(search.toLowerCase()) ||
      c.contactEmail.toLowerCase().includes(search.toLowerCase())
    );
  }, [clients, search]);

  const filteredQuotes = useMemo(() => {
    if (!quotes) return [];
    return quotes.filter(q => {
      const matchSearch = !search || q.title.toLowerCase().includes(search.toLowerCase()) ||
        q.quoteNumber.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || q.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [quotes, search, statusFilter]);

  const filteredInvoices = useMemo(() => {
    if (!invoices) return [];
    return invoices.filter(inv => {
      const matchSearch = !search || inv.invoiceNumber.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || inv.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [invoices, search, statusFilter]);

  // ── KPIs ──
  const kpis = useMemo(() => {
    const totalQuotes = quotes?.length ?? 0;
    const acceptedQuotes = quotes?.filter(q => q.status === "accepted" || q.status === "invoiced").length ?? 0;
    const conversionRate = totalQuotes > 0 ? Math.round((acceptedQuotes / totalQuotes) * 100) : 0;
    const totalInvoiced = invoices?.reduce((s, i) => s + i.totalCents, 0) ?? 0;
    const totalPaid = invoices?.reduce((s, i) => s + (i.paidCents ?? 0), 0) ?? 0;
    const totalOutstanding = totalInvoiced - totalPaid;
    const overdueCount = invoices?.filter(i => i.status === "overdue").length ?? 0;
    const activeClients = clients?.filter(c => c.status === "active").length ?? 0;
    return { conversionRate, totalInvoiced, totalPaid, totalOutstanding, overdueCount, activeClients };
  }, [quotes, invoices, clients]);

  // ── Kanban data ──
  const kanbanData = useMemo(() => {
    const cols: Record<string, any[]> = { draft: [], sent: [], viewed: [], accepted: [], invoiced: [] };
    for (const q of (quotes ?? [])) {
      if (cols[q.status]) cols[q.status].push(q);
    }
    return cols;
  }, [quotes]);

  if (authLoading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: "overview", label: "Overview", icon: LayoutDashboard },
    { key: "clients", label: "Clients", icon: Users },
    { key: "quotes", label: "Quotes", icon: FileText },
    { key: "invoices", label: "Invoices", icon: Receipt },
    { key: "ageing", label: "Ageing Report", icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/")} className="text-muted-foreground hover:text-foreground transition-colors">
              <ChevronRight className="w-4 h-4 rotate-180" />
            </button>
            <div className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-primary" />
              <span className="font-bold text-lg">Billing</span>
            </div>
            {/* FX Rates Banner */}
            {fxRates && fxRates.length > 0 && (
              <div className="hidden md:flex items-center gap-3 ml-4 text-xs text-muted-foreground">
                {fxRates.map((r) => (
                  <span key={r.id} className="flex items-center gap-1">
                    <Globe className="w-3 h-3" />
                    {r.baseCurrency}/{r.targetCurrency}: {Number(r.rate).toFixed(4)}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => markOverdueMutation.mutate()}
              className="gap-1.5 text-xs"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              Check Overdue
            </Button>
            <Button
              size="sm"
              onClick={() => navigate("/admin/billing/quote/new")}
              className="gap-1.5 text-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              New Quote
            </Button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b border-border bg-card/30">
        <div className="container">
          <nav className="flex gap-0">
            {TABS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => { setTab(key); setSearch(""); setStatusFilter("all"); }}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  tab === key
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <div className="container py-6">

        {/* ── OVERVIEW ── */}
        {tab === "overview" && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <KpiCard label="Active Clients" value={String(kpis.activeClients)} icon={Users} color="text-blue-400" />
              <KpiCard label="Conversion Rate" value={`${kpis.conversionRate}%`} icon={TrendingUp} color="text-emerald-400" trend="up" sub="Quotes → Invoiced" />
              <KpiCard label="Total Invoiced" value={formatCurrency(kpis.totalInvoiced)} icon={Receipt} color="text-primary" />
              <KpiCard label="Total Collected" value={formatCurrency(kpis.totalPaid)} icon={CheckCircle2} color="text-emerald-400" trend="up" />
              <KpiCard label="Outstanding" value={formatCurrency(kpis.totalOutstanding)} icon={Clock} color="text-amber-400" />
              <KpiCard label="Overdue" value={String(kpis.overdueCount)} icon={AlertTriangle} color="text-red-400" sub="invoices" />
            </div>

            {/* Quote Pipeline Kanban */}
            <div>
              <h2 className="text-lg font-bold mb-4">Quote Pipeline</h2>
              {quotesLoading ? (
                <div className="flex items-center justify-center h-32"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
              ) : (
                <div className="grid grid-cols-5 gap-3">
                  {KANBAN_COLS.map(col => (
                    <div key={col.key} className={`border-t-2 ${col.color} pt-3`}>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{col.label}</span>
                        <span className="text-xs bg-border rounded-full px-1.5 py-0.5">{kanbanData[col.key]?.length ?? 0}</span>
                      </div>
                      <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                        {kanbanData[col.key]?.map(q => (
                          <KanbanCard key={q.id} quote={q} onView={() => navigate(`/admin/billing/quote/${q.id}`)} />
                        ))}
                        {(kanbanData[col.key]?.length ?? 0) === 0 && (
                          <div className="text-xs text-muted-foreground text-center py-4 border border-dashed border-border rounded-lg">
                            No quotes
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Invoices */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold">Recent Invoices</h2>
                <Button variant="ghost" size="sm" onClick={() => setTab("invoices")} className="text-xs gap-1">
                  View all <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </div>
              <div className="border border-border rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-card/50 border-b border-border">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Invoice</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Client</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Amount</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Due</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {(invoices ?? []).slice(0, 8).map(inv => (
                      <tr key={inv.id} className="hover:bg-card/40 transition-colors cursor-pointer" onClick={() => navigate(`/admin/billing/invoice/${inv.id}`)}>
                        <td className="px-4 py-3 font-mono text-xs text-primary">{inv.invoiceNumber}</td>
                        <td className="px-4 py-3 text-sm">{inv.clientName ?? "—"}</td>
                        <td className="px-4 py-3 text-right font-semibold">{formatCurrency(inv.totalCents, inv.currency)}</td>
                        <td className="px-4 py-3 text-right text-xs text-muted-foreground">
                          {inv.dueAt ? new Date(inv.dueAt).toLocaleDateString("en-ZA") : "—"}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${statusColor(inv.status)}`}>
                            {inv.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {(invoices ?? []).length === 0 && (
                      <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground text-sm">No invoices yet</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── CLIENTS ── */}
        {tab === "clients" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Clients</h2>
              <Button size="sm" onClick={() => navigate("/admin/billing/client/new")} className="gap-1.5 text-xs">
                <Plus className="w-3.5 h-3.5" /> Add Client
              </Button>
            </div>
            <div className="flex gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search clients..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-9 h-9 text-sm"
                />
              </div>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="h-9 px-3 rounded-md border border-border bg-card text-sm text-foreground"
              >
                <option value="all">All statuses</option>
                <option value="active">Active</option>
                <option value="prospect">Prospect</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            {clientsLoading ? (
              <div className="flex items-center justify-center h-32"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
            ) : (
              <div className="border border-border rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-card/50 border-b border-border">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Company</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Contact</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Currency</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Terms</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredClients.map(c => (
                      <tr key={c.id} className="hover:bg-card/40 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-semibold">{c.companyName}</div>
                          {c.vatNumber && <div className="text-xs text-muted-foreground">VAT: {c.vatNumber}</div>}
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm">{c.contactName}</div>
                          <div className="text-xs text-muted-foreground">{c.contactEmail}</div>
                        </td>
                        <td className="px-4 py-3 text-sm">{c.currency}</td>
                        <td className="px-4 py-3 text-sm">{c.paymentTermsDays} days</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${statusColor(c.status)}`}>
                            {c.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => navigate(`/admin/billing/client/${c.id}`)}>
                              <Eye className="w-3.5 h-3.5" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => navigate(`/admin/billing/quote/new?clientId=${c.id}`)}>
                              <Plus className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredClients.length === 0 && (
                      <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground text-sm">No clients found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── QUOTES ── */}
        {tab === "quotes" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Quotes</h2>
              <Button size="sm" onClick={() => navigate("/admin/billing/quote/new")} className="gap-1.5 text-xs">
                <Plus className="w-3.5 h-3.5" /> New Quote
              </Button>
            </div>
            <div className="flex gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search quotes..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-9 h-9 text-sm"
                />
              </div>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="h-9 px-3 rounded-md border border-border bg-card text-sm text-foreground"
              >
                <option value="all">All statuses</option>
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="viewed">Viewed</option>
                <option value="accepted">Accepted</option>
                <option value="declined">Declined</option>
                <option value="invoiced">Invoiced</option>
                <option value="expired">Expired</option>
              </select>
            </div>
            {quotesLoading ? (
              <div className="flex items-center justify-center h-32"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
            ) : (
              <div className="border border-border rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-card/50 border-b border-border">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Quote #</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Title</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Client</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Expires</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredQuotes.map(q => (
                      <tr key={q.id} className="hover:bg-card/40 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs text-primary">{q.quoteNumber}</td>
                        <td className="px-4 py-3 font-medium max-w-xs truncate">{q.title}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{q.clientName ?? "—"}</td>
                        <td className="px-4 py-3 text-right font-semibold">{formatCurrency(q.totalCents, q.currency)}</td>
                        <td className="px-4 py-3 text-right text-xs text-muted-foreground">
                          {q.expiresAt ? new Date(q.expiresAt).toLocaleDateString("en-ZA") : "—"}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${statusColor(q.status)}`}>
                            {q.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title="View" onClick={() => navigate(`/admin/billing/quote/${q.id}`)}>
                              <Eye className="w-3.5 h-3.5" />
                            </Button>
                            {q.status === "draft" && (
                              <Button
                                variant="ghost" size="sm" className="h-7 w-7 p-0 text-blue-400" title="Send"
                                onClick={() => sendQuoteMutation.mutate({ id: q.id, recipientEmail: q.contactEmail ?? "", recipientName: q.clientName ?? "", origin: window.location.origin })}
                                disabled={sendQuoteMutation.isPending}
                              >
                                <Send className="w-3.5 h-3.5" />
                              </Button>
                            )}
                            {(q.status === "accepted") && (
                              <Button
                                variant="ghost" size="sm" className="h-7 px-2 text-xs text-violet-400" title="Convert to Invoice"
                                onClick={() => convertToInvoiceMutation.mutate({ quoteId: q.id })}
                                disabled={convertToInvoiceMutation.isPending}
                              >
                                <Receipt className="w-3.5 h-3.5 mr-1" /> Invoice
                              </Button>
                            )}
                            {q.accessToken && (
                              <Button
                                variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground" title="Copy client link"
                                onClick={() => {
                                  navigator.clipboard.writeText(`${window.location.origin}/quote/${q.accessToken}`);
                                  toast.success("Client link copied");
                                }}
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredQuotes.length === 0 && (
                      <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground text-sm">No quotes found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── INVOICES ── */}
        {tab === "invoices" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Invoices</h2>
              <div className="flex gap-2">
                <Button
                  variant="outline" size="sm"
                  onClick={() => markOverdueMutation.mutate()}
                  disabled={markOverdueMutation.isPending}
                  className="gap-1.5 text-xs"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  Mark Overdue
                </Button>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search invoices..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-9 h-9 text-sm"
                />
              </div>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="h-9 px-3 rounded-md border border-border bg-card text-sm text-foreground"
              >
                <option value="all">All statuses</option>
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="unpaid">Unpaid</option>
                <option value="partial">Partial</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            {invoicesLoading ? (
              <div className="flex items-center justify-center h-32"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
            ) : (
              <div className="border border-border rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-card/50 border-b border-border">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Invoice #</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Client</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Paid</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Outstanding</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Due Date</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredInvoices.map(inv => {
                      const outstanding = inv.totalCents - (inv.paidCents ?? 0);
                      const isOverdue = inv.status === "overdue";
                      return (
                        <tr key={inv.id} className={`hover:bg-card/40 transition-colors ${isOverdue ? "bg-red-500/5" : ""}`}>
                          <td className="px-4 py-3">
                            <div className="font-mono text-xs text-primary">{inv.invoiceNumber}</div>
                            {isOverdue && (
                              <div className="text-[10px] text-red-400 flex items-center gap-0.5 mt-0.5">
                                <AlertTriangle className="w-2.5 h-2.5" /> {daysSince(inv.dueAt)}d overdue
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm">{inv.clientName ?? "—"}</td>
                          <td className="px-4 py-3 text-right font-semibold">{formatCurrency(inv.totalCents, inv.currency)}</td>
                          <td className="px-4 py-3 text-right text-emerald-400">{formatCurrency(inv.paidCents ?? 0, inv.currency)}</td>
                          <td className={`px-4 py-3 text-right font-semibold ${outstanding > 0 ? "text-amber-400" : "text-muted-foreground"}`}>
                            {formatCurrency(outstanding, inv.currency)}
                          </td>
                          <td className="px-4 py-3 text-right text-xs text-muted-foreground">
                            {inv.dueAt ? new Date(inv.dueAt).toLocaleDateString("en-ZA") : "—"}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${statusColor(inv.status)}`}>
                              {inv.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => navigate(`/admin/billing/invoice/${inv.id}`)}>
                                <Eye className="w-3.5 h-3.5" />
                              </Button>
                              {inv.accessToken && (
                                <Button
                                  variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground" title="Copy client link"
                                  onClick={() => {
                                    navigator.clipboard.writeText(`${window.location.origin}/invoice/${inv.accessToken}`);
                                    toast.success("Invoice link copied");
                                  }}
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredInvoices.length === 0 && (
                      <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground text-sm">No invoices found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── AGEING REPORT ── */}
        {tab === "ageing" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Accounts Receivable Ageing Report</h2>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => navigate("/billing/ageing")}>
                  <ExternalLink className="w-3.5 h-3.5" /> Full Report
                </Button>
                <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => refetchInvoices()}>
                  <RefreshCw className="w-3.5 h-3.5" /> Refresh
                </Button>
              </div>
            </div>
            {invoicesLoading ? (
              <div className="flex items-center justify-center h-32"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
            ) : (
              <>
                <div className="bg-card border border-border rounded-xl p-6">
                  <AgeingReport invoices={invoices ?? []} />
                </div>

                {/* Per-client ageing breakdown */}
                <div>
                  <h3 className="text-base font-semibold mb-3">By Client</h3>
                  <div className="border border-border rounded-xl overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-card/50 border-b border-border">
                        <tr>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Client</th>
                          <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Current</th>
                          <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">1–30d</th>
                          <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">31–60d</th>
                          <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">61–90d</th>
                          <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">90+d</th>
                          <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {(() => {
                          const byClient: Record<string, { name: string; current: number; d30: number; d60: number; d90: number; over90: number }> = {};
                          for (const inv of (invoices ?? [])) {
                            if (inv.status === "paid" || inv.status === "cancelled") continue;
                            const outstanding = inv.totalCents - (inv.paidCents ?? 0);
                            if (outstanding <= 0) continue;
                            const name = inv.clientName ?? "Unknown";
                            if (!byClient[name]) byClient[name] = { name, current: 0, d30: 0, d60: 0, d90: 0, over90: 0 };
                            const days = daysSince(inv.dueAt);
                            if (days <= 0) byClient[name].current += outstanding;
                            else if (days <= 30) byClient[name].d30 += outstanding;
                            else if (days <= 60) byClient[name].d60 += outstanding;
                            else if (days <= 90) byClient[name].d90 += outstanding;
                            else byClient[name].over90 += outstanding;
                          }
                          const rows = Object.values(byClient);
                          if (rows.length === 0) return (
                            <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground text-sm">No outstanding balances</td></tr>
                          );
                          return rows.map((r: any) => {
                            const total = r.current + r.d30 + r.d60 + r.d90 + r.over90;
                            return (
                              <tr key={r.name} className="hover:bg-card/40 transition-colors">
                                <td className="px-4 py-3 font-medium">{r.name}</td>
                                <td className="px-4 py-3 text-right text-emerald-400">{r.current > 0 ? formatCurrency(r.current) : "—"}</td>
                                <td className="px-4 py-3 text-right text-amber-400">{r.d30 > 0 ? formatCurrency(r.d30) : "—"}</td>
                                <td className="px-4 py-3 text-right text-orange-400">{r.d60 > 0 ? formatCurrency(r.d60) : "—"}</td>
                                <td className="px-4 py-3 text-right text-red-400">{r.d90 > 0 ? formatCurrency(r.d90) : "—"}</td>
                                <td className="px-4 py-3 text-right text-red-600 font-semibold">{r.over90 > 0 ? formatCurrency(r.over90) : "—"}</td>
                                <td className="px-4 py-3 text-right font-bold">{formatCurrency(total)}</td>
                              </tr>
                            );
                          });
                        })()}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
