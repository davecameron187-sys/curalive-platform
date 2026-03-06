/**
 * AgeingReport.tsx — Accounts Receivable Ageing Report
 * Route: /billing/ageing
 * Shows outstanding invoices bucketed by 0-30, 31-60, 61-90, 90+ days overdue.
 */
import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ChevronRight, Home, RefreshCw, Loader2, AlertTriangle,
  TrendingUp, Clock, AlertCircle, CheckCircle2, ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtCurrency(cents: number, currency = "ZAR"): string {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

function fmtDate(d: Date | string | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-ZA", { day: "2-digit", month: "short", year: "numeric" });
}

type Bucket = "current" | "1_30" | "31_60" | "61_90" | "over_90";

const BUCKETS: { key: Bucket; label: string; shortLabel: string; color: string; bgColor: string; borderColor: string }[] = [
  { key: "current",  label: "Current (Not Yet Due)",   shortLabel: "Current",  color: "text-emerald-400", bgColor: "bg-emerald-500/10", borderColor: "border-emerald-500/30" },
  { key: "1_30",     label: "1–30 Days Overdue",        shortLabel: "1–30d",    color: "text-amber-400",   bgColor: "bg-amber-500/10",   borderColor: "border-amber-500/30"   },
  { key: "31_60",    label: "31–60 Days Overdue",       shortLabel: "31–60d",   color: "text-orange-400",  bgColor: "bg-orange-500/10",  borderColor: "border-orange-500/30"  },
  { key: "61_90",    label: "61–90 Days Overdue",       shortLabel: "61–90d",   color: "text-red-400",     bgColor: "bg-red-500/10",     borderColor: "border-red-500/30"     },
  { key: "over_90",  label: "Over 90 Days Overdue",     shortLabel: ">90d",     color: "text-rose-400",    bgColor: "bg-rose-500/10",    borderColor: "border-rose-500/30"    },
];

function statusBadge(status: string) {
  const map: Record<string, string> = {
    unpaid:  "bg-amber-500/15 text-amber-400 border-amber-500/30",
    partial: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    overdue: "bg-red-500/15 text-red-400 border-red-500/30",
  };
  return map[status] ?? "bg-muted text-muted-foreground border-border";
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function AgeingReport() {
  const [, navigate] = useLocation();
  const [activeBucket, setActiveBucket] = useState<Bucket | "all">("all");

  const { data, isLoading, error, refetch, isFetching } = trpc.billing.getAgeingReport.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });

  const rows = data ?? [];

  // Compute bucket totals
  const bucketTotals = BUCKETS.map(b => ({
    ...b,
    count: rows.filter(r => r.bucket === b.key).length,
    total: rows.filter(r => r.bucket === b.key).reduce((s, r) => s + (r.outstanding ?? 0), 0),
  }));

  const grandTotal = rows.reduce((s, r) => s + (r.outstanding ?? 0), 0);

  const filtered = activeBucket === "all" ? rows : rows.filter(r => r.bucket === activeBucket);

  // Group by client for summary view
  const byClient = filtered.reduce<Record<string, { clientName: string; count: number; outstanding: number; currency: string }>>((acc, r) => {
    const key = String(r.clientId);
    if (!acc[key]) acc[key] = { clientName: r.clientName ?? "Unknown Client", count: 0, outstanding: 0, currency: r.currency ?? "ZAR" };
    acc[key].count++;
    acc[key].outstanding += r.outstanding ?? 0;
    return acc;
  }, {});

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <AlertTriangle className="w-10 h-10 text-red-400 mx-auto" />
          <p className="text-muted-foreground">Failed to load ageing report</p>
          <Button variant="outline" onClick={() => refetch()}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      {/* Header */}
      <header className="border-b border-border bg-card/30 backdrop-blur-sm sticky top-0 z-10">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <button onClick={() => navigate("/")} className="hover:text-foreground transition-colors">
              <Home className="w-4 h-4" />
            </button>
            <ChevronRight className="w-3.5 h-3.5" />
            <button onClick={() => navigate("/admin/billing")} className="hover:text-foreground transition-colors">
              Billing
            </button>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-foreground font-medium">Ageing Report</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs"
            onClick={() => { refetch(); toast.info("Refreshing ageing data…"); }}
            disabled={isFetching}
          >
            {isFetching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            Refresh
          </Button>
        </div>
      </header>

      <div className="container py-8 space-y-8">
        {/* Title */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Accounts Receivable Ageing</h1>
          <p className="text-sm text-muted-foreground mt-1" style={{ fontFamily: "'Inter', sans-serif" }}>
            Outstanding invoices as of {new Date().toLocaleDateString("en-ZA", { day: "2-digit", month: "long", year: "numeric" })}
          </p>
        </div>

        {/* Bucket Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {bucketTotals.map(b => (
            <button
              key={b.key}
              onClick={() => setActiveBucket(activeBucket === b.key ? "all" : b.key)}
              className={`text-left p-4 rounded-xl border transition-all ${
                activeBucket === b.key
                  ? `${b.bgColor} ${b.borderColor}`
                  : "bg-card border-border hover:border-primary/30"
              }`}
            >
              <div className={`text-xs font-semibold uppercase tracking-wider mb-2 ${b.color}`}>{b.shortLabel}</div>
              <div className="text-lg font-bold">{b.count}</div>
              <div className="text-xs text-muted-foreground mt-0.5" style={{ fontFamily: "'Inter', sans-serif" }}>
                {fmtCurrency(b.total)}
              </div>
            </button>
          ))}
        </div>

        {/* Grand Total Banner */}
        <div className="bg-card border border-border rounded-xl p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Total Outstanding</div>
              <div className="text-2xl font-bold">{fmtCurrency(grandTotal)}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-muted-foreground">{rows.length} invoice{rows.length !== 1 ? "s" : ""}</div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {Object.keys(byClient).length} client{Object.keys(byClient).length !== 1 ? "s" : ""}
            </div>
          </div>
        </div>

        {rows.length === 0 ? (
          <div className="text-center py-20">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">All Clear</h3>
            <p className="text-muted-foreground text-sm">No outstanding invoices. All accounts are settled.</p>
          </div>
        ) : (
          <>
            {/* Client Summary */}
            {Object.keys(byClient).length > 1 && (
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">By Client</h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {Object.values(byClient)
                    .sort((a, b) => b.outstanding - a.outstanding)
                    .map(c => (
                      <div key={c.clientName} className="bg-card border border-border rounded-xl p-4">
                        <div className="font-semibold text-sm mb-1">{c.clientName}</div>
                        <div className="text-xs text-muted-foreground mb-2">{c.count} invoice{c.count !== 1 ? "s" : ""}</div>
                        <div className="text-lg font-bold text-primary">{fmtCurrency(c.outstanding, c.currency)}</div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Invoice Detail Table */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Invoice Detail
                  {activeBucket !== "all" && (
                    <span className="ml-2 normal-case text-primary">
                      — {BUCKETS.find(b => b.key === activeBucket)?.label}
                    </span>
                  )}
                </h2>
                {activeBucket !== "all" && (
                  <button
                    onClick={() => setActiveBucket("all")}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Show all
                  </button>
                )}
              </div>

              <div className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/30">
                        <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Invoice</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Client</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Title</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Due Date</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Bucket</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Outstanding</th>
                        <th className="px-4 py-3"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filtered
                        .sort((a, b) => (b.daysOverdue ?? 0) - (a.daysOverdue ?? 0))
                        .map(inv => {
                          const bucket = BUCKETS.find(b => b.key === inv.bucket);
                          return (
                            <tr key={inv.id} className="hover:bg-card/60 transition-colors">
                              <td className="px-4 py-3 font-mono text-xs text-primary font-semibold">{inv.invoiceNumber}</td>
                              <td className="px-4 py-3 text-sm font-medium">{inv.clientName ?? "—"}</td>
                              <td className="px-4 py-3 text-sm text-muted-foreground max-w-[200px] truncate">{inv.title}</td>
                              <td className="px-4 py-3 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1.5">
                                  {inv.daysOverdue > 0 && <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />}
                                  {inv.daysOverdue <= 0 && <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
                                  {fmtDate(inv.dueAt)}
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <Badge className={`text-[10px] border ${statusBadge(inv.status)}`}>{inv.status}</Badge>
                              </td>
                              <td className="px-4 py-3">
                                <span className={`text-[10px] font-semibold uppercase tracking-wider ${bucket?.color ?? "text-muted-foreground"}`}>
                                  {inv.daysOverdue > 0 ? `${inv.daysOverdue}d overdue` : "Current"}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right font-semibold">
                                {fmtCurrency(inv.outstanding ?? 0, inv.currency)}
                              </td>
                              <td className="px-4 py-3">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0"
                                  title="View Invoice"
                                  onClick={() => navigate(`/admin/billing/invoice/${inv.id}`)}
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-border bg-muted/20">
                        <td colSpan={6} className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Total Outstanding
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-primary">
                          {fmtCurrency(filtered.reduce((s, r) => s + (r.outstanding ?? 0), 0))}
                        </td>
                        <td />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
