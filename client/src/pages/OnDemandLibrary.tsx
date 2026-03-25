/**
 * OnDemandLibrary.tsx — CuraLive On-Demand Media Hub
 * Gated video library with search, filtering by vertical/type, watch progress, and certifications.
 */
import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import {
  Play, Search, Filter, Clock, Eye, Download, BookOpen,
  Award, ChevronRight, Video, Mic, BarChart3, Globe,
  TrendingUp, Heart, Landmark, GraduationCap, Briefcase,
  Tv, Megaphone, Zap, Users, Star, Lock, CheckCircle2,
  Calendar, ArrowRight
} from "lucide-react";

// ─── Demo on-demand content ───────────────────────────────────────────────────
const DEMO_RECORDINGS = [
  {
    id: "q4-2025-earnings-webcast",
    title: "Q4 2025 Earnings Webcast — CuraLive Inc.",
    host: "Sarah Mitchell, CFO",
    org: "CuraLive Inc.",
    type: "webcast",
    vertical: "financial_services",
    duration: "1:12:34",
    durationSecs: 4354,
    views: 2847,
    date: "2026-01-28",
    tags: ["Earnings", "Financial Results", "Q4 2025"],
    hasCert: false,
    isGated: false,
    thumbnail: null,
    chapters: [
      { time: "0:00", title: "Opening Remarks" },
      { time: "8:30", title: "Revenue & EBITDA Review" },
      { time: "24:15", title: "Balance Sheet & Cash Flow" },
      { time: "41:00", title: "Outlook & Guidance" },
      { time: "58:20", title: "Q&A Session" },
    ],
  },
  {
    id: "ceo-town-hall-q3-2025",
    title: "CEO All-Hands Town Hall — Q3 2025",
    host: "David Cameron, CEO",
    org: "CuraLive Inc.",
    type: "webcast",
    vertical: "corporate_communications",
    duration: "1:28:05",
    durationSecs: 5285,
    views: 1243,
    date: "2025-10-15",
    tags: ["Town Hall", "Strategy", "All-Hands"],
    hasCert: false,
    isGated: false,
    thumbnail: null,
    chapters: [
      { time: "0:00", title: "Welcome" },
      { time: "12:00", title: "Q3 Performance" },
      { time: "35:00", title: "Strategy Update" },
      { time: "55:00", title: "People & Culture" },
      { time: "1:08:00", title: "Open Q&A" },
    ],
  },
  {
    id: "africa-healthcare-webinar-2025",
    title: "CME Webinar: Advances in Oncology Treatment in Sub-Saharan Africa",
    host: "Dr. Amara Diallo",
    org: "African Oncology Society",
    type: "webinar",
    vertical: "healthcare",
    duration: "2:05:18",
    durationSecs: 7518,
    views: 892,
    date: "2025-11-20",
    tags: ["CME", "Oncology", "Healthcare", "Africa"],
    hasCert: true,
    certName: "CME Certificate — 2.0 CPD Points",
    isGated: true,
    thumbnail: null,
    chapters: [
      { time: "0:00", title: "Introduction & Learning Objectives" },
      { time: "18:00", title: "Current Treatment Landscape" },
      { time: "52:00", title: "Emerging Therapies" },
      { time: "1:28:00", title: "Case Studies" },
      { time: "1:52:00", title: "Q&A & Assessment" },
    ],
  },
  {
    id: "fintech-summit-2025-keynote",
    title: "Africa FinTech Summit 2025 — Opening Keynote",
    host: "James Okafor",
    org: "Africa FinTech Forum",
    type: "virtual_event",
    vertical: "technology",
    duration: "45:22",
    durationSecs: 2722,
    views: 5621,
    date: "2025-09-05",
    tags: ["FinTech", "Summit", "Keynote", "Africa"],
    hasCert: false,
    isGated: false,
    thumbnail: null,
    chapters: [
      { time: "0:00", title: "Welcome" },
      { time: "8:00", title: "State of African FinTech" },
      { time: "22:00", title: "Regulatory Landscape" },
      { time: "35:00", title: "Investment Outlook" },
    ],
  },
  {
    id: "budget-speech-2026",
    title: "National Budget Speech 2026 — Live Webcast",
    host: "Minister of Finance",
    org: "National Treasury",
    type: "webcast",
    vertical: "government",
    duration: "1:55:44",
    durationSecs: 6944,
    views: 18432,
    date: "2026-02-19",
    tags: ["Budget", "Government", "Policy", "2026"],
    hasCert: false,
    isGated: false,
    thumbnail: null,
    chapters: [
      { time: "0:00", title: "Opening" },
      { time: "15:00", title: "Economic Overview" },
      { time: "45:00", title: "Revenue Proposals" },
      { time: "1:10:00", title: "Expenditure Allocations" },
      { time: "1:40:00", title: "Closing" },
    ],
  },
  {
    id: "investor-day-2025",
    title: "Annual Investor Day 2025 — Full Presentation",
    host: "Executive Leadership Team",
    org: "CuraLive Inc.",
    type: "webcast",
    vertical: "financial_services",
    duration: "3:42:18",
    durationSecs: 13338,
    views: 743,
    date: "2025-11-12",
    tags: ["Investor Day", "Strategy", "Capital Markets"],
    hasCert: false,
    isGated: true,
    thumbnail: null,
    chapters: [
      { time: "0:00", title: "Welcome & Agenda" },
      { time: "20:00", title: "Group Strategy" },
      { time: "1:05:00", title: "Divisional Presentations" },
      { time: "2:30:00", title: "Financial Framework" },
      { time: "3:10:00", title: "Q&A" },
    ],
  },
  {
    id: "law-society-cpd-2025",
    title: "CPD Webinar: AI in Legal Practice — Opportunities & Ethics",
    host: "Prof. Fatima Hassan",
    org: "Law Society of South Africa",
    type: "webinar",
    vertical: "professional_services",
    duration: "1:30:00",
    durationSecs: 5400,
    views: 1105,
    date: "2025-12-03",
    tags: ["CPD", "Legal", "AI", "Ethics"],
    hasCert: true,
    certName: "CPD Certificate — 1.5 Points",
    isGated: true,
    thumbnail: null,
    chapters: [
      { time: "0:00", title: "Introduction" },
      { time: "20:00", title: "AI Tools in Legal Practice" },
      { time: "55:00", title: "Ethical Considerations" },
      { time: "1:15:00", title: "Assessment & Q&A" },
    ],
  },
  {
    id: "university-graduation-2025",
    title: "University of Cape Town — Virtual Graduation Ceremony 2025",
    host: "Vice-Chancellor",
    org: "University of Cape Town",
    type: "virtual_event",
    vertical: "education",
    duration: "2:18:45",
    durationSecs: 8325,
    views: 9872,
    date: "2025-12-10",
    tags: ["Graduation", "Education", "Ceremony"],
    hasCert: false,
    isGated: false,
    thumbnail: null,
    chapters: [
      { time: "0:00", title: "Procession" },
      { time: "25:00", title: "Opening Address" },
      { time: "45:00", title: "Conferral of Degrees" },
      { time: "2:00:00", title: "Closing" },
    ],
  },
];

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

