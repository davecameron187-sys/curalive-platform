// @ts-nocheck
import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import {
  Radio, Handshake, Settings, LayoutDashboard,
  Activity, Shield, Users, CheckCircle2, AlertTriangle, Clock,
  Loader2, Play, BarChart3, Globe, Zap, TrendingUp,
  Building2, LogIn, LogOut, User, Phone, Video,
  Mic, FileText, MessageSquare, Brain, Heart,
  Monitor, Wifi, Database, Receipt, CalendarDays, Mail, Tv,
} from "lucide-react";

import ShadowMode from "./ShadowMode";

import BastionPartner from "./BastionPartner";
import LumiPartner from "./LumiPartner";
import AdminBilling from "./AdminBilling";
import { lazy, Suspense } from "react";

const WebcastingHub = lazy(() => import("./WebcastingHub"));
const OperatorDashboard = lazy(() => import("./OperatorDashboard"));
const EventCalendar = lazy(() => import("./EventCalendar"));
const MailingListManager = lazy(() => import("./MailingListManager"));

type DashboardTab = "shadow-mode" | "operator-dashboard" | "billing" | "settings";

const TAB_CONFIG: { id: DashboardTab; label: string; icon: React.ElementType; color: string; activeColor: string }[] = [
  { id: "shadow-mode", label: "Shadow Mode", icon: Radio, color: "text-slate-500 hover:text-slate-300", activeColor: "border-emerald-400 text-emerald-300" },

  { id: "operator-dashboard", label: "Command Centre", icon: LayoutDashboard, color: "text-slate-500 hover:text-slate-300", activeColor: "border-blue-400 text-blue-300" },
  { id: "billing", label: "Billing", icon: Receipt, color: "text-slate-500 hover:text-slate-300", activeColor: "border-green-400 text-green-300" },
  { id: "settings", label: "Settings", icon: Settings, color: "text-slate-500 hover:text-slate-300", activeColor: "border-slate-400 text-slate-300" },
];

const SERVICE_META: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  database: { label: "Database", icon: Database, color: "text-blue-400" },
  twilio: { label: "Twilio (Telephony)", icon: Phone, color: "text-green-400" },
  openai: { label: "OpenAI (AI Engine)", icon: Brain, color: "text-purple-400" },
  ably: { label: "Ably (Real-time)", icon: Radio, color: "text-orange-400" },
  recall: { label: "Recall.ai (Bots)", icon: Video, color: "text-cyan-400" },
  active_events: { label: "Active Events", icon: CalendarDays, color: "text-yellow-400" },
};

