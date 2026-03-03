/**
 * WebcastingHub.tsx — Chorus.AI Webcasting Platform
 * Central hub for all audio/video webcasting services across all event types and industry verticals.
 */
import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { toast } from "sonner";
import {
  Video, Users, TrendingUp, Mic, Calendar,
  Plus, ArrowRight, Play, BarChart3, Globe, Briefcase,
  ChevronRight, Zap, Activity, Radio, MonitorPlay, BookOpen,
  Heart, Landmark, GraduationCap, Tv, Megaphone, FileText,
  Settings, Eye, Star, CheckCircle2, LogIn, UserCheck
} from "lucide-react";

// ─── Event Type Definitions ───────────────────────────────────────────────────
const EVENT_TYPES = [
  {
    id: "webinar",
    icon: Mic,
    label: "Webinars",
    desc: "Interactive single or panel-format sessions. Live Q&A, polls, and chat. Up to 10,000 attendees.",
    color: "text-blue-400",
    border: "border-blue-400/20 hover:border-blue-400/40",
    bg: "bg-blue-400/5",
    useCases: ["Demand generation", "Product demos", "Thought leadership", "Customer education"],
  },
  {
    id: "webcast",
    icon: Radio,
    label: "Webcasts",
    desc: "Broadcast-quality one-to-many streaming. Earnings calls, town halls, AGMs. Up to 100,000+ attendees.",
    color: "text-amber-400",
    border: "border-amber-400/20 hover:border-amber-400/40",
    bg: "bg-amber-400/5",
    useCases: ["Earnings calls", "CEO town halls", "AGMs", "Press conferences"],
  },
  {
    id: "virtual_event",
    icon: Globe,
    label: "Virtual Events",
    desc: "Multi-session, multi-track conferences with lobby, networking, and expo hall. Up to 50,000 attendees.",
    color: "text-violet-400",
    border: "border-violet-400/20 hover:border-violet-400/40",
    bg: "bg-violet-400/5",
    useCases: ["Annual conferences", "Summits", "Trade shows", "Award ceremonies"],
  },
  {
    id: "hybrid_event",
    icon: MonitorPlay,
    label: "Hybrid Events",
    desc: "Combine in-person and virtual audiences seamlessly. Physical venue + live stream with full interactivity.",
    color: "text-emerald-400",
    border: "border-emerald-400/20 hover:border-emerald-400/40",
    bg: "bg-emerald-400/5",
    useCases: ["Hybrid conferences", "Product launches", "Hybrid AGMs", "Awards"],
  },
  {
    id: "capital_markets",
    icon: TrendingUp,
    label: "Capital Markets",
    desc: "Roadshows, investor days, and 1:1 meetings with AI briefing packs, commitment signals, and order book.",
    color: "text-rose-400",
    border: "border-rose-400/20 hover:border-rose-400/40",
    bg: "bg-rose-400/5",
    useCases: ["IPO roadshows", "Investor days", "Analyst briefings", "Fund updates"],
  },
  {
    id: "on_demand",
    icon: Play,
    label: "On-Demand & Simulive",
    desc: "Pre-recorded content delivered as live, or gated on-demand with interactive overlays and certifications.",
    color: "text-cyan-400",
    border: "border-cyan-400/20 hover:border-cyan-400/40",
    bg: "bg-cyan-400/5",
    useCases: ["Training & onboarding", "Certification programs", "CME/CPD", "Product tutorials"],
  },
  {
    id: "audio_conference",
    icon: Mic,
    label: "Audio Conferences",
    desc: "PSTN/VoIP dial-in conference calls with operator management, Q&A queuing, and real-time controls.",
    color: "text-slate-400",
    border: "border-slate-400/20 hover:border-slate-400/40",
    bg: "bg-slate-400/5",
    useCases: ["Earnings calls (audio)", "Board meetings", "Analyst calls", "Investor updates"],
  },
  {
    id: "hybrid_conference",
    icon: Video,
    label: "Hybrid Conferences",
    desc: "Large-scale branded multi-day events with custom registration, session management, and networking.",
    color: "text-indigo-400",
    border: "border-indigo-400/20 hover:border-indigo-400/40",
    bg: "bg-indigo-400/5",
    useCases: ["Annual conferences", "Industry summits", "Partner events", "Leadership forums"],
  },
];

