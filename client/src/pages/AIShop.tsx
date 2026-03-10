/**
 * AIShop — CuraLive AI Applications Marketplace
 * Route: /ai-shop
 *
 * Showcases the 5 role-based AI bundles + a full application browser.
 * Mirrors the AI Applications Management Strategy from the business brief.
 */
import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import {
  ArrowLeft, Sparkles, Search, Brain, ShieldCheck, Zap, Megaphone,
  Star, ChevronDown, ChevronUp, Clock, TrendingUp, CheckCircle2,
  ArrowRight, Users, BarChart2, FileText, Mic, Globe, Lock, Lightbulb, Share2,
} from "lucide-react";

// ─── Bundle definitions ────────────────────────────────────────────────────────

interface Bundle {
  id: string;
  letter: string;
  name: string;
  target: string;
  tagline: string;
  roi: string;
  color: string;
  icon: any;
  price: string;
  appIds: string[];
  quickWins: string[];
}

const BUNDLES: Bundle[] = [
  {
    id: "investor-relations",
    letter: "A",
    name: "Investor Relations",
    target: "IR teams, CFO offices, corporate development",
    tagline: "Turn every investor event into a revenue opportunity",
    roi: "+35% investor engagement · 80% faster follow-up",
    color: "from-blue-600 to-blue-800",
    icon: TrendingUp,
    price: "$299/mo",
    appIds: [
      "sentiment-dashboard",
      "commitment-signals",
      "event-brief-generator",
      "investor-briefing-pack",
      "investor-debrief-report",
      "qa-analysis",
      "investor-sentiment-timeline",
    ],
    quickWins: ["sentiment-dashboard", "event-brief-generator", "commitment-signals"],
  },
  {
    id: "compliance-risk",
    letter: "B",
    name: "Compliance & Risk",
    target: "Legal teams, compliance officers, regulatory affairs",
    tagline: "Eliminate regulatory risk from every event",
    roi: "100% audit coverage · Zero compliance violations",
    color: "from-rose-600 to-rose-800",
    icon: ShieldCheck,
    price: "$299/mo",
    appIds: [
      "material-statement-flagging",
      "compliance-risk-assessment",
      "compliance-certificate",
      "redaction-workflow",
      "compliance-audit-trail",
    ],
    quickWins: ["material-statement-flagging", "compliance-risk-assessment", "compliance-certificate"],
  },
  {
    id: "operations-efficiency",
    letter: "C",
    name: "Operations & Efficiency",
    target: "Event operators, production teams, moderators",
    tagline: "Run flawless events with AI-powered operations",
    roi: "80% manual work reduction · 5× faster moderation",
    color: "from-emerald-600 to-emerald-800",
    icon: Zap,
    price: "$299/mo",
    appIds: [
      "live-transcription",
      "transcript-search",
      "qa-analysis",
      "speaking-pace-analysis",
      "filler-word-detection",
      "delivery-coaching",
      "content-performance-analytics",
    ],
    quickWins: ["live-transcription", "qa-analysis", "speaking-pace-analysis"],
  },
  {
    id: "content-marketing",
    letter: "D",
    name: "Content & Marketing",
    target: "Marketing teams, content creators, communications",
    tagline: "Generate 10× more content from every event",
    roi: "90% faster content creation · 5× distribution reach",
    color: "from-violet-600 to-violet-800",
    icon: Megaphone,
    price: "$299/mo",
    appIds: [
      "event-report-generation",
      "press-release-generator",
      "rolling-summary",
      "talking-points-generator",
      "sentiment-report",
      "chat-translation",
      "live-video-summary",
    ],
    quickWins: ["press-release-generator", "rolling-summary", "talking-points-generator"],
  },
  {
    id: "premium-all-access",
    letter: "E",
    name: "Premium All-Access",
    target: "Enterprise customers, large-scale events",
    tagline: "Unlock the full power of AI-driven events",
    roi: "Complete event intelligence across all dimensions",
    color: "from-amber-500 to-orange-600",
    icon: Star,
    price: "Custom",
    appIds: [],
    quickWins: [],
  },
  {
    id: "social-amplification",
    letter: "F",
    name: "Social Amplification",
    target: "IR teams, marketing, communications leads",
    tagline: "Turn every event into a multi-platform social campaign",
    roi: "+40% post-event reach · 3x investor follow-on engagement",
    color: "from-violet-500 to-pink-600",
    icon: Share2,
    price: "$199/mo",
    appIds: ["event-echo-pipeline", "social-compliance-moderator", "social-analytics", "ai-post-generator", "multi-platform-publisher"],
    quickWins: [
      "Generate LinkedIn post from earnings call in <5s",
      "Auto-compliance check before every publish",
      "Track social ROI back to event outcomes",
    ],
  },
];

