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

// New UI Components from Mockup
import { SidebarLayout } from "@/components/mockups/operator-dashboard/SidebarLayout";
import { TopTabLayout } from "@/components/mockups/operator-dashboard/TopTabLayout";

const WebcastingHub = lazy(() => import("./WebcastingHub"));
const EventCalendar = lazy(() => import("./EventCalendar"));
const MailingListManager = lazy(() => import("./MailingListManager"));

type DashboardTab = "overview" | "shadow-mode" | "events" | "partners" | "billing" | "settings" | "new-ui";

const TAB_CONFIG: { id: DashboardTab; label: string; icon: React.ElementType; color: string; activeColor: string }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard, color: "text-slate-500 hover:text-slate-300", activeColor: "border-violet-400 text-violet-300" },
  { id: "new-ui", label: "New Dashboard", icon: Zap, color: "text-blue-500 hover:text-blue-300", activeColor: "border-blue-400 text-blue-300" },
  { id: "shadow-mode", label: "Shadow Mode", icon: Radio, color: "text-slate-500 hover:text-slate-300", activeColor: "border-emerald-400 text-emerald-300" },
  { id: "events", label: "Events", icon: CalendarDays, color: "text-slate-500 hover:text-slate-300", activeColor: "border-orange-400 text-orange-300" },
  { id: "partners", label: "Partners", icon: Handshake, color: "text-slate-500 hover:text-slate-300", activeColor: "border-amber-400 text-amber-300" },
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
            <span className="text-xs text-slate-600">All systems nominal</span>
            <ChevronRight className="w-4 h-4 text-slate-700" />
          </div>
        </button>

        <div className="bg-white/[0.03] border border-white/10 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <div className="text-xs text-slate-500 uppercase tracking-wider">Live Sessions</div>
              <div className="text-2xl font-bold text-white">{liveSessions.length}</div>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-600">{totalSessions} total this week</span>
            <ChevronRight className="w-4 h-4 text-slate-700" />
          </div>
        </div>

        <div className="bg-white/[0.03] border border-white/10 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <Brain className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <div className="text-xs text-slate-500 uppercase tracking-wider">AI Insights</div>
              <div className="text-2xl font-bold text-white">124</div>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-600">8 critical flags today</span>
            <ChevronRight className="w-4 h-4 text-slate-700" />
          </div>
        </div>

        <div className="bg-white/[0.03] border border-white/10 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <div className="text-xs text-slate-500 uppercase tracking-wider">Engagement</div>
              <div className="text-2xl font-bold text-white">84%</div>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-600">+12% vs last month</span>
            <ChevronRight className="w-4 h-4 text-slate-700" />
          </div>
        </div>
      </div>

      {showHealthPanel && <LiveHealthPanel healthStatus={healthStatus} onClose={() => setShowHealthPanel(false)} />}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white/[0.03] border border-white/10 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Radio className="w-4 h-4 text-emerald-400" />
                Active Sessions
              </h3>
              <button onClick={() => navigate("/shadow-mode")} className="text-xs text-emerald-400 hover:text-emerald-300 font-medium">
                New Session +
              </button>
            </div>
            <div className="divide-y divide-white/5">
              {liveSessions.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <p className="text-sm text-slate-500">No active sessions at the moment.</p>
                </div>
              ) : (
                liveSessions.map((session: any) => (
                  <div key={session.id} className="px-6 py-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <div>
                        <div className="text-sm font-medium text-white">{session.companyName || "Unknown Client"}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{session.eventName || "General Session"}</div>
                      </div>
                    </div>
                    <button onClick={() => navigate(`/operator/${session.id}`)} className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 text-xs font-semibold rounded-lg border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors">
                      Manage Console
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-white/[0.03] border border-white/10 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-orange-400" />
                Upcoming Events
              </h3>
              <button onClick={() => navigate("/events/calendar")} className="text-xs text-orange-400 hover:text-orange-300 font-medium">
                View Calendar
              </button>
            </div>
            <div className="px-6 py-8 text-center">
              <p className="text-sm text-slate-500">Syncing with booking system...</p>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-white/[0.03] border border-white/10 rounded-xl p-6">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-400" />
              Quick Actions
            </h3>
            <div className="space-y-3">
              <button onClick={() => navigate("/occ")} className="w-full flex items-center justify-between p-3 rounded-lg bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] transition-colors text-left group">
                <div className="flex items-center gap-3">
                  <Monitor className="w-4 h-4 text-blue-400" />
                  <span className="text-xs font-medium text-slate-300">Open OCC Console</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-700 group-hover:text-slate-400 transition-colors" />
              </button>
              <button onClick={() => navigate("/live-video/webcasting")} className="w-full flex items-center justify-between p-3 rounded-lg bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] transition-colors text-left group">
                <div className="flex items-center gap-3">
                  <Tv className="w-4 h-4 text-purple-400" />
                  <span className="text-xs font-medium text-slate-300">Webcasting Hub</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-700 group-hover:text-slate-400 transition-colors" />
              </button>
              <button onClick={() => navigate("/admin/users")} className="w-full flex items-center justify-between p-3 rounded-lg bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] transition-colors text-left group">
                <div className="flex items-center gap-3">
                  <Users className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-medium text-slate-300">Manage Users</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-700 group-hover:text-slate-400 transition-colors" />
              </button>
            </div>
          </div>

          <div className="bg-gradient-to-br from-violet-600/20 to-fuchsia-600/20 border border-violet-500/20 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center">
                <Heart className="w-5 h-5 text-violet-400" />
              </div>
              <h3 className="text-sm font-semibold text-white">Platform Updates</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              New "Agentic Brain" feature is now live in beta. Get automated ROI projections for all event types.
            </p>
            <button onClick={() => navigate("/agentic-brain")} className="text-xs font-bold text-violet-400 hover:text-violet-300">
              Try it now →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

type EventsSubTab = "webcasting" | "calendar" | "mailing";

function EventsTab({ defaultSub }: { defaultSub?: EventsSubTab }) {
  const [subTab, setSubTab] = useState<EventsSubTab>(defaultSub || "webcasting");

  const subTabs: { id: EventsSubTab; label: string; icon: any; activeClass: string }[] = [
    { id: "webcasting", label: "Webcasting", icon: Tv, activeClass: "bg-orange-500/10 border-orange-500/20 text-orange-300" },
    { id: "calendar", label: "Calendar", icon: CalendarDays, activeClass: "bg-blue-500/10 border-blue-500/20 text-blue-300" },
    { id: "mailing", label: "Mailing Lists", icon: Mail, activeClass: "bg-emerald-500/10 border-emerald-500/20 text-emerald-300" },
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

function NewDashboardTab() {
  const [subTab, setSubTab] = useState("dashboard");
  return (
    <div className="min-h-screen bg-[#0a0a0f] flex">
      <div className="w-64 border-r border-white/5 hidden xl:block">
        <SidebarLayout />
      </div>
      <div className="flex-1 flex flex-col min-w-0">
        <div className="border-b border-white/5 p-4">
           <div className="flex items-center gap-4">
              {["dashboard", "occ", "webcasts", "video", "shadow", "ai", "guardian", "billing"].map(t => (
                <button 
                  key={t}
                  onClick={() => setSubTab(t)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                    subTab === t ? "bg-white/10 text-white" : "text-gray-500 hover:text-gray-300"
                  }`}
                >
                  {t.toUpperCase()}
                </button>
              ))}
           </div>
        </div>
        <div className="p-6">
          {subTab === "dashboard" ? <TopTabLayout /> : (
            <div className="text-center py-20 text-gray-600">
              <Brain className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>Module {subTab} integrated into app shell.</p>
            </div>
          )}
        </div>
      </div>
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
    tabFromUrl && TAB_CONFIG.some(t => t.id === tabFromUrl) ? tabFromUrl : "overview"
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
    const newUrl = activeTab === "overview" ? "/" : `/?tab=${activeTab}`;
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
              if (id === "shadow-mode") {
                return [
                  btn,
                  <a
                    key="op-dashboard"
                    href="/operator/dashboard"
                    className="flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 border-transparent text-blue-400 hover:text-blue-300 transition-colors whitespace-nowrap">
                    <LayoutDashboard className="w-4 h-4" />
                    Dashboard
                  </a>,
                ];
              }
              return btn;
            })}
          </div>
        </div>
      </div>

      <div>
        {activeTab === "overview" && <OverviewTab />}
        {activeTab === "new-ui" && <NewDashboardTab />}
        {activeTab === "shadow-mode" && <ShadowMode embedded />}

        {activeTab === "events" && <EventsTab defaultSub={subFromUrl || undefined} />}
        {activeTab === "partners" && <PartnersTab defaultPartner={partnerFromUrl || undefined} />}
        {activeTab === "billing" && <AdminBilling />}
        {activeTab === "settings" && <SettingsTab />}
      </div>
    </div>
  );
}