// ─── Industry Verticals ───────────────────────────────────────────────────────
const VERTICALS = [
  {
    id: "financial_services",
    icon: TrendingUp,
    label: "Financial Services",
    desc: "Earnings calls, AGMs, roadshows, investor days, analyst briefings",
    color: "text-emerald-400",
    examples: ["JSE earnings webcast", "IPO roadshow", "AGM hybrid event"],
  },
  {
    id: "corporate_communications",
    icon: Megaphone,
    label: "Corporate Comms",
    desc: "CEO town halls, all-hands, product launches, board briefings",
    color: "text-blue-400",
    examples: ["CEO all-hands", "Product launch", "Board briefing"],
  },
  {
    id: "healthcare",
    icon: Heart,
    label: "Healthcare & Life Sciences",
    desc: "CME/CPD webinars, drug launches, clinical trial updates, patient education",
    color: "text-red-400",
    examples: ["CME webinar series", "Drug launch webcast", "Clinical trial update"],
  },
  {
    id: "technology",
    icon: Zap,
    label: "Technology",
    desc: "Product demos, developer conferences, partner enablement, training",
    color: "text-violet-400",
    examples: ["Developer conference", "Partner enablement", "Product demo"],
  },
  {
    id: "government",
    icon: Landmark,
    label: "Government & Public Sector",
    desc: "Public hearings, policy briefings, parliamentary webcasts, consultations",
    color: "text-amber-400",
    examples: ["Budget speech webcast", "Public hearing", "Policy briefing"],
  },
  {
    id: "education",
    icon: GraduationCap,
    label: "Education",
    desc: "Online lectures, virtual graduation, continuing education, alumni events",
    color: "text-cyan-400",
    examples: ["Virtual graduation", "Online lecture series", "Alumni event"],
  },
  {
    id: "professional_services",
    icon: Briefcase,
    label: "Professional Services",
    desc: "Client briefings, thought leadership, research presentations, certification",
    color: "text-orange-400",
    examples: ["Client briefing", "Research presentation", "CPD certification"],
  },
  {
    id: "media_entertainment",
    icon: Tv,
    label: "Media & Entertainment",
    desc: "Virtual press conferences, award ceremonies, fan events, content premieres",
    color: "text-pink-400",
    examples: ["Award ceremony", "Press conference", "Content premiere"],
  },
];

// ─── Status helpers ───────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  draft: { label: "Draft", color: "text-slate-400", dot: "bg-slate-500" },
  scheduled: { label: "Scheduled", color: "text-amber-400", dot: "bg-amber-400" },
  live: { label: "Live", color: "text-red-400", dot: "bg-red-400 animate-pulse" },
  ended: { label: "Ended", color: "text-blue-400", dot: "bg-blue-400" },
  on_demand: { label: "On Demand", color: "text-emerald-400", dot: "bg-emerald-400" },
  cancelled: { label: "Cancelled", color: "text-slate-500", dot: "bg-slate-500" },
};

const EVENT_TYPE_LABELS: Record<string, string> = {
  webinar: "Webinar",
  webcast: "Webcast",
  virtual_event: "Virtual Event",
  hybrid_event: "Hybrid Event",
  on_demand: "On Demand",
  simulive: "Simulive",
  audio_conference: "Audio Conference",
  capital_markets: "Capital Markets",
};

const VERTICAL_LABELS: Record<string, string> = {
  financial_services: "Financial Services",
  corporate_communications: "Corporate Comms",
  healthcare: "Healthcare",
  technology: "Technology",
  professional_services: "Professional Services",
  government: "Government",
  education: "Education",
  media_entertainment: "Media & Entertainment",
  general: "General",
};

