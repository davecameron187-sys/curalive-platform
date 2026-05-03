import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  LayoutDashboard, Calendar, Users, FileText, CreditCard,
  Activity, Clock, TrendingUp, AlertTriangle, CheckCircle2,
  ChevronRight, ChevronLeft, ExternalLink, Eye, Send,
  Sun, Moon, Plus, Radio, RefreshCw, AlertCircle, Info
} from "lucide-react";

type Panel = "command" | "sessions" | "customers" | "reports" | "billing";

const PANELS: { id: Panel; label: string; icon: any }[] = [
  { id: "command", label: "Command", icon: LayoutDashboard },
  { id: "sessions", label: "Sessions", icon: Activity },
  { id: "customers", label: "Customers", icon: Users },
  { id: "reports", label: "Reports", icon: FileText },
  { id: "billing", label: "Billing", icon: CreditCard },
];

function formatCurrency(cents: number): string {
  return `R${(cents / 100).toLocaleString("en-ZA", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function formatDate(d: any): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d instanceof Date ? d : new Date(Number(d));
  if (isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
}

function formatTime(d: any): string {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d instanceof Date ? d : new Date(Number(d));
  if (isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" });
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; bg: string; fg: string }> = {
    live: { label: "Live", bg: "bg-green-100 dark:bg-green-900/30", fg: "text-green-700 dark:text-green-400" },
    scheduled: { label: "Scheduled", bg: "bg-blue-100 dark:bg-blue-900/30", fg: "text-blue-700 dark:text-blue-400" },
    closed: { label: "Processing", bg: "bg-amber-100 dark:bg-amber-900/30", fg: "text-amber-700 dark:text-amber-400" },
    completed: { label: "Complete", bg: "bg-gray-100 dark:bg-gray-800", fg: "text-gray-600 dark:text-gray-400" },
    complete: { label: "Complete", bg: "bg-gray-100 dark:bg-gray-800", fg: "text-gray-600 dark:text-gray-400" },
    report_pending: { label: "Report pending", bg: "bg-purple-100 dark:bg-purple-900/30", fg: "text-purple-700 dark:text-purple-400" },
    pending: { label: "Pending", bg: "bg-amber-100 dark:bg-amber-900/30", fg: "text-amber-700 dark:text-amber-400" },
    processing: { label: "Processing", bg: "bg-amber-100 dark:bg-amber-900/30", fg: "text-amber-700 dark:text-amber-400" },
    ready_to_send: { label: "Ready", bg: "bg-green-100 dark:bg-green-900/30", fg: "text-green-700 dark:text-green-400" },
    sent: { label: "Sent", bg: "bg-blue-100 dark:bg-blue-900/30", fg: "text-blue-700 dark:text-blue-400" },
    paid: { label: "Paid", bg: "bg-green-100 dark:bg-green-900/30", fg: "text-green-700 dark:text-green-400" },
    subscription: { label: "Subscription", bg: "bg-indigo-100 dark:bg-indigo-900/30", fg: "text-indigo-700 dark:text-indigo-400" },
    adhoc: { label: "Ad-hoc", bg: "bg-amber-100 dark:bg-amber-900/30", fg: "text-amber-700 dark:text-amber-400" },
    pilot: { label: "Pilot", bg: "bg-cyan-100 dark:bg-cyan-900/30", fg: "text-cyan-700 dark:text-cyan-400" },
    demo: { label: "Demo", bg: "bg-purple-100 dark:bg-purple-900/30", fg: "text-purple-700 dark:text-purple-400" },
  };
  const m = map[status] ?? { label: status, bg: "bg-gray-100 dark:bg-gray-800", fg: "text-gray-600 dark:text-gray-400" };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${m.bg} ${m.fg}`}>
      {m.label}
    </span>
  );
}