function LiveHealthPanel({ healthStatus, onClose }: { healthStatus: any; onClose: () => void }) {
  const runCheck = trpc.healthGuardian.runCheck.useMutation();
  const incidents = trpc.healthGuardian.incidents.useQuery({ limit: 5 });
  const utils = trpc.useUtils();

  const results = healthStatus?.results ?? [];
  const overall = healthStatus?.overall;
  const score = overall?.score ?? 0;
  const status = overall?.status ?? "unknown";

  const handleRunCheck = async () => {
    try {
      await runCheck.mutateAsync();
      utils.healthGuardian.currentStatus.invalidate();
      utils.healthGuardian.incidents.invalidate();
    } catch {}
  };

  const statusColor = status === "healthy" ? "text-emerald-400" : status === "degraded" ? "text-amber-400" : "text-red-400";
  const statusBg = status === "healthy" ? "bg-emerald-500/10 border-emerald-500/30" : status === "degraded" ? "bg-amber-500/10 border-amber-500/30" : "bg-red-500/10 border-red-500/30";
  const statusDot = status === "healthy" ? "bg-emerald-400" : status === "degraded" ? "bg-amber-400" : "bg-red-400";

  return (
    <div className="bg-white/[0.03] border border-white/10 rounded-xl p-6 mb-8 animate-in slide-in-from-top-2 duration-300">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg ${statusBg} flex items-center justify-center`}>
            <Activity className={`w-5 h-5 ${statusColor}`} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Live System Status</h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`w-2 h-2 rounded-full ${statusDot} animate-pulse`} />
              <span className={`text-xs font-medium ${statusColor}`}>{status.toUpperCase()} — {score}%</span>
              <span className="text-xs text-slate-600">Auto-refreshes every 30s</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleRunCheck} disabled={runCheck.isPending}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-white/[0.05] border border-white/10 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors">
            {runCheck.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Activity className="w-3.5 h-3.5" />}
            Run Check
          </button>
          <button onClick={onClose}
            className="flex items-center gap-1 px-3 py-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors">
            Close
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-5">
        {results.map((result: any) => {
          const meta = SERVICE_META[result.service] || { label: result.service, icon: Activity, color: "text-slate-400" };
          const Icon = meta.icon;
          const sColor = result.status === "healthy" ? "text-emerald-400" : result.status === "degraded" ? "text-amber-400" : "text-red-400";
          const sBg = result.status === "healthy" ? "bg-emerald-500/10 border-emerald-500/20" : result.status === "degraded" ? "bg-amber-500/10 border-amber-500/20" : "bg-red-500/10 border-red-500/20";
          const sDot = result.status === "healthy" ? "bg-emerald-400" : result.status === "degraded" ? "bg-amber-400" : "bg-red-400";
          return (
            <div key={result.service} className={`rounded-lg border ${sBg} p-3`}>
              <div className="flex items-center gap-2 mb-2">
                <Icon className={`w-4 h-4 ${meta.color}`} />
                <span className="text-xs font-medium text-white truncate">{meta.label}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${sDot} ${result.status !== "healthy" ? "animate-pulse" : ""}`} />
                  <span className={`text-[10px] font-medium ${sColor}`}>{result.status.toUpperCase()}</span>
                </div>
                <span className="text-[10px] text-slate-600">{result.latencyMs}ms</span>
              </div>
              {result.details?.error && (
                <p className="text-[10px] text-red-400/70 mt-1.5 truncate">{result.details.error}</p>
              )}
            </div>
          );
        })}
      </div>

      {incidents.data && incidents.data.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Recent Incidents</h4>
          <div className="space-y-2">
            {incidents.data.slice(0, 3).map((incident: any) => {
              const isActive = incident.status === "active";
              const sevColor = incident.severity === "critical" ? "text-red-400 bg-red-500/10 border-red-500/30" : "text-amber-400 bg-amber-500/10 border-amber-500/30";
              return (
                <div key={incident.id} className={`flex items-center gap-3 p-3 rounded-lg border ${isActive ? "border-red-500/20 bg-red-500/5" : "border-white/5 bg-white/[0.02]"}`}>
                  {isActive ? <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" /> : <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-white truncate">{incident.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${sevColor}`}>{incident.severity}</span>
                      <span className="text-[10px] text-slate-600">{SERVICE_META[incident.service]?.label || incident.service}</span>
                    </div>
                  </div>
                  <span className={`text-[10px] font-medium ${isActive ? "text-red-400" : "text-emerald-400"}`}>
                    {isActive ? "ACTIVE" : "RESOLVED"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function OverviewTab() {
  const [, navigate] = useLocation();
  const [showHealthPanel, setShowHealthPanel] = useState(false);
  const { data: healthStatus } = trpc.healthGuardian.currentStatus.useQuery(undefined, {
    refetchInterval: 30000,
    retry: false,
  });
  const sessions = trpc.shadowMode.listSessions.useQuery(undefined, { refetchInterval: 10000 });

  const score = healthStatus?.overall?.score ?? null;
  const liveSessions = sessions.data?.filter((s: any) => s.status === "live" || s.status === "bot_joining") ?? [];
  const completedSessions = sessions.data?.filter((s: any) => s.status === "completed") ?? [];
  const totalSessions = sessions.data?.length ?? 0;

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-1">Operator Dashboard</h2>
        <p className="text-sm text-slate-500">Real-time platform overview and quick actions</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <button onClick={() => setShowHealthPanel(!showHealthPanel)}
          className={`bg-white/[0.03] border rounded-xl p-5 text-left transition-all hover:bg-white/[0.06] ${showHealthPanel ? "border-emerald-500/30 ring-1 ring-emerald-500/20" : "border-white/10"}`}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <Activity className={`w-5 h-5 text-emerald-400 ${showHealthPanel ? "animate-pulse" : ""}`} />
            </div>
            <div>
              <div className="text-xs text-slate-500 uppercase tracking-wider">System Health</div>
              <div className={`text-2xl font-bold ${score !== null && score >= 90 ? "text-emerald-400" : score !== null && score >= 70 ? "text-amber-400" : "text-red-400"}`}>
                {score !== null ? `${score}%` : "—"}
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-600">
              {score !== null && score >= 90 ? "All systems operational" : score !== null && score >= 70 ? "Minor degradation detected" : score !== null ? "Issues detected" : "Loading..."}
            </span>
            <span className="text-[10px] text-slate-600">{showHealthPanel ? "▲" : "▼"} Live view</span>
          </div>
        </button>

        <div className="bg-white/[0.03] border border-white/10 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
              <Radio className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <div className="text-xs text-slate-500 uppercase tracking-wider">Live Now</div>
              <div className="text-2xl font-bold text-white">{liveSessions.length}</div>
            </div>
          </div>
          <div className="text-xs text-slate-600">
            {liveSessions.length > 0 ? `${liveSessions.map((s: any) => s.eventName).join(", ")}` : "No active sessions"}
          </div>
        </div>

        <div className="bg-white/[0.03] border border-white/10 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center">
              <Database className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <div className="text-xs text-slate-500 uppercase tracking-wider">Total Sessions</div>
              <div className="text-2xl font-bold text-white">{totalSessions}</div>
            </div>
          </div>
          <div className="text-xs text-slate-600">{completedSessions.length} completed</div>
        </div>

        <div className="bg-white/[0.03] border border-white/10 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <div className="text-xs text-slate-500 uppercase tracking-wider">AI Modules</div>
              <div className="text-2xl font-bold text-white">20</div>
            </div>
          </div>
          <div className="text-xs text-slate-600">All modules active</div>
        </div>
      </div>

      {showHealthPanel && healthStatus && (
        <LiveHealthPanel healthStatus={healthStatus} onClose={() => setShowHealthPanel(false)} />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white/[0.03] border border-white/10 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            Quick Actions
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "New Live Event", desc: "Join a meeting silently", icon: Play, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20", tab: "shadow-mode" as DashboardTab },
              { label: "Upload Recording", desc: "Process archive audio", icon: Mic, color: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/20", tab: "shadow-mode" as DashboardTab },

              { label: "Events Hub", desc: "Webcasting, calendar & mail", icon: CalendarDays, color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/20", tab: "events" as DashboardTab },
              { label: "Intelligence Suite", desc: "5 advanced AI algorithms", icon: Brain, color: "text-pink-400", bg: "bg-pink-500/10 border-pink-500/20", href: "/intelligence-suite" },
              { label: "Billing", desc: "Quotes, invoices & clients", icon: Receipt, color: "text-green-400", bg: "bg-green-500/10 border-green-500/20", tab: "billing" as DashboardTab },
            ].map(({ label, desc, icon: Icon, color, bg, tab, href }: any) => (
              <button key={label} onClick={() => {
                if (href) {
                  navigate(href);
                } else {
                  const event = new CustomEvent("dashboard-navigate", { detail: { tab } });
                  window.dispatchEvent(event);
                }
              }}
                className={`text-left p-4 rounded-xl border ${bg} hover:scale-[1.02] transition-transform`}>
                <Icon className={`w-5 h-5 ${color} mb-2`} />
                <div className="text-sm font-medium text-white">{label}</div>
                <div className="text-xs text-slate-500 mt-0.5">{desc}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white/[0.03] border border-white/10 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" />
            Recent Sessions
          </h3>
          {sessions.isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 text-slate-500 animate-spin" />
            </div>
          ) : sessions.data && sessions.data.length > 0 ? (
            <div className="space-y-2">
              {sessions.data.slice(0, 5).map((session: any) => {
                const statusColors: Record<string, string> = {
                  live: "text-emerald-400 bg-emerald-400/10",
                  bot_joining: "text-amber-400 bg-amber-400/10",
                  completed: "text-violet-400 bg-violet-400/10",
                  failed: "text-red-400 bg-red-400/10",
                  pending: "text-slate-400 bg-slate-400/10",
                  processing: "text-blue-400 bg-blue-400/10",
                };
                return (
                  <div key={session.id} className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/5">
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-slate-200 truncate">{session.eventName}</div>
                      <div className="text-xs text-slate-600">{session.clientName}</div>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[session.status] ?? statusColors.pending}`}>
                      {session.status}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-sm text-slate-600">No sessions yet</div>
          )}
        </div>
      </div>

      <div className="bg-white/[0.03] border border-white/10 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Globe className="w-4 h-4 text-blue-400" />
          Platform Capabilities
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {[
            { label: "Live Transcription", icon: Mic, color: "text-emerald-400" },
            { label: "Sentiment Analysis", icon: BarChart3, color: "text-amber-400" },
            { label: "20 AI Modules", icon: Brain, color: "text-violet-400" },
            { label: "Compliance Scanning", icon: Shield, color: "text-red-400" },
            { label: "Conference Dial-Out", icon: Phone, color: "text-cyan-400" },
            { label: "Video Webcasting", icon: Video, color: "text-blue-400" },
            { label: "Smart Q&A", icon: MessageSquare, color: "text-pink-400" },
            { label: "Real-Time Delivery", icon: Wifi, color: "text-green-400" },
            { label: "Investor Intelligence", icon: TrendingUp, color: "text-orange-400" },
            { label: "AGM Governance", icon: Building2, color: "text-indigo-400" },
            { label: "Archive Processing", icon: FileText, color: "text-teal-400" },
            { label: "Partner Integrations", icon: Handshake, color: "text-yellow-400" },
          ].map(({ label, icon: Icon, color }) => (
            <div key={label} className="flex items-center gap-2 p-2.5 rounded-lg bg-white/[0.02] border border-white/5">
              <Icon className={`w-4 h-4 ${color} shrink-0`} />
              <span className="text-xs text-slate-400">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SettingsTab() {
  const { user, isAuthenticated } = useAuth();
  const { data: healthStatus } = trpc.healthGuardian.currentStatus.useQuery(undefined, { retry: false });

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-1">Platform Settings</h2>
        <p className="text-sm text-slate-500">Configuration and system information</p>
      </div>

      <div className="space-y-6">
        <div className="bg-white/[0.03] border border-white/10 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <User className="w-4 h-4 text-violet-400" />
            Account
          </h3>
          {isAuthenticated && user ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-white/5">
                <span className="text-sm text-slate-400">Name</span>
                <span className="text-sm text-white">{user.name || "—"}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-white/5">
                <span className="text-sm text-slate-400">Email</span>
                <span className="text-sm text-white">{user.email || "—"}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-slate-400">Role</span>
                <span className="text-sm text-white capitalize">{user.role || "operator"}</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500">Not logged in</p>
          )}
        </div>

        <div className="bg-white/[0.03] border border-white/10 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Monitor className="w-4 h-4 text-cyan-400" />
            System Status
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-white/5">
              <span className="text-sm text-slate-400">Health Score</span>
              <span className={`text-sm font-semibold ${healthStatus?.overall?.score >= 90 ? "text-emerald-400" : healthStatus?.overall?.score >= 70 ? "text-amber-400" : "text-red-400"}`}>
                {healthStatus?.overall?.score ?? "—"}%
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-white/5">
              <span className="text-sm text-slate-400">Environment</span>
              <span className="text-sm text-white">Production</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-white/5">
              <span className="text-sm text-slate-400">AI Modules</span>
              <span className="text-sm text-emerald-400">20 Active</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-slate-400">Platform URL</span>
              <span className="text-sm text-blue-400">curalive-platform.replit.app</span>
            </div>
          </div>
        </div>

        <div className="bg-white/[0.03] border border-white/10 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Handshake className="w-4 h-4 text-amber-400" />
            Integrations
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { name: "Recall.ai", status: "Connected", color: "text-emerald-400" },
              { name: "OpenAI Whisper", status: "Connected", color: "text-emerald-400" },
              { name: "Ably Realtime", status: "Connected", color: "text-emerald-400" },
              { name: "Twilio", status: "Configured", color: "text-emerald-400" },
              { name: "Lumi Global", status: "Partner", color: "text-cyan-400" },
              { name: "Bastion Capital", status: "Partner", color: "text-amber-400" },
            ].map(({ name, status, color }) => (
              <div key={name} className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/5">
                <span className="text-sm text-slate-300">{name}</span>
                <span className={`text-xs font-medium ${color}`}>{status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

type EventsSubTab = "webcasting" | "calendar" | "mailing";

function EventsTab({ defaultSub }: { defaultSub?: EventsSubTab }) {
  const [subTab, setSubTab] = useState<EventsSubTab>(defaultSub || "webcasting");

  const subTabs = [
    { id: "webcasting" as const, label: "Webcasting Hub", icon: Tv, activeClass: "bg-orange-500/10 border-orange-500/20 text-orange-300" },
    { id: "calendar" as const, label: "Event Calendar", icon: CalendarDays, activeClass: "bg-blue-500/10 border-blue-500/20 text-blue-300" },
    { id: "mailing" as const, label: "Mailing Lists", icon: Mail, activeClass: "bg-violet-500/10 border-violet-500/20 text-violet-300" },
  ];

  return (
    <div>
      <div className="max-w-7xl mx-auto px-6 pt-4">
        <div className="flex gap-3 mb-4">
          {subTabs.map(({ id, label, icon: Icon, activeClass }) => (
            <button
              key={id}
              onClick={() => setSubTab(id)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                subTab === id
                  ? activeClass
                  : "bg-white/[0.03] border border-white/10 text-slate-500 hover:text-slate-300"
              } border`}>
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      </div>
      <Suspense fallback={<div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 text-slate-500 animate-spin" /></div>}>
        {subTab === "webcasting" && <WebcastingHub />}
        {subTab === "calendar" && <EventCalendar />}
        {subTab === "mailing" && <MailingListManager />}
      </Suspense>
    </div>
  );
}

function PartnersTab({ defaultPartner }: { defaultPartner?: "bastion" | "lumi" }) {
  const [partnerTab, setPartnerTab] = useState<"bastion" | "lumi">(defaultPartner || "bastion");

  return (
    <div>
      <div className="max-w-7xl mx-auto px-6 pt-4">
        <div className="flex gap-3 mb-4">
          <button
            onClick={() => setPartnerTab("bastion")}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              partnerTab === "bastion"
                ? "bg-amber-500/10 border border-amber-500/20 text-amber-300"
                : "bg-white/[0.03] border border-white/10 text-slate-500 hover:text-slate-300"
            }`}>
            <Building2 className="w-4 h-4" />
            Bastion Capital Partners
          </button>
          <button
            onClick={() => setPartnerTab("lumi")}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              partnerTab === "lumi"
                ? "bg-cyan-500/10 border border-cyan-500/20 text-cyan-300"
                : "bg-white/[0.03] border border-white/10 text-slate-500 hover:text-slate-300"
            }`}>
            <Globe className="w-4 h-4" />
            Lumi Global
          </button>
        </div>
      </div>
      {partnerTab === "bastion" ? <BastionPartner /> : <LumiPartner />}
    </div>
  );
}

export default function Dashboard() {
  const [, navigate] = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const tabFromUrl = params.get("tab") as DashboardTab | null;
  const partnerFromUrl = params.get("partner") as "bastion" | "lumi" | null;
  const subFromUrl = params.get("sub") as EventsSubTab | null;
  const [activeTab, setActiveTab] = useState<DashboardTab>(
    tabFromUrl && TAB_CONFIG.some(t => t.id === tabFromUrl) ? tabFromUrl : "shadow-mode"
  );

  useEffect(() => {
    const handler = (e: CustomEvent<{ tab: DashboardTab }>) => {
      setActiveTab(e.detail.tab);
    };
    window.addEventListener("dashboard-navigate" as any, handler);
    return () => window.removeEventListener("dashboard-navigate" as any, handler);
  }, []);

  useEffect(() => {
    if (tabFromUrl && TAB_CONFIG.some(t => t.id === tabFromUrl) && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl]);

  useEffect(() => {
    const newUrl = `/?tab=${activeTab}`;
    if (window.location.pathname + window.location.search !== newUrl) {
      window.history.replaceState(null, "", newUrl);
    }
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <div className="border-b border-white/10 bg-[#0d0d14]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-tight">Cura<span className="text-emerald-400">Live</span></span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400">
                  Operator Console
                </span>
              </div>
              <p className="text-xs text-slate-500 uppercase tracking-widest mt-0.5">
                Real-time investor event intelligence
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <span className="text-xs text-slate-500 hidden lg:block">{user?.name}</span>
                <button onClick={() => logout()}
                  className="flex items-center gap-1.5 text-xs text-slate-400 bg-white/[0.03] border border-white/10 px-3 py-1.5 rounded-lg hover:bg-white/[0.06] transition-colors">
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </button>
              </>
            ) : (
              <a href={getLoginUrl()}
                className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg hover:bg-emerald-500/20 transition-colors">
                <LogIn className="w-3.5 h-3.5" />
                Login
              </a>
            )}
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-1 overflow-x-auto">
            {TAB_CONFIG.map(({ id, label, icon: Icon, color, activeColor }) => {
              const btn = (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === id ? activeColor : `border-transparent ${color}`
                  }`}>
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              );
              return btn;
            })}
          </div>
        </div>
      </div>

      <div>
        {activeTab === "shadow-mode" && <ShadowMode embedded />}

        {activeTab === "operator-dashboard" && <Suspense fallback={<div className="text-slate-400 p-8">Loading...</div>}><OperatorDashboard /></Suspense>}
        {activeTab === "billing" && <AdminBilling />}
        {activeTab === "settings" && <SettingsTab />}
      </div>
    </div>
  );
}
