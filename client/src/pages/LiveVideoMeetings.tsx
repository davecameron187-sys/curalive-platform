import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useMemo } from "react";
import {
  Video, Users, TrendingUp, Mic, Calendar, Clock, Building2,
  Plus, ArrowRight, Play, CheckCircle2, Circle, AlertCircle,
  BarChart3, Globe, Briefcase, FileText, ChevronRight, Zap,
  X, Loader2, Activity
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────
type ServiceType = "capital_raising_1x1" | "research_presentation" | "earnings_call" | "hybrid_conference";
type Platform = "zoom" | "teams" | "webex" | "mixed";

const SERVICE_LABELS: Record<ServiceType, string> = {
  capital_raising_1x1: "Capital Raising 1:1",
  research_presentation: "Research Presentation",
  earnings_call: "Earnings Call",
  hybrid_conference: "Hybrid Conference",
};

const SERVICE_COLORS: Record<ServiceType, string> = {
  capital_raising_1x1: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  research_presentation: "text-blue-400 bg-blue-400/10 border-blue-400/20",
  earnings_call: "text-amber-400 bg-amber-400/10 border-amber-400/20",
  hybrid_conference: "text-violet-400 bg-violet-400/10 border-violet-400/20",
};

const STATUS_COLORS: Record<string, string> = {
  draft: "text-slate-400",
  active: "text-emerald-400",
  completed: "text-blue-400",
  cancelled: "text-red-400",
};

const PLATFORM_BADGES: Record<Platform, { label: string; color: string }> = {
  zoom: { label: "Zoom", color: "bg-blue-600" },
  teams: { label: "Teams", color: "bg-purple-600" },
  webex: { label: "Webex", color: "bg-green-700" },
  mixed: { label: "Mixed", color: "bg-slate-600" },
};

// ─── Service Type Cards ───────────────────────────────────────────────────────
const SERVICE_TYPES = [
  {
    type: "capital_raising_1x1" as ServiceType,
    icon: TrendingUp,
    title: "Capital Raising 1:1 Meetings",
    desc: "Back-to-back investor roadshow meetings. Each slot gets its own video link. Investors held in a private waiting room until the host is ready.",
    detail: "Private waiting room · Back-to-back scheduling · AI briefing packs",
    accent: "emerald",
  },
  {
    type: "research_presentation" as ServiceType,
    icon: BarChart3,
    title: "Research Presentations",
    desc: "Analyst-led video presentations to institutional investors. Managed slide deck delivery with Q&A moderation.",
    detail: "Analyst + investor audience · Managed Q&A",
    accent: "blue",
  },
  {
    type: "earnings_call" as ServiceType,
    icon: Mic,
    title: "Earnings Calls & Investor Updates",
    desc: "Quarterly earnings calls and investor update sessions with live transcription, sentiment analysis, and AI summaries.",
    detail: "Integrated with Chorus.AI event platform",
    accent: "amber",
  },
  {
    type: "hybrid_conference" as ServiceType,
    icon: Globe,
    title: "Analyst & Investor Hybrid Conferences",
    desc: "Invitation-only multi-session conferences connecting issuers, analysts, and investors. Custom branded event pages.",
    detail: "Multi-day · Multi-session · By invitation only",
    accent: "violet",
  },
];

// ─── New Roadshow Modal ───────────────────────────────────────────────────────
function NewRoadshowModal({ onClose, onCreated }: { onClose: () => void; onCreated: (id: string) => void }) {
  const [form, setForm] = useState({
    title: "",
    issuer: "",
    bank: "",
    serviceType: "capital_raising_1x1" as ServiceType,
    platform: "zoom" as Platform,
    startDate: "",
    endDate: "",
    timezone: "Europe/London",
    notes: "",
  });

  const createMutation = trpc.liveVideo.createRoadshow.useMutation({
    onSuccess: (data) => {
      toast.success("Roadshow created");
      onCreated(data.roadshowId);
    },
    onError: (err) => toast.error(err.message),
  });

  const handleSubmit = () => {
    if (!form.title.trim() || !form.issuer.trim()) {
      toast.error("Title and Issuer are required");
      return;
    }
    createMutation.mutate(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <h2 className="text-base font-bold text-white">New Roadshow / Event</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-[11px] text-slate-400 uppercase tracking-wider mb-1">Event Title *</label>
              <input
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                placeholder="e.g. Aggreko Capital Raise — September 2026"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 uppercase tracking-wider mb-1">Issuer / Company *</label>
              <input
                value={form.issuer}
                onChange={e => setForm(f => ({ ...f, issuer: e.target.value }))}
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                placeholder="e.g. Aggreko plc"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 uppercase tracking-wider mb-1">Bank / Arranger</label>
              <input
                value={form.bank}
                onChange={e => setForm(f => ({ ...f, bank: e.target.value }))}
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                placeholder="e.g. BofA Securities"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 uppercase tracking-wider mb-1">Service Type</label>
              <select
                value={form.serviceType}
                onChange={e => setForm(f => ({ ...f, serviceType: e.target.value as ServiceType }))}
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              >
                {Object.entries(SERVICE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 uppercase tracking-wider mb-1">Platform</label>
              <select
                value={form.platform}
                onChange={e => setForm(f => ({ ...f, platform: e.target.value as Platform }))}
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              >
                <option value="zoom">Zoom</option>
                <option value="teams">Microsoft Teams</option>
                <option value="webex">Webex</option>
                <option value="mixed">Mixed Platforms</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 uppercase tracking-wider mb-1">Start Date</label>
              <input
                type="date"
                value={form.startDate}
                onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 uppercase tracking-wider mb-1">End Date</label>
              <input
                type="date"
                value={form.endDate}
                onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 uppercase tracking-wider mb-1">Timezone</label>
              <select
                value={form.timezone}
                onChange={e => setForm(f => ({ ...f, timezone: e.target.value }))}
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              >
                <option value="Europe/London">London (GMT/BST)</option>
                <option value="America/New_York">New York (ET)</option>
                <option value="America/Chicago">Chicago (CT)</option>
                <option value="America/Los_Angeles">Los Angeles (PT)</option>
                <option value="Asia/Hong_Kong">Hong Kong (HKT)</option>
                <option value="Asia/Singapore">Singapore (SGT)</option>
                <option value="Asia/Tokyo">Tokyo (JST)</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-[11px] text-slate-400 uppercase tracking-wider mb-1">Operator Notes</label>
              <textarea
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                rows={2}
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 resize-none"
                placeholder="Internal notes for the operator team..."
              />
            </div>
          </div>
        </div>
        <div className="flex gap-3 px-6 py-4 border-t border-slate-800">
          <button
            onClick={handleSubmit}
            disabled={createMutation.isPending}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-700 hover:bg-blue-600 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-colors"
          >
            {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Create Roadshow
          </button>
          <button onClick={onClose} className="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm font-semibold transition-colors">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function LiveVideoMeetings() {
  const [, navigate] = useLocation();
  const [showNewModal, setShowNewModal] = useState(false);
  const [filterType, setFilterType] = useState<ServiceType | "all">("all");

  const { data: roadshows = [], isLoading, refetch } = trpc.liveVideo.listRoadshows.useQuery();

  const roadshowIds = useMemo(() => roadshows.map(r => r.roadshowId), [roadshows]);
  const { data: summaryCards = [] } = trpc.roadshowAI.getRoadshowSummaryCards.useQuery(
    { roadshowIds },
    { enabled: roadshowIds.length > 0, refetchInterval: 30000 }
  );
  const summaryMap = useMemo(() => Object.fromEntries(summaryCards.map(c => [c.id, c])), [summaryCards]);

  const filtered = filterType === "all" ? roadshows : roadshows.filter(r => r.serviceType === filterType);

  const stats = {
    total: roadshows.length,
    active: roadshows.filter(r => r.status === "active").length,
    draft: roadshows.filter(r => r.status === "draft").length,
    completed: roadshows.filter(r => r.status === "completed").length,
  };

  return (
    <div className="min-h-screen bg-background text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 border-b border-border bg-background/90 backdrop-blur-md">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/")} className="text-slate-500 hover:text-white transition-colors">
              <img src="https://d2xsxph8kpxj0f.cloudfront.net/310519663387446759/Mdu4k2iB9LVRNHXWAQDZg3/chorus-call-logo_7f85e981.png" alt="Chorus Call" className="h-7 w-auto object-contain opacity-70 hover:opacity-100 transition-opacity" />
            </button>
            <span className="text-slate-600">/</span>
            <div className="flex items-center gap-2">
              <Video className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-semibold text-white">Live Video Meetings</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/occ")}
              className="text-xs text-slate-400 hover:text-white transition-colors px-3 py-1.5 border border-slate-700 rounded-lg"
            >
              OCC Console
            </button>
            <button
              onClick={() => setShowNewModal(true)}
              className="flex items-center gap-2 bg-blue-700 hover:bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> New Roadshow
            </button>
          </div>
        </div>
      </header>

      <div className="pt-14">
        {/* Hero Banner */}
        <div className="border-b border-border bg-gradient-to-r from-slate-900 via-slate-900 to-blue-950/30">
          <div className="container py-10">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-widest px-3 py-1.5 rounded-full mb-4">
                <Briefcase className="w-3 h-3" /> Capital Markets &amp; Private Equity
              </div>
              <h1 className="text-3xl font-bold text-white mb-3">Live Video Meeting Services</h1>
              <p className="text-slate-400 leading-relaxed text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>
                Managed white-glove video meeting services for investment banks and private equity firms. Platform-neutral delivery across Zoom, Teams, and Webex — with private waiting rooms, operator-managed access control, and engagement analytics.
              </p>
            </div>
            {/* Stats Row */}
            <div className="grid grid-cols-4 gap-4 mt-8 max-w-2xl">
              {[
                { label: "Total Roadshows", value: stats.total, color: "text-white" },
                { label: "Active", value: stats.active, color: "text-emerald-400" },
                { label: "Draft", value: stats.draft, color: "text-slate-400" },
                { label: "Completed", value: stats.completed, color: "text-blue-400" },
              ].map(s => (
                <div key={s.label} className="bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3">
                  <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Service Type Overview */}
        <div className="container py-10">
          <h2 className="text-lg font-bold text-white mb-5">Service Types</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
            {SERVICE_TYPES.map(({ type, icon: Icon, title, desc, detail, accent }) => (
              <div
                key={type}
                onClick={() => setFilterType(filterType === type ? "all" : type)}
                className={`group cursor-pointer bg-slate-900 border rounded-xl p-5 transition-all ${
                  filterType === type
                    ? `border-${accent}-500/50 bg-${accent}-950/20`
                    : "border-slate-800 hover:border-slate-600"
                }`}
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 bg-${accent}-500/10`}>
                  <Icon className={`w-4.5 h-4.5 text-${accent}-400`} />
                </div>
                <h3 className="text-sm font-semibold text-white mb-1.5 leading-snug">{title}</h3>
                <p className="text-[11px] text-slate-500 leading-relaxed mb-3" style={{ fontFamily: "'Inter', sans-serif" }}>{desc}</p>
                <p className={`text-[10px] font-medium text-${accent}-400`}>{detail}</p>
              </div>
            ))}
          </div>

          {/* Roadshow List */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">
              {filterType === "all" ? "All Roadshows & Events" : SERVICE_LABELS[filterType]}
              {filterType !== "all" && (
                <button onClick={() => setFilterType("all")} className="ml-2 text-xs text-slate-500 hover:text-white font-normal">
                  (clear filter)
                </button>
              )}
            </h2>
            <span className="text-xs text-slate-500">{filtered.length} result{filtered.length !== 1 ? "s" : ""}</span>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 text-slate-500 animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 border border-dashed border-slate-800 rounded-2xl">
              <Video className="w-10 h-10 text-slate-700 mx-auto mb-3" />
              <p className="text-slate-500 text-sm mb-4">No roadshows yet. Create your first one to get started.</p>
              <button
                onClick={() => setShowNewModal(true)}
                className="inline-flex items-center gap-2 bg-blue-700 hover:bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-semibold transition-colors"
              >
                <Plus className="w-4 h-4" /> Create Roadshow
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map(rs => {
                const svcColor = SERVICE_COLORS[rs.serviceType as ServiceType] || "text-slate-400 bg-slate-400/10 border-slate-400/20";
                const platBadge = PLATFORM_BADGES[rs.platform as Platform] || { label: rs.platform, color: "bg-slate-600" };
                return (
                  <div
                    key={rs.id}
                    className="group bg-slate-900 border border-slate-800 hover:border-slate-600 rounded-xl px-5 py-4 flex items-center gap-4 cursor-pointer transition-all"
                    onClick={() => navigate(`/live-video/roadshow/${rs.roadshowId}`)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${svcColor}`}>
                          {SERVICE_LABELS[rs.serviceType as ServiceType]}
                        </span>
                        <span className={`text-[10px] font-bold text-white px-1.5 py-0.5 rounded ${platBadge.color}`}>
                          {platBadge.label}
                        </span>
                        <span className={`text-[11px] font-semibold uppercase tracking-wider ${STATUS_COLORS[rs.status] || "text-slate-400"}`}>
                          {rs.status}
                        </span>
                      </div>
                      <h3 className="font-semibold text-white text-sm truncate">{rs.title}</h3>
                      <p className="text-[12px] text-slate-500 mt-0.5">
                        {rs.issuer}{rs.bank ? ` · ${rs.bank}` : ""}
                        {rs.startDate ? ` · ${rs.startDate}${rs.endDate && rs.endDate !== rs.startDate ? ` – ${rs.endDate}` : ""}` : ""}
                      </p>
                    </div>
                    {/* AI Summary Mini-Card */}
                    {summaryMap[rs.roadshowId] && (
                      <div className="flex items-center gap-3 flex-shrink-0 border-l border-slate-800 pl-4">
                        {/* Meetings progress */}
                        <div className="text-center">
                          <div className="text-sm font-bold text-white">
                            {summaryMap[rs.roadshowId].completedMeetings}/{summaryMap[rs.roadshowId].totalMeetings}
                          </div>
                          <div className="text-[9px] text-slate-500 uppercase tracking-wider">Meetings</div>
                        </div>
                        {/* Soft commits */}
                        <div className="text-center">
                          <div className="text-sm font-bold text-emerald-400">{summaryMap[rs.roadshowId].softCommitCount}</div>
                          <div className="text-[9px] text-slate-500 uppercase tracking-wider">Commits</div>
                        </div>
                        {/* Sentiment */}
                        {summaryMap[rs.roadshowId].sentimentScore !== null && (
                          <div className="text-center">
                            <div className={`text-sm font-bold ${
                              summaryMap[rs.roadshowId].sentimentLabel === "positive" ? "text-emerald-400"
                              : summaryMap[rs.roadshowId].sentimentLabel === "neutral" ? "text-amber-400"
                              : "text-red-400"
                            }`}>
                              {summaryMap[rs.roadshowId].sentimentScore}
                            </div>
                            <div className="text-[9px] text-slate-500 uppercase tracking-wider">Sentiment</div>
                          </div>
                        )}
                        {/* In-progress indicator */}
                        {summaryMap[rs.roadshowId].inProgressMeeting && (
                          <div className="flex items-center gap-1 text-[10px] font-semibold text-red-400 bg-red-900/20 border border-red-700/30 px-2 py-1 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                            Live
                          </div>
                        )}
                        {/* Next meeting */}
                        {!summaryMap[rs.roadshowId].inProgressMeeting && summaryMap[rs.roadshowId].nextMeeting && (
                          <div className="text-center">
                            <div className="text-[10px] font-semibold text-slate-300">{summaryMap[rs.roadshowId].nextMeeting!.startTime ?? "—"}</div>
                            <div className="text-[9px] text-slate-500 uppercase tracking-wider">Next</div>
                          </div>
                        )}
                      </div>
                    )}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={e => { e.stopPropagation(); navigate(`/live-video/roadshow/${rs.roadshowId}`); }}
                        className="flex items-center gap-1.5 bg-blue-700/20 hover:bg-blue-700/40 text-blue-400 border border-blue-700/30 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                      >
                        Manage <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Demo Roadshow Banner */}
          {roadshows.length === 0 && !isLoading && (
            <div className="mt-8 bg-slate-900 border border-slate-700 rounded-2xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">Example: Aggreko Capital Raise</h3>
                  <p className="text-sm text-slate-400 mb-3" style={{ fontFamily: "'Inter', sans-serif" }}>
                    A real-world example: BofA Securities and Barclays arranged a 3-day roadshow for Aggreko plc across Blackstone, Bain Capital, M&G, RLAM/Schroders, CSAM, Ares Management, and Carlyle Group.
                  </p>
                  <button
                    onClick={() => setShowNewModal(true)}
                    className="inline-flex items-center gap-2 text-emerald-400 text-sm font-semibold hover:text-emerald-300 transition-colors"
                  >
                    Create a roadshow like this <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {showNewModal && (
        <NewRoadshowModal
          onClose={() => setShowNewModal(false)}
          onCreated={(id) => {
            setShowNewModal(false);
            refetch();
            navigate(`/live-video/roadshow/${id}`);
          }}
        />
      )}
    </div>
  );
}