function DataIncomplete({ field }: { field: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 text-xs" title={`Setup required — ${field} missing`}>
      <AlertTriangle className="w-3 h-3" />
      <span className="hidden sm:inline">Setup required</span>
    </span>
  );
}

function KpiCard({ label, value, sub, icon: Icon }: { label: string; value: string | number; sub?: string; icon: any }) {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{label}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
          {sub && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{sub}</p>}
        </div>
        <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-800">
          <Icon className="w-5 h-5 text-gray-400" />
        </div>
      </div>
    </div>
  );
}

function elapsedStr(startedAt: any): string {
  if (!startedAt) return "—";
  const start = typeof startedAt === "number" ? startedAt : Number(startedAt);
  if (isNaN(start)) return "—";
  const diff = Date.now() - start;
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(mins / 60);
  if (hrs > 0) return `${hrs}h ${mins % 60}m`;
  return `${mins}m`;
}

function CommandPanel() {
  const summary = trpc.operatorDashboard.getDashboardSummary.useQuery(undefined, { refetchInterval: 60000 });
  const live = trpc.operatorDashboard.getLiveSession.useQuery(undefined, { refetchInterval: 60000 });
  const liveSessions = trpc.operatorDashboard.getLiveSessions.useQuery(undefined, { refetchInterval: 30000 });
  const upcoming = trpc.operatorDashboard.getUpcomingSessions.useQuery(undefined, { refetchInterval: 60000 });
  const attention = trpc.operatorDashboard.getAttentionItems.useQuery(undefined, { refetchInterval: 60000 });

  const [lastUpdated, setLastUpdated] = useState(new Date());
  useEffect(() => {
    if (summary.dataUpdatedAt) setLastUpdated(new Date(summary.dataUpdatedAt));
  }, [summary.dataUpdatedAt]);

  const liveSessionList = liveSessions.data ?? [];
  const primaryLiveSession = liveSessionList[0];
  const s = summary.data;
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-ZA", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{getGreeting()}, Dave</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {dateStr} · {liveSessions.data?.length ?? 0} live · {s?.pendingReportCount ?? 0} reports pending
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
          Last updated {lastUpdated.toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Live right now" value={liveSessions.data?.length ?? 0} icon={Activity} />
        <KpiCard label="Active customers" value={s?.customers?.active ?? 0} sub={`${s?.customers?.pilot ?? 0} pilot · ${s?.customers?.demo ?? 0} demo`} icon={Users} />
        <KpiCard label="Reports to send" value={s?.pendingReportCount ?? 0} icon={FileText} />
        <KpiCard label="Revenue this month" value={s ? formatCurrency(s.revenueThisMonth) : "—"} sub={s ? `Last month: ${formatCurrency(s.revenueLastMonth)}` : ""} icon={TrendingUp} />
      </div>
      {liveSessionList.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Live sessions</h3>
          </div>
          {liveSessionList.map((session: any) => (
            <div key={session.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{session.orgName}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{session.eventName}</p>
                </div>
                <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">{session.healthState}</span>
              </div>
              <div className="grid grid-cols-4 gap-2 mt-3">
                <div><p className="text-xs text-gray-400">Elapsed</p><p className="text-xs font-semibold text-gray-900 dark:text-white">{elapsedStr(session.startedAt)}</p></div>
                <div><p className="text-xs text-gray-400">Feed</p><p className="text-xs font-semibold text-gray-900 dark:text-white">{session.feedCount}</p></div>
                <div><p className="text-xs text-gray-400">Health</p><p className="text-xs font-semibold text-gray-900 dark:text-white">{session.healthState}</p></div>
                <div><p className="text-xs text-gray-400">Alerts</p><p className="text-xs font-semibold text-gray-900 dark:text-white">{session.alertCount}</p></div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4" /> Upcoming this week
          </h3>
          {upcoming.data?.length === 0 && (
            <p className="text-sm text-gray-400">No events scheduled this week.</p>
          )}
          {upcoming.data?.map((u: any) => (
            <div key={u.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{u.eventName}</p>
                <p className="text-xs text-gray-400">{u.orgName}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600 dark:text-gray-300">{formatDate(u.scheduledAt)}</p>
                <p className="text-xs text-gray-400">{formatTime(u.scheduledAt)}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> Needs attention
          </h3>
          {attention.data?.length === 0 && (
            <div className="border-l-4 border-green-400 bg-green-50 dark:bg-green-900/20 rounded-r-lg p-4">
              <p className="text-sm text-green-700 dark:text-green-400 font-medium">Nothing needs attention right now.</p>
            </div>
          )}
          {attention.data?.map((item: any) => (
            <div key={`${item.type}-${item.id}`} className="border-l-4 border-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-r-lg p-3 mb-2 last:mb-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white">{item.title}</p>
              <p className="text-xs text-gray-500">{item.subtitle}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SessionsPanel() {
  const [, navigate] = useLocation();
  const [page, setPage] = useState(1);
  const live = trpc.operatorDashboard.getLiveSession.useQuery();
  const sessions = trpc.operatorDashboard.getAllSessions.useQuery({ page });

  const endSessionMutation = trpc.shadowMode.endSession.useMutation({
    onSuccess: () => {
      toast.success("Session closed successfully");
      live.refetch();
      sessions.refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Sessions</h2>
          {sessions.dataUpdatedAt && (
            <p className="text-xs text-gray-400 mt-0.5">
              Last updated {new Date(sessions.dataUpdatedAt).toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" })}
            </p>
          )}
        </div>
        <button
          onClick={() => navigate("/shadow-mode")}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium rounded-lg hover:opacity-90"
        >
          <Plus className="w-4 h-4" /> New session
        </button>
      </div>

      {live.data && (
        <div className="bg-white dark:bg-gray-900 border-l-4 border-green-500 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="font-semibold text-green-700 dark:text-green-400 text-sm">LIVE</span>
            </div>
            <button
              onClick={() => endSessionMutation.mutate({ sessionId: live.data!.id })}
              disabled={endSessionMutation.isPending}
              className="px-3 py-1 text-xs font-medium bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 disabled:opacity-50"
            >
              Close session
            </button>
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">{live.data!.company}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">{live.data!.eventName}</p>
          <div className="grid grid-cols-4 gap-3 mt-3">
            <div><p className="text-xs text-gray-400">Elapsed</p><p className="text-sm font-semibold dark:text-white">{elapsedStr(live.data!.startedAt)}</p></div>
            <div><p className="text-xs text-gray-400">Segments</p><p className="text-sm font-semibold dark:text-white">{live.data.segmentCount}</p></div>
            <div><p className="text-xs text-gray-400">Commitments</p><p className="text-sm font-semibold dark:text-white">{live.data.commitmentCount}</p></div>
            <div><p className="text-xs text-gray-400">Flags</p><p className="text-sm font-semibold dark:text-white">{live.data.complianceFlagCount}</p></div>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {sessions.data?.sessions.map((s: any) => (
            <button
              key={s.id}
              onClick={() => navigate(`/?tab=shadow-mode&session=${s.id}`)}
              className="w-full flex items-center gap-4 px-5 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 text-left transition-colors"
            >
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${s.status === "live" ? "bg-green-400 animate-pulse" : s.status === "completed" || s.status === "complete" ? "bg-gray-400" : "bg-amber-400"}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{s.company ?? s.orgName ?? "—"}</p>
                <p className="text-xs text-gray-400 truncate">{s.eventName}</p>
              </div>
              <div className="hidden sm:block text-right">
                <p className="text-xs text-gray-500">{formatDate(s.createdAt)}</p>
              </div>
              <StatusBadge status={s.status} />
              <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
            </button>
          ))}
          {sessions.data?.sessions.length === 0 && (
            <div className="px-5 py-8 text-center text-gray-400 text-sm">No sessions yet.</div>
          )}
        </div>

        {sessions.data && sessions.data.totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 dark:border-gray-800">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs text-gray-400">
              Page {page} of {sessions.data.totalPages} · {sessions.data.total} total
            </span>
            <button
              onClick={() => setPage(p => Math.min(sessions.data!.totalPages, p + 1))}
              disabled={page === sessions.data.totalPages}
              className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function CustomersPanel() {
  const [tab, setTab] = useState<"active" | "demo" | "pilot">("active");
  const active = trpc.operatorDashboard.getCustomersByStage.useQuery({ stage: "active" });
  const demo = trpc.operatorDashboard.getCustomersByStage.useQuery({ stage: "demo" });
  const pilot = trpc.operatorDashboard.getCustomersByStage.useQuery({ stage: "pilot" });

  const dataMap = { active, demo, pilot };
  const data = dataMap[tab].data ?? [];

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white">Customers</h2>

      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
        {(["active", "demo", "pilot"] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${tab === t ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
          >
            {t === "active" ? "Active" : t === "demo" ? "Demo" : "Pilot"}
            <span className="ml-1.5 text-xs text-gray-400">({dataMap[t].data?.length ?? 0})</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.map((c: any) => (
          <div key={c.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                  {c.name?.split(" ").map((w: string) => w[0]).join("").slice(0, 2)}
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white">{c.name}</h4>
                  <StatusBadge status={c.billingType} />
                </div>
              </div>
            </div>

            {tab === "active" && (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Events run</span>
                  <span className="font-medium text-gray-900 dark:text-white">{c.eventsRun}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Last event</span>
                  <span className="text-gray-600 dark:text-gray-300">{formatDate(c.lastEvent)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Billing</span>
                  {c.billingType === "subscription" ? (
                    c.subscriptionAmount ? (
                      <span className="text-gray-600 dark:text-gray-300">R{c.subscriptionAmount?.toLocaleString()}/mo</span>
                    ) : (
                      <DataIncomplete field="subscription amount" />
                    )
                  ) : c.billingType === "adhoc" ? (
                    c.perEventPrice ? (
                      <span className="text-gray-600 dark:text-gray-300">R{c.perEventPrice?.toLocaleString()}/event</span>
                    ) : (
                      <DataIncomplete field="per-event price" />
                    )
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </div>
                {!c.irContactEmail && <DataIncomplete field="IR contact email" />}
                {!c.billingContactEmail && c.billingType !== "demo" && c.billingType !== "pilot" && (
                  <DataIncomplete field="billing contact email" />
                )}
              </div>
            )}

            {tab === "demo" && (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">IR contact</span>
                  <span className="text-gray-600 dark:text-gray-300">{c.irContactEmail ?? <DataIncomplete field="IR contact email" />}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Demo token</span>
                  {c.demoToken ? (
                    <span className="text-green-600 dark:text-green-400 text-xs font-medium">Ready</span>
                  ) : (
                    <span className="text-gray-400 text-xs flex items-center gap-1"><AlertTriangle className="w-3 h-3 text-amber-500" /> Not set</span>
                  )}
                </div>
                {c.followupDate && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Follow-up</span>
                    <span className="text-gray-600 dark:text-gray-300">{formatDate(c.followupDate)}</span>
                  </div>
                )}
              </div>
            )}

            {tab === "pilot" && (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Events used</span>
                  <span className="font-medium text-gray-900 dark:text-white">{c.pilotEventsUsed} of {c.pilotEventsTotal}</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-1">
                  <div
                    className="bg-cyan-500 h-1.5 rounded-full transition-all"
                    style={{ width: `${Math.min(100, (c.pilotEventsUsed / c.pilotEventsTotal) * 100)}%` }}
                  />
                </div>
                {c.pilotNotes && (
                  <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-xs text-gray-500 dark:text-gray-400 whitespace-pre-wrap">{c.pilotNotes}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        {data.length === 0 && (
          <div className="col-span-2 text-center py-8 text-gray-400 text-sm">No {tab} customers.</div>
        )}
      </div>
    </div>
  );
}

function ReportsPanel() {
  const pending = trpc.operatorDashboard.getReportsPending.useQuery();
  const [sentPage, setSentPage] = useState(1);
  const sent = trpc.operatorDashboard.getReportsSent.useQuery({ page: sentPage });

  const approveMutation = trpc.operatorDashboard.approveAndSendReport.useMutation({
    onSuccess: (data) => {
      if (data.alreadySent) {
        toast.info("Report was already sent.");
      } else if (data.success) {
        toast.success("Report approved and sent!");
      } else {
        toast.error(data.error ?? "Failed to send report.");
      }
      pending.refetch();
      sent.refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white">Reports</h2>

      <div>
        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Awaiting approval</h3>
        {pending.data?.length === 0 && (
          <p className="text-sm text-gray-400 py-4">No reports pending approval.</p>
        )}
        <div className="space-y-3">
          {pending.data?.map((r: any) => (
            <div key={r.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white">{r.clientName}</h4>
                  <p className="text-xs text-gray-500">{r.eventName} · {formatDate(r.createdAt)}</p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <span className="text-[10px] px-1.5 py-0.5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded font-medium">All modules complete</span>
                    {r.moduleKeys.slice(0, 3).map((k: string) => (
                      <span key={k} className="text-[10px] px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded">{k}</span>
                    ))}
                    {r.moduleKeys.length > 3 && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-400 rounded">+{r.moduleKeys.length - 3} more</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {r.reportToken ? (
                    <a
                      href={`/report/${r.reportToken}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100"
                    >
                      <Eye className="w-3 h-3" /> Preview
                    </a>
                  ) : (
                    <span className="text-[10px] text-amber-600 dark:text-amber-400 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> Token missing — cannot preview
                    </span>
                  )}
                  <button
                    onClick={() => approveMutation.mutate({ eventId: r.id })}
                    disabled={approveMutation.isPending}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    <Send className="w-3 h-3" /> Approve + Send
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Sent</h3>
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {sent.data?.reports.map((r: any) => (
              <div key={r.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{r.clientName}</p>
                  <p className="text-xs text-gray-400">{r.eventName}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-400">{formatDate(r.sentAt)}</span>
                  <StatusBadge status="sent" />
                </div>
              </div>
            ))}
            {sent.data?.reports.length === 0 && (
              <div className="px-5 py-8 text-center text-gray-400 text-sm">No sent reports yet.</div>
            )}
          </div>
          {sent.data && sent.data.totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 dark:border-gray-800">
              <button onClick={() => setSentPage(p => Math.max(1, p - 1))} disabled={sentPage === 1} className="p-1 rounded hover:bg-gray-100 disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
              <span className="text-xs text-gray-400">Page {sentPage} of {sent.data.totalPages}</span>
              <button onClick={() => setSentPage(p => Math.min(sent.data!.totalPages, p + 1))} disabled={sentPage === sent.data.totalPages} className="p-1 rounded hover:bg-gray-100 disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function BillingPanel() {
  const billing = trpc.operatorDashboard.getBillingSummary.useQuery();
  const b = billing.data;

  const subscriptionOrgs = b?.organisations.filter((o: any) => o.billingType === "subscription") ?? [];
  const otherOrgs = b?.organisations.filter((o: any) => o.billingType !== "subscription") ?? [];

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white">Billing</h2>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Revenue this month" value={b ? formatCurrency(b.revenueThisMonth) : "—"} icon={TrendingUp} />
        <KpiCard label="Last month" value={b ? formatCurrency(b.revenueLastMonth) : "—"} icon={CreditCard} />
        <KpiCard label="Invoices pending" value={b?.invoicesPending ?? 0} icon={Clock} />
        <KpiCard label="Events billed" value={b?.eventsBilled ?? 0} icon={FileText} />
      </div>

      {subscriptionOrgs.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Subscription</h3>
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {subscriptionOrgs.map((o: any) => (
                <div key={o.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{o.name}</p>
                    <StatusBadge status="subscription" />
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    {o.subscriptionAmount ? (
                      <span className="text-gray-600 dark:text-gray-300">R{o.subscriptionAmount.toLocaleString()}/mo</span>
                    ) : (
                      <DataIncomplete field="subscription amount" />
                    )}
                    {!o.billingContactEmail && <DataIncomplete field="billing contact email" />}
                    {o.latestInvoiceStatus && <StatusBadge status={o.latestInvoiceStatus} />}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div>
        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Ad-hoc, Pilot & Demo</h3>
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {otherOrgs.map((o: any) => (
              <div key={o.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{o.name}</p>
                  <StatusBadge status={o.billingType} />
                </div>
                <div className="flex items-center gap-4 text-sm">
                  {o.billingType === "adhoc" ? (
                    <>
                      {o.perEventPrice ? (
                        <span className="text-gray-600 dark:text-gray-300">R{o.perEventPrice.toLocaleString()}/event</span>
                      ) : (
                        <DataIncomplete field="per-event price" />
                      )}
                      {o.latestInvoiceStatus && <StatusBadge status={o.latestInvoiceStatus} />}
                    </>
                  ) : (
                    <>
                      <span className="text-gray-400">R0</span>
                      <StatusBadge status={o.billingType} />
                    </>
                  )}
                </div>
              </div>
            ))}
            {otherOrgs.length === 0 && (
              <div className="px-5 py-6 text-center text-gray-400 text-sm">No organisations.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OperatorDashboard() {
  const [panel, setPanel] = useState<Panel>("command");
  const [dark, setDark] = useState(() => document.documentElement.classList.contains("dark"));
  const [, navigate] = useLocation();

  const toggleDark = useCallback(() => {
    setDark(d => {
      const next = !d;
      document.documentElement.classList.toggle("dark", next);
      return next;
    });
  }, []);

  useEffect(() => {
    document.title = `CuraLive — ${PANELS.find(p => p.id === panel)?.label ?? "Command"}`;
  }, [panel]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors">
      <header className="h-14 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-4">
          <span className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">CuraLive</span>
        </div>

        <nav className="hidden md:flex items-center gap-1">
          {PANELS.map(p => {
            const Icon = p.icon;
            return (
              <button
                key={p.id}
                onClick={() => setPanel(p.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  panel === p.id
                    ? "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white"
                    : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                }`}
              >
                <Icon className="w-4 h-4" /> {p.label}
              </button>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate("/shadow-mode")}
            className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <Plus className="w-3.5 h-3.5" /> New session
          </button>
          <button
            onClick={() => navigate("/?tab=shadow-mode")}
            className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <Radio className="w-3.5 h-3.5" /> Open OCC
          </button>
          <button
            onClick={toggleDark}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400"
            title="Toggle dark mode"
          >
            {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold">
            D
          </div>
        </div>
      </header>

      <div className="md:hidden flex items-center gap-1 p-2 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 overflow-x-auto">
        {PANELS.map(p => {
          const Icon = p.icon;
          return (
            <button
              key={p.id}
              onClick={() => setPanel(p.id)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                panel === p.id
                  ? "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white"
                  : "text-gray-500"
              }`}
            >
              <Icon className="w-3.5 h-3.5" /> {p.label}
            </button>
          );
        })}
      </div>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {panel === "command" && <CommandPanel />}
        {panel === "sessions" && <SessionsPanel />}
        {panel === "customers" && <CustomersPanel />}
        {panel === "reports" && <ReportsPanel />}
        {panel === "billing" && <BillingPanel />}
      </main>
    </div>
  );
}