// ─── Category icons ─────────────────────────────────────────────────────────
const CATEGORY_ICONS: Record<string, any> = {
  "Real-Time Intelligence": BarChart2,
  "Transcription & Speech-to-Text": Mic,
  "Content Generation": FileText,
  "Investor Intelligence": TrendingUp,
  "Compliance & Risk Management": ShieldCheck,
  "Speech & Delivery Analysis": Zap,
  "Translation & Localization": Globe,
  "Video & Media": Sparkles,
  "Operations & Efficiency": Brain,
  "Analytics & Performance": BarChart2,
};

// ─── App card ──────────────────────────────────────────────────────────────────
function AppCard({ app }: { app: any }) {
  const [expanded, setExpanded] = useState(false);
  const Icon = CATEGORY_ICONS[app.category] ?? Brain;
  const priorityColors: Record<string, string> = {
    high: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    medium: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    low: "text-slate-400 bg-slate-700/30 border-slate-700",
  };

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-slate-700/60 flex items-center justify-center shrink-0">
            <Icon className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white leading-tight">{app.name}</h4>
            <p className="text-xs text-slate-500">{app.category}</p>
          </div>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded border font-medium ${priorityColors[app.priority]}`}>
          {app.priority}
        </span>
      </div>

      <p className="text-xs text-slate-400 leading-relaxed">{app.description}</p>

      <div className="flex flex-wrap gap-2">
        <span className="flex items-center gap-1 text-xs bg-slate-700/40 px-2 py-0.5 rounded text-slate-300">
          <Clock className="w-3 h-3" /> {app.timeToValue}
        </span>
        <span className="flex items-center gap-1 text-xs bg-slate-700/40 px-2 py-0.5 rounded text-slate-300">
          <TrendingUp className="w-3 h-3" /> {app.estimatedROI}
        </span>
      </div>

      {expanded && (
        <div className="pt-3 border-t border-slate-700 space-y-3">
          <div>
            <p className="text-xs font-semibold text-slate-300 mb-1.5">Key Benefits</p>
            <ul className="space-y-1">
              {app.benefits.slice(0, 3).map((b: string, i: number) => (
                <li key={i} className="text-xs text-slate-400 flex items-start gap-1.5">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />
                  {b}
                </li>
              ))}
            </ul>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {app.stats.slice(0, 4).map((s: any, i: number) => (
              <div key={i} className="bg-slate-700/30 rounded p-2">
                <p className="text-[10px] text-slate-500">{s.metric}</p>
                <p className="text-xs font-semibold text-white">{s.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={() => setExpanded(!expanded)}
        className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
      >
        {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        {expanded ? "Less detail" : "More detail"}
      </button>
    </div>
  );
}

// ─── Bundle card ───────────────────────────────────────────────────────────────
function BundleCard({ bundle, apps }: { bundle: Bundle; apps: any[] }) {
  const [, navigate] = useLocation();
  const [expanded, setExpanded] = useState(false);
  const Icon = bundle.icon;
  const includedApps = bundle.id === "premium-all-access"
    ? apps
    : apps.filter(a => bundle.appIds.includes(a.id));

  return (
    <div className={`rounded-2xl border border-slate-700 bg-slate-800/40 overflow-hidden flex flex-col`}>
      <div className={`bg-gradient-to-br ${bundle.color} p-5`}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
              <Icon className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-white/70 font-medium">Bundle {bundle.letter}</p>
              <h3 className="text-white font-bold text-base leading-tight">{bundle.name}</h3>
            </div>
          </div>
          <span className="bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full">
            {bundle.price}
          </span>
        </div>
        <p className="text-white/80 text-xs leading-relaxed mb-3">"{bundle.tagline}"</p>
        <p className="text-white/60 text-xs">{bundle.target}</p>
      </div>

      <div className="p-4 flex-1 space-y-3">
        <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-medium">
          <TrendingUp className="w-3.5 h-3.5" />
          {bundle.roi}
        </div>

        <div>
          <p className="text-xs font-semibold text-slate-300 mb-2">
            {bundle.id === "premium-all-access" ? "All" : includedApps.length} Applications Included
          </p>
          <div className="flex flex-wrap gap-1.5">
            {(expanded ? includedApps : includedApps.slice(0, 4)).map(app => (
              <span key={app.id} className="text-xs bg-slate-700/50 text-slate-300 px-2 py-0.5 rounded">
                {app.name}
              </span>
            ))}
            {!expanded && includedApps.length > 4 && (
              <button
                onClick={() => setExpanded(true)}
                className="text-xs text-primary px-2 py-0.5 rounded hover:bg-slate-700/50 transition-colors"
              >
                +{includedApps.length - 4} more
              </button>
            )}
          </div>
        </div>

        {bundle.quickWins.length > 0 && (
          <div className="bg-slate-700/30 rounded-lg p-3">
            <p className="text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1">
              <Lightbulb className="w-3 h-3 text-amber-400" /> Quick Wins (Day 1)
            </p>
            <div className="space-y-1">
              {bundle.quickWins.map(id => {
                const app = apps.find(a => a.id === id);
                return app ? (
                  <div key={id} className="text-xs text-slate-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                    {app.name}
                  </div>
                ) : null;
              })}
            </div>
          </div>
        )}
      </div>

      <div className="px-4 pb-4">
        <button
          onClick={() => navigate("/ai-onboarding")}
          className={`w-full bg-gradient-to-r ${bundle.color} text-white text-sm font-semibold py-2.5 rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2`}
        >
          Get Started <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────
export default function AIShop() {
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<"bundles" | "marketplace">("bundles");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const { data: allApps = [], isLoading } = trpc.aiApplications.getAll.useQuery();
  const { data: categories = [] } = trpc.aiApplications.getAllCategories.useQuery();

  const filteredApps = allApps.filter(app => {
    const matchesSearch = !searchQuery ||
      app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || app.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-[#0a0d14] text-slate-200">
      {/* Header */}
      <div className="border-b border-slate-800 px-6 py-4 flex items-center gap-4 sticky top-0 bg-[#0a0d14]/95 backdrop-blur z-10">
        <button onClick={() => navigate("/")} className="text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-3 flex-1">
          <div className="w-9 h-9 bg-gradient-to-br from-primary to-primary/70 rounded-xl flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">AI Shop</h1>
            <p className="text-xs text-slate-400">28 AI applications · 6 role-based bundles</p>
          </div>
        </div>
        <button
          onClick={() => navigate("/ai-onboarding")}
          className="flex items-center gap-2 bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
        >
          <Brain className="w-4 h-4" /> Get Recommendation
        </button>
      </div>

      {/* Hero banner */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 border-b border-slate-700/50 px-6 py-8">
        <div className="max-w-4xl">
          <div className="flex items-center gap-2 mb-3">
            <span className="bg-primary/20 text-primary text-xs font-semibold px-3 py-1 rounded-full border border-primary/30">
              AI Applications
            </span>
            <span className="text-slate-500 text-xs">Version 3.0</span>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            28 AI applications, one intelligent platform
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed max-w-2xl">
            Purpose-built for investor events, earnings calls, and enterprise webcasts.
            Choose a role-based bundle to get started in minutes, or browse individual applications.
            Progressive unlock means you start with 3 high-impact features and grow from there.
          </p>
          <div className="flex flex-wrap gap-4 mt-5">
            {[
              { label: "28 AI Applications", icon: Sparkles },
              { label: "5 Role-Based Bundles", icon: Users },
              { label: "<1s Real-Time Latency", icon: Zap },
              { label: "GDPR · HIPAA · SOC 2", icon: Lock },
            ].map(({ label, icon: Icon }) => (
              <div key={label} className="flex items-center gap-1.5 text-xs text-slate-300">
                <Icon className="w-3.5 h-3.5 text-primary" />
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="px-6 pt-5 pb-0 flex items-center gap-1 border-b border-slate-800">
        {(["bundles", "marketplace"] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2.5 text-sm font-semibold rounded-t-lg transition-colors capitalize -mb-px ${
              activeTab === tab
                ? "bg-slate-800 border border-b-[#0a0d14] border-slate-700 text-white"
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            {tab === "bundles" ? "Role-Based Bundles" : "App Marketplace"}
          </button>
        ))}
      </div>

      <div className="p-6">
        {/* ── Bundles view ── */}
        {activeTab === "bundles" && (
          <div className="space-y-6">
            <div className="bg-slate-800/40 border border-amber-500/20 rounded-xl p-4 flex items-start gap-3">
              <Lightbulb className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-300 mb-1">Why bundles?</p>
                <p className="text-xs text-slate-400 leading-relaxed">
                  With 28 AI applications across 10 categories, starting with all features at once causes decision paralysis
                  and low adoption. Our role-based bundles give you the 5–7 features that matter most for your job,
                  activated progressively so you see ROI from day one.
                </p>
              </div>
            </div>

            {/* ── Progressive Feature Unlock Journey ── */}
            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
                <Zap className="w-4 h-4 text-violet-400" /> Your Activation Journey
              </h3>
              <p className="text-xs text-slate-400 mb-5">Features unlock progressively — master each phase before advancing to the next.</p>
              <div className="relative">
                <div className="absolute top-4 left-0 right-0 h-0.5 bg-slate-700 mx-8" />
                <div className="relative flex justify-between">
                  {[
                    { phase: 1, label: "Day 1 Quick Wins", desc: "3 core features activated", icon: "🚀", active: true },
                    { phase: 2, label: "Week 1 Expansion", desc: "Full bundle unlocked", icon: "⚡", active: false },
                    { phase: 3, label: "Month 1 Mastery", desc: "Cross-bundle features", icon: "🔥", active: false },
                    { phase: 4, label: "Full Power", desc: "All 28 apps + add-ons", icon: "💎", active: false },
                  ].map(({ phase, label, desc, icon, active }) => (
                    <div key={phase} className="flex flex-col items-center gap-2 w-1/4 px-2">
                      <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-sm ${active ? "bg-violet-500 shadow-lg shadow-violet-500/30" : "bg-slate-800 border border-slate-600"}`}>
                        {active ? <span className="text-white font-bold text-xs">{phase}</span> : <span className="text-xs">{icon}</span>}
                      </div>
                      <div className="text-center">
                        <div className={`text-[10px] font-semibold ${active ? "text-violet-300" : "text-slate-400"}`}>{label}</div>
                        <div className="text-[9px] text-slate-500">{desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-5 flex items-center justify-between rounded-xl bg-violet-500/10 border border-violet-500/20 px-4 py-3">
                <div>
                  <div className="text-xs font-semibold text-violet-300">Currently in Phase 1</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Choose a bundle below to activate your Day 1 quick wins</div>
                </div>
                <button onClick={() => navigate("/ai-onboarding")} className="text-xs px-3 py-1.5 rounded-lg bg-violet-500 text-white hover:bg-violet-600 transition-colors">
                  Take Quiz
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {BUNDLES.map(bundle => (
                <BundleCard key={bundle.id} bundle={bundle} apps={allApps} />
              ))}
            </div>

            {/* Feature interconnection map */}
            <div className="bg-slate-800/40 border border-slate-700 rounded-xl p-5 mt-2">
              <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <Brain className="w-4 h-4 text-primary" /> How AI Features Work Together
              </h3>
              <div className="grid md:grid-cols-3 gap-4 text-xs text-slate-400">
                <div className="space-y-2">
                  <p className="text-slate-300 font-semibold">During the event</p>
                  <div className="space-y-1.5">
                    {["Live Transcription", "Q&A Triage", "Sentiment Analysis"].map(f => (
                      <div key={f} className="flex items-center gap-1.5 bg-slate-700/40 rounded px-2 py-1">
                        <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                        {f}
                      </div>
                    ))}
                    <div className="pl-2 border-l-2 border-slate-600 space-y-1.5 ml-1 mt-2">
                      {["Compliance Flags", "Toxicity Filter", "Pace Analysis"].map(f => (
                        <div key={f} className="flex items-center gap-1.5 bg-slate-700/30 rounded px-2 py-1">
                          <div className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                          {f}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-slate-300 font-semibold">Post-event generation</p>
                  <div className="space-y-1.5">
                    {["Event Summary", "Press Release", "Investor Briefing Pack", "Compliance Certificate", "Commitment Signals"].map(f => (
                      <div key={f} className="flex items-center gap-1.5 bg-slate-700/40 rounded px-2 py-1">
                        <div className="w-1.5 h-1.5 bg-violet-400 rounded-full" />
                        {f}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-slate-300 font-semibold">Follow-up & distribution</p>
                  <div className="space-y-1.5">
                    {["Automated Follow-Up", "CRM Sync", "Event Report", "ROI Dashboard"].map(f => (
                      <div key={f} className="flex items-center gap-1.5 bg-slate-700/40 rounded px-2 py-1">
                        <div className="w-1.5 h-1.5 bg-amber-400 rounded-full" />
                        {f}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Marketplace view ── */}
        {activeTab === "marketplace" && (
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search 28 AI applications…"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary/50"
                />
              </div>
              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-xl text-sm text-white px-3 py-2.5 focus:outline-none focus:border-primary/50"
              >
                <option value="all">All Categories ({allApps.length})</option>
                {categories.map((cat: string) => {
                  const count = allApps.filter(a => a.category === cat).length;
                  return (
                    <option key={cat} value={cat}>{cat} ({count})</option>
                  );
                })}
              </select>
            </div>

            {isLoading ? (
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-40 bg-slate-800/50 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : (
              <>
                <p className="text-xs text-slate-500">
                  {filteredApps.length} application{filteredApps.length !== 1 ? "s" : ""}
                  {searchQuery ? ` matching "${searchQuery}"` : ""}
                </p>
                {categories
                  .filter(cat => selectedCategory === "all" || cat === selectedCategory)
                  .map(cat => {
                    const catApps = filteredApps.filter(a => a.category === cat);
                    if (!catApps.length) return null;
                    const CatIcon = CATEGORY_ICONS[cat] ?? Brain;
                    return (
                      <div key={cat}>
                        <div className="flex items-center gap-2 mb-3">
                          <CatIcon className="w-4 h-4 text-primary" />
                          <h3 className="text-sm font-semibold text-white">{cat}</h3>
                          <span className="text-xs text-slate-600 bg-slate-800 px-2 py-0.5 rounded-full">
                            {catApps.length}
                          </span>
                        </div>
                        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
                          {catApps.map(app => (
                            <AppCard key={app.id} app={app} />
                          ))}
                        </div>
                      </div>
                    );
                  })}
              </>
            )}
          </div>
        )}
      </div>

      {/* Sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#0a0d14]/95 backdrop-blur border-t border-slate-800 px-6 py-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-white">Not sure where to start?</p>
          <p className="text-xs text-slate-500">Take the 3-minute quiz and we'll recommend your bundle</p>
        </div>
        <button
          onClick={() => navigate("/ai-onboarding")}
          className="flex items-center gap-2 bg-primary text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-primary/90 transition-colors"
        >
          <Brain className="w-4 h-4" /> Start Quiz <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      <div className="h-20" />
    </div>
  );
}