const TYPE_LABELS: Record<string, string> = {
  webcast: "Webcast",
  webinar: "Webinar",
  virtual_event: "Virtual Event",
  hybrid_event: "Hybrid Event",
  on_demand: "On Demand",
};

const VERTICAL_ICONS: Record<string, any> = {
  financial_services: TrendingUp,
  corporate_communications: Megaphone,
  healthcare: Heart,
  technology: Zap,
  professional_services: Briefcase,
  government: Landmark,
  education: GraduationCap,
  media_entertainment: Tv,
};

function formatViews(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toString();
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function OnDemandLibrary() {
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [selectedVertical, setSelectedVertical] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [showCertOnly, setShowCertOnly] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Merge DB events with demo recordings
  const { data: dbEvents = [] } = trpc.webcast.listEvents.useQuery({ limit: 50 });
  const dbOnDemand = dbEvents.filter(e => e.status === "ended" || e.status === "on_demand");

  const allRecordings = DEMO_RECORDINGS;

  const filtered = allRecordings.filter(r => {
    const matchSearch = !search || r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.host.toLowerCase().includes(search.toLowerCase()) ||
      r.tags.some(t => t.toLowerCase().includes(search.toLowerCase()));
    const matchVertical = selectedVertical === "all" || r.vertical === selectedVertical;
    const matchType = selectedType === "all" || r.type === selectedType;
    const matchCert = !showCertOnly || r.hasCert;
    return matchSearch && matchVertical && matchType && matchCert;
  });

  const totalViews = allRecordings.reduce((s, r) => s + r.views, 0);
  const certCount = allRecordings.filter(r => r.hasCert).length;
  const totalHours = Math.round(allRecordings.reduce((s, r) => s + r.durationSecs, 0) / 3600);

  return (
    <div className="min-h-screen bg-background text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>

      {/* ── Header ── */}
      <header className="border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-40">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/live-video/webcasting")} className="text-muted-foreground hover:text-foreground transition-colors text-sm">
              ← Webcasting Hub
            </button>
            <span className="text-border">|</span>
            <div className="flex items-center gap-2">
              <Play className="w-4 h-4 text-primary" />
              <span className="text-sm font-bold">On-Demand Library</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{allRecordings.length} recordings</span>
            <span>·</span>
            <span>{totalHours}h of content</span>
            <span>·</span>
            <span>{certCount} certifications</span>
          </div>
        </div>
      </header>

      {/* ── Hero Stats ── */}
      <section className="border-b border-border bg-card/30">
        <div className="container py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <Video className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Recordings</span>
              </div>
              <div className="text-3xl font-bold text-primary">{allRecordings.length}</div>
              <div className="text-xs text-muted-foreground mt-0.5">Available now</div>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Total Hours</span>
              </div>
              <div className="text-3xl font-bold text-amber-400">{totalHours}h</div>
              <div className="text-xs text-muted-foreground mt-0.5">Of content</div>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <Eye className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Total Views</span>
              </div>
              <div className="text-3xl font-bold text-emerald-400">{formatViews(totalViews)}</div>
              <div className="text-xs text-muted-foreground mt-0.5">Across all recordings</div>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <Award className="w-3.5 h-3.5 text-violet-400" />
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Certifications</span>
              </div>
              <div className="text-3xl font-bold text-violet-400">{certCount}</div>
              <div className="text-xs text-muted-foreground mt-0.5">CPD/CME available</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Search & Filters ── */}
      <section className="border-b border-border bg-card/20 sticky top-14 z-30">
        <div className="container py-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="flex items-center gap-2 bg-secondary border border-border rounded-lg px-3 py-2 flex-1 min-w-[200px] max-w-sm">
              <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search recordings, speakers, topics…"
                className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none flex-1"
              />
            </div>

            {/* Vertical filter */}
            <select
              value={selectedVertical}
              onChange={e => setSelectedVertical(e.target.value)}
              className="bg-secondary border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary/50"
            >
              <option value="all">All Industries</option>
              {Object.entries(VERTICAL_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>

            {/* Type filter */}
            <select
              value={selectedType}
              onChange={e => setSelectedType(e.target.value)}
              className="bg-secondary border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary/50"
            >
              <option value="all">All Formats</option>
              {Object.entries(TYPE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>

            {/* Cert toggle */}
            <button
              onClick={() => setShowCertOnly(c => !c)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium transition-colors ${
                showCertOnly
                  ? "bg-violet-500/10 text-violet-400 border-violet-500/20"
                  : "bg-secondary text-muted-foreground border-border hover:text-foreground"
              }`}
            >
              <Award className="w-3.5 h-3.5" /> CPD/CME only
            </button>

            <span className="text-xs text-muted-foreground ml-auto">{filtered.length} results</span>
          </div>
        </div>
      </section>

      {/* ── Recordings Grid ── */}
      <section className="py-8">
        <div className="container">
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Video className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No recordings found</p>
              <p className="text-sm mt-1">Try adjusting your search or filters.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map(rec => {
                const VertIcon = VERTICAL_ICONS[rec.vertical] || Video;
                const isExpanded = expandedId === rec.id;
                return (
                  <div key={rec.id} className="bg-card border border-border rounded-xl overflow-hidden hover:border-primary/20 transition-colors">
                    <div className="flex items-start gap-4 p-4">
                      {/* Thumbnail / play button */}
                      <button
                        onClick={() => navigate(`/live-video/webcast/${rec.id}`)}
                        className="relative w-32 h-20 bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg flex items-center justify-center shrink-0 group overflow-hidden border border-border"
                      >
                        <div className="w-9 h-9 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center group-hover:bg-primary/30 transition-colors">
                          <Play className="w-4 h-4 text-primary ml-0.5" />
                        </div>
                        <div className="absolute bottom-1.5 right-1.5 bg-black/70 text-white text-[9px] font-mono px-1.5 py-0.5 rounded">
                          {rec.duration}
                        </div>
                        {rec.isGated && (
                          <div className="absolute top-1.5 left-1.5 bg-black/70 text-amber-400 text-[9px] px-1.5 py-0.5 rounded flex items-center gap-1">
                            <Lock className="w-2.5 h-2.5" /> Gated
                          </div>
                        )}
                      </button>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">
                                {TYPE_LABELS[rec.type] || rec.type}
                              </span>
                              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                <VertIcon className="w-3 h-3" />
                                {VERTICAL_LABELS[rec.vertical] || rec.vertical}
                              </div>
                              {rec.hasCert && (
                                <span className="flex items-center gap-1 text-[10px] font-semibold text-violet-400 bg-violet-400/10 border border-violet-400/20 px-1.5 py-0.5 rounded">
                                  <Award className="w-3 h-3" /> {rec.certName}
                                </span>
                              )}
                            </div>
                            <h3 className="text-sm font-semibold leading-snug mb-0.5 line-clamp-2">{rec.title}</h3>
                            <p className="text-xs text-muted-foreground" style={{ fontFamily: "'Inter', sans-serif" }}>
                              {rec.host} · {rec.org}
                            </p>
                          </div>
                        </div>

                        {/* Meta */}
                        <div className="flex items-center gap-4 mt-2 text-[10px] text-muted-foreground flex-wrap" style={{ fontFamily: "'Inter', sans-serif" }}>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(rec.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {formatViews(rec.views)} views
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {rec.duration}
                          </span>
                          {rec.tags.slice(0, 3).map(tag => (
                            <span key={tag} className="bg-secondary px-1.5 py-0.5 rounded">{tag}</span>
                          ))}
                        </div>

                        {/* Chapters (expandable) */}
                        {isExpanded && (
                          <div className="mt-3 pt-3 border-t border-border/50">
                            <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mb-2">Chapters</div>
                            <div className="grid sm:grid-cols-2 gap-1">
                              {rec.chapters.map((ch, i) => (
                                <div key={i} className="flex items-center gap-2 text-xs py-1">
                                  <span className="font-mono text-muted-foreground w-12 shrink-0">{ch.time}</span>
                                  <span className="text-foreground/80">{ch.title}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-2 shrink-0">
                        <button
                          onClick={() => navigate(`/live-video/webcast/${rec.id}`)}
                          className="flex items-center gap-1.5 bg-primary/10 text-primary border border-primary/20 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-primary/20 transition-colors"
                        >
                          <Play className="w-3 h-3" /> Watch
                        </button>
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : rec.id)}
                          className="flex items-center gap-1.5 bg-secondary border border-border text-muted-foreground px-3 py-1.5 rounded-lg text-xs font-medium hover:text-foreground transition-colors"
                        >
                          <BookOpen className="w-3 h-3" />
                          {isExpanded ? "Hide" : "Chapters"}
                        </button>
                        {rec.hasCert && (
                          <button className="flex items-center gap-1.5 bg-violet-500/10 text-violet-400 border border-violet-500/20 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-violet-500/20 transition-colors">
                            <Award className="w-3 h-3" /> Cert
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ── Certification CTA ── */}
      <section className="border-t border-border py-12 bg-card/20">
        <div className="container">
          <div className="max-w-2xl mx-auto text-center">
            <Award className="w-10 h-10 text-violet-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-3">Earn CPD & CME Certificates</h2>
            <p className="text-muted-foreground text-sm leading-relaxed mb-6" style={{ fontFamily: "'Inter', sans-serif" }}>
              CuraLive supports accredited continuing professional development across healthcare, legal, financial services, and education. Watch qualifying recordings, complete the assessment, and download your certificate instantly.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              {[
                { label: "CME / CPD", desc: "Healthcare & Medical" },
                { label: "CPD Points", desc: "Legal & Professional" },
                { label: "CFA CPD", desc: "Financial Services" },
                { label: "CE Credits", desc: "Education" },
              ].map(({ label, desc }) => (
                <div key={label} className="flex items-center gap-2 bg-card border border-border rounded-xl px-4 py-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div className="text-left">
                    <div className="text-xs font-semibold">{label}</div>
                    <div className="text-[10px] text-muted-foreground">{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