function formatDate(ts: number | null | undefined) {
  if (!ts) return "—";
  return new Date(ts).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function WebcastingHub() {
  const [, navigate] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<"all" | "live" | "scheduled" | "on_demand" | "ended">("all");
  const [selectedVertical, setSelectedVertical] = useState<string>("all");

  const { data: webcastEvents = [], isLoading } = trpc.webcast.listEvents.useQuery({ limit: 50 });

  const filteredEvents = webcastEvents.filter(ev => {
    const statusMatch = activeTab === "all" || ev.status === activeTab;
    const verticalMatch = selectedVertical === "all" || ev.industryVertical === selectedVertical;
    return statusMatch && verticalMatch;
  });

  const liveCount = webcastEvents.filter(e => e.status === "live").length;
  const scheduledCount = webcastEvents.filter(e => e.status === "scheduled").length;
  const onDemandCount = webcastEvents.filter(e => e.status === "on_demand" || e.status === "ended").length;
  const totalRegistrations = webcastEvents.reduce((sum, e) => sum + (e.registrationCount || 0), 0);

  const requestAccess = trpc.team.requestOperatorAccess.useMutation({
    onSuccess: (data) => {
      if (data.alreadyOperator) {
        toast.success("You already have operator access!");
      } else {
        toast.success("Access request sent to admin. You will be notified when your role is updated.");
      }
    },
    onError: () => toast.error("Failed to send request. Please try again."),
  });

  const isOperatorOrAdmin = user?.role === 'operator' || user?.role === 'admin';

  return (
    <div className="min-h-screen bg-background text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>

      {/* ── Header ── */}
      <header className="border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-40">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/")} className="text-muted-foreground hover:text-foreground transition-colors text-sm">
              ← Home
            </button>
            <span className="text-border">|</span>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                <Video className="w-3.5 h-3.5 text-primary" />
              </div>
              <div>
                <h1 className="text-sm font-bold leading-tight">Webcasting Platform</h1>
                <p className="text-[10px] text-muted-foreground leading-tight">Audio & Video Broadcasting Services</p>
              </div>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-1 text-sm">
            <button onClick={() => navigate("/live-video")} className="px-3 py-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors flex items-center gap-1.5 text-xs">
              <TrendingUp className="w-3.5 h-3.5" /> Capital Markets
            </button>
            <button onClick={() => navigate("/occ")} className="px-3 py-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors flex items-center gap-1.5 text-xs">
              <Mic className="w-3.5 h-3.5" /> OCC
            </button>
            <button onClick={() => navigate("/live-video/on-demand")} className="px-3 py-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors flex items-center gap-1.5 text-xs">
              <Play className="w-3.5 h-3.5" /> On Demand
            </button>
          </nav>
          <div className="flex items-center gap-2">
            {!isAuthenticated ? (
              <a href={getLoginUrl()} className="flex items-center gap-1.5 border border-primary/40 text-primary px-3 py-2 rounded-lg text-xs font-semibold hover:bg-primary/10 transition-colors">
                <LogIn className="w-3 h-3" /> Login
              </a>
            ) : !isOperatorOrAdmin ? (
              <button
                onClick={() => requestAccess.mutate({})}
                disabled={requestAccess.isPending}
                className="flex items-center gap-1.5 border border-indigo-500/40 text-indigo-400 px-3 py-2 rounded-lg text-xs font-semibold hover:bg-indigo-500/10 transition-colors disabled:opacity-50"
              >
                <UserCheck className="w-3 h-3" />
                {requestAccess.isPending ? "Requesting…" : "Request Operator Access"}
              </button>
            ) : null}
            {isOperatorOrAdmin && (
              <button onClick={() => navigate("/live-video/webcast/create")} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity">
                <Plus className="w-3.5 h-3.5" /> New Event
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ── Hero Stats ── */}
      <section className="border-b border-border bg-card/30">
        <div className="container py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Live Now</span>
              </div>
              <div className="text-3xl font-bold text-red-400">{liveCount}</div>
              <div className="text-xs text-muted-foreground mt-0.5">Active broadcasts</div>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Upcoming</span>
              </div>
              <div className="text-3xl font-bold text-amber-400">{scheduledCount}</div>
              <div className="text-xs text-muted-foreground mt-0.5">Scheduled events</div>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <Play className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">On Demand</span>
              </div>
              <div className="text-3xl font-bold text-emerald-400">{onDemandCount}</div>
              <div className="text-xs text-muted-foreground mt-0.5">Available recordings</div>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Registrations</span>
              </div>
              <div className="text-3xl font-bold text-blue-400">
                {totalRegistrations >= 1000 ? `${(totalRegistrations / 1000).toFixed(1)}k` : totalRegistrations}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">Total registered</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Event Types Grid ── */}
      <section className="border-b border-border py-12">
        <div className="container">
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-2">Event Formats</h2>
            <p className="text-muted-foreground text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>
              Choose the right format for your audience, scale, and engagement goals.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {EVENT_TYPES.map((type) => (
              <div key={type.id + type.label} className={`group bg-card border rounded-xl p-5 transition-all cursor-pointer ${type.border} ${type.bg}`}>
                <type.icon className={`w-5 h-5 ${type.color} mb-3`} />
                <div className="font-semibold text-sm mb-1 group-hover:text-primary transition-colors">{type.label}</div>
                <div className="text-xs text-muted-foreground leading-relaxed mb-3" style={{ fontFamily: "'Inter', sans-serif" }}>{type.desc}</div>
                <div className="space-y-1">
                  {type.useCases.slice(0, 2).map(uc => (
                    <div key={uc} className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                      <CheckCircle2 className="w-3 h-3 text-primary/50 shrink-0" />
                      {uc}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Industry Verticals ── */}
      <section className="border-b border-border py-12 bg-card/20">
        <div className="container">
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-2">Industry Solutions</h2>
            <p className="text-muted-foreground text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>
              Purpose-built templates and workflows for every sector. Click to filter events.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {VERTICALS.map(v => (
              <button
                key={v.id}
                onClick={() => setSelectedVertical(selectedVertical === v.id ? "all" : v.id)}
                className={`text-left p-4 rounded-xl border transition-all ${
                  selectedVertical === v.id
                    ? "bg-primary/10 border-primary/40 text-foreground"
                    : "bg-card border-border hover:border-primary/20 hover:bg-card/80"
                }`}
              >
                <v.icon className={`w-4 h-4 ${v.color} mb-2`} />
                <div className="font-semibold text-xs mb-1">{v.label}</div>
                <div className="text-[10px] text-muted-foreground leading-relaxed mb-2" style={{ fontFamily: "'Inter', sans-serif" }}>{v.desc}</div>
                <div className="space-y-0.5">
                  {v.examples.slice(0, 2).map(ex => (
                    <div key={ex} className="text-[9px] text-muted-foreground/70 flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-current opacity-50" />
                      {ex}
                    </div>
                  ))}
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Events List ── */}
      <section className="py-12">
        <div className="container">
          {/* Tab bar */}
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <div className="flex items-center gap-1 bg-card border border-border rounded-lg p-1">
              {(["all", "live", "scheduled", "on_demand", "ended"] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    activeTab === tab
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab === "on_demand" ? "On Demand" : tab.charAt(0).toUpperCase() + tab.slice(1)}
                  {tab === "live" && liveCount > 0 && (
                    <span className="ml-1.5 w-1.5 h-1.5 rounded-full bg-red-400 inline-block animate-pulse" />
                  )}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {selectedVertical !== "all" && (
                <span className="flex items-center gap-1 bg-primary/10 text-primary border border-primary/20 px-2 py-1 rounded-md">
                  {VERTICAL_LABELS[selectedVertical]}
                  <button onClick={() => setSelectedVertical("all")} className="ml-1 hover:text-primary-foreground">×</button>
                </span>
              )}
              <span>{filteredEvents.length} event{filteredEvents.length !== 1 ? "s" : ""}</span>
            </div>
          </div>

          {/* Events grid */}
          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-card border border-border rounded-xl p-5 animate-pulse">
                  <div className="h-3 bg-secondary rounded w-24 mb-3" />
                  <div className="h-5 bg-secondary rounded w-3/4 mb-2" />
                  <div className="h-3 bg-secondary rounded w-full mb-1" />
                  <div className="h-3 bg-secondary rounded w-2/3" />
                </div>
              ))}
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Video className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No events found</p>
              <p className="text-sm mt-1">Try adjusting your filters or create a new event.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredEvents.map(ev => {
                const status = STATUS_CONFIG[ev.status] || STATUS_CONFIG.draft;
                const typeLabel = EVENT_TYPE_LABELS[ev.eventType] || ev.eventType;
                const verticalLabel = VERTICAL_LABELS[ev.industryVertical] || ev.industryVertical;
                return (
                  <div key={ev.id} className="group bg-card border border-border rounded-xl p-5 hover:border-primary/30 hover:bg-card/80 transition-all">
                    {/* Status + type row */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                        <span className={`text-xs font-semibold uppercase tracking-wider ${status.color}`}>{status.label}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">{typeLabel}</span>
                    </div>

                    {/* Title */}
                    <h3 className="font-semibold text-sm leading-snug mb-1 group-hover:text-primary transition-colors line-clamp-2">{ev.title}</h3>

                    {/* Host */}
                    {ev.hostOrganization && (
                      <p className="text-xs text-muted-foreground mb-2" style={{ fontFamily: "'Inter', sans-serif" }}>{ev.hostOrganization}</p>
                    )}

                    {/* Description */}
                    {ev.description && (
                      <p className="text-xs text-muted-foreground leading-relaxed mb-3 line-clamp-2" style={{ fontFamily: "'Inter', sans-serif" }}>{ev.description}</p>
                    )}

                    {/* Meta row */}
                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground mb-3" style={{ fontFamily: "'Inter', sans-serif" }}>
                      {ev.startTime && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(ev.startTime)}
                        </span>
                      )}
                      {ev.registrationCount != null && ev.registrationCount > 0 && (
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {ev.registrationCount.toLocaleString()} registered
                        </span>
                      )}
                      <span className="text-[9px] bg-secondary/60 px-1.5 py-0.5 rounded">{verticalLabel}</span>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2 pt-2 border-t border-border/50">
                      {ev.status === "live" && (
                        <button
                          onClick={() => navigate(`/live-video/webcast/${ev.slug}`)}
                          className="flex-1 flex items-center justify-center gap-1.5 bg-red-500/10 text-red-400 border border-red-500/20 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-red-500/20 transition-colors"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                          Join Live
                        </button>
                      )}
                      {ev.status === "scheduled" && (
                        <button
                          onClick={() => navigate(`/live-video/webcast/${ev.slug}/register`)}
                          className="flex-1 flex items-center justify-center gap-1.5 bg-primary/10 text-primary border border-primary/20 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-primary/20 transition-colors"
                        >
                          <ArrowRight className="w-3 h-3" />
                          Register
                        </button>
                      )}
                      {(ev.status === "ended" || ev.status === "on_demand") && (
                        <button
                          onClick={() => navigate(`/live-video/on-demand`)}
                          className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-emerald-500/20 transition-colors"
                        >
                          <Play className="w-3 h-3" />
                          Watch
                        </button>
                      )}
                      <button
                        onClick={() => navigate(`/live-video/webcast/${ev.slug}`)}
                        className="flex items-center justify-center gap-1 border border-border px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                      >
                        <Eye className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ── Platform Modules ── */}
      <section className="border-t border-border py-12 bg-card/20">
        <div className="container">
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-2">Platform Modules</h2>
            <p className="text-muted-foreground text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>
              Every role has a dedicated workspace. Click to explore each module.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                icon: Radio,
                label: "Webcast Studio",
                desc: "Production console with green room, scene management, live Q&A moderation, and real-time analytics.",
                path: "/live-video/webcast/ceo-town-hall-q1-2026",
                color: "text-amber-400",
                badge: "Live",
              },
              {
                icon: TrendingUp,
                label: "Capital Markets Suite",
                desc: "Roadshow management, 1:1 investor meetings, AI briefing packs, commitment signals, and order book.",
                path: "/live-video",
                color: "text-emerald-400",
                badge: null,
              },
              {
                icon: Mic,
                label: "Operator Call Centre",
                desc: "PSTN/VoIP conference management with real-time participant controls, Q&A queuing, and dial-out.",
                path: "/occ",
                color: "text-blue-400",
                badge: null,
              },
              {
                icon: Play,
                label: "On-Demand Library",
                desc: "Gated video library with search, chapters, interactive overlays, and certification tracking.",
                path: "/live-video/on-demand",
                color: "text-cyan-400",
                badge: null,
              },
              {
                icon: BarChart3,
                label: "Analytics Dashboard",
                desc: "Attendance, engagement, watch-time heatmaps, Q&A analytics, lead scoring, and CRM export.",
                path: "/live-video/analytics",
                color: "text-violet-400",
                badge: null,
              },
              {
                icon: Globe,
                label: "Hybrid Conference",
                desc: "Multi-session conference management with agenda builder, speaker management, and networking.",
                path: "/live-video/conference",
                color: "text-indigo-400",
                badge: null,
              },
            ].map(({ icon: Icon, label, desc, path, color, badge }) => (
              <button key={path + label} onClick={() => navigate(path)} className="group text-left bg-card border border-border rounded-xl p-5 hover:border-primary/30 hover:bg-card/80 transition-all">
                <div className="flex items-start justify-between mb-3">
                  <Icon className={`w-5 h-5 ${color}`} />
                  {badge && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${badge === "Live" ? "bg-red-500/10 text-red-400 border border-red-500/20" : "bg-primary/10 text-primary border border-primary/20"}`}>
                      {badge}
                    </span>
                  )}
                </div>
                <div className="font-semibold text-sm mb-1 group-hover:text-primary transition-colors">{label}</div>
                <div className="text-xs text-muted-foreground leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>{desc}</div>
                <div className="flex items-center gap-1 text-xs text-primary mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  Open module <ChevronRight className="w-3 h-3" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── AI Features Highlight ── */}
      <section className="border-t border-border py-12">
        <div className="container">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-2xl font-bold mb-4">AI-Powered Intelligence Across Every Event</h2>
              <p className="text-muted-foreground leading-relaxed mb-6 text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>
                Chorus.AI doesn't just stream your events — it understands them. Real-time transcription, sentiment analysis, Q&A triage, and post-event AI summaries are built into every event type, from a 10-person board call to a 100,000-person AGM webcast.
              </p>
              <div className="space-y-3">
                {[
                  { icon: Mic, label: "Live Transcription", desc: "Real-time speech-to-text via Whisper with <1s latency" },
                  { icon: Activity, label: "Sentiment Analysis", desc: "AI monitors tone and audience reaction in real-time" },
                  { icon: BookOpen, label: "Smart Q&A Triage", desc: "Auto-classify, prioritise, and moderate questions with AI" },
                  { icon: FileText, label: "AI Post-Event Summary", desc: "Instant executive summary, highlights, and press release draft" },
                  { icon: BarChart3, label: "Engagement Scoring", desc: "Intent signals from watch time, polls, Q&A, and chat" },
                ].map(({ icon: Icon, label, desc }) => (
                  <div key={label} className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Icon className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold">{label}</div>
                      <div className="text-xs text-muted-foreground" style={{ fontFamily: "'Inter', sans-serif" }}>{desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Platform Neutral", desc: "Zoom RTMS, Teams Bot, Webex, RTMP, PSTN", icon: Globe, color: "text-blue-400" },
                { label: "Ably Real-Time", desc: "Sub-100ms delivery via global edge network", icon: Zap, color: "text-amber-400" },
                { label: "100k+ Attendees", desc: "Enterprise-grade scale with CDN delivery", icon: Users, color: "text-emerald-400" },
                { label: "8 Verticals", desc: "Purpose-built for every industry", icon: Briefcase, color: "text-violet-400" },
                { label: "White-Label", desc: "Full brand customisation per event", icon: Star, color: "text-rose-400" },
                { label: "CRM Integrations", desc: "Salesforce, HubSpot, Marketo, and more", icon: Settings, color: "text-cyan-400" },
              ].map(({ label, desc, icon: Icon, color }) => (
                <div key={label} className="bg-card border border-border rounded-xl p-4">
                  <Icon className={`w-4 h-4 ${color} mb-2`} />
                  <div className="text-xs font-semibold mb-0.5">{label}</div>
                  <div className="text-[10px] text-muted-foreground" style={{ fontFamily: "'Inter', sans-serif" }}>{desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
