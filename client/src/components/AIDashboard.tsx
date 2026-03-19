// @ts-nocheck
import { useState, useMemo, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Brain, ChevronDown, ChevronRight, Search, Download, FileText,
  Activity, Shield, Users, MessageSquare, Target, Zap, Lightbulb,
  BarChart3, AlertTriangle, Swords, Gauge, Mic, TrendingUp,
  Banknote, Leaf, Newspaper, Share2, Briefcase, CheckCircle2,
  Loader2, Eye, EyeOff, Volume2, Clock, Tag, Play,
  Settings, Package, Crown, Star,
} from "lucide-react";

const AI_MODULES = [
  { key: "executiveSummary", label: "Executive Summary", icon: FileText, color: "text-blue-400", tier: "essential", description: "3-5 sentence high-level overview of the event" },
  { key: "sentimentAnalysis", label: "Sentiment Analysis", icon: Activity, color: "text-emerald-400", tier: "essential", description: "0-100 score with narrative and key sentiment drivers" },
  { key: "complianceReview", label: "Compliance Review", icon: Shield, color: "text-amber-400", tier: "essential", description: "Risk level assessment with flagged phrases" },
  { key: "keyTopics", label: "Key Topics", icon: Tag, color: "text-violet-400", tier: "essential", description: "Categorized topics with sentiment and detail" },
  { key: "speakerAnalysis", label: "Speaker Analysis", icon: Users, color: "text-cyan-400", tier: "professional", description: "Breakdown by speaker with role and key points" },
  { key: "questionsAsked", label: "Q&A Analysis", icon: MessageSquare, color: "text-blue-300", tier: "professional", description: "Questions asked, who asked them, and quality rating" },
  { key: "actionItems", label: "Action Items", icon: Target, color: "text-orange-400", tier: "professional", description: "Tasks identified with owners and deadlines" },
  { key: "investorSignals", label: "Investor Signals", icon: Zap, color: "text-yellow-400", tier: "professional", description: "Commitment or concern signals with interpretation" },
  { key: "communicationScore", label: "Communication Score", icon: Gauge, color: "text-teal-400", tier: "professional", description: "Clarity, transparency, and quality assessment" },
  { key: "riskFactors", label: "Risk Factors", icon: AlertTriangle, color: "text-red-400", tier: "professional", description: "Identified risks with impact and likelihood" },
  { key: "competitiveIntelligence", label: "Competitive Intelligence", icon: Swords, color: "text-pink-400", tier: "enterprise", description: "Competitor mentions and market references" },
  { key: "recommendations", label: "Strategic Recommendations", icon: Lightbulb, color: "text-amber-300", tier: "enterprise", description: "Actionable advice based on event outcomes" },
  { key: "speakingPaceAnalysis", label: "Speaking Pace Coaching", icon: Mic, color: "text-indigo-400", tier: "enterprise", description: "WPM analysis, filler words, delivery score" },
  { key: "toxicityScreen", label: "Toxicity & Language Risk", icon: Shield, color: "text-rose-400", tier: "enterprise", description: "Inappropriate content, price-sensitive info detection" },
  { key: "sentimentArc", label: "Sentiment Arc", icon: TrendingUp, color: "text-green-400", tier: "enterprise", description: "Sentiment trajectory from opening to closing" },
  { key: "financialHighlights", label: "Financial Highlights", icon: Banknote, color: "text-emerald-300", tier: "enterprise", description: "Key metrics with YoY change analysis" },
  { key: "esgMentions", label: "ESG & Sustainability", icon: Leaf, color: "text-lime-400", tier: "enterprise", description: "Environmental, social, governance commitments" },
  { key: "pressReleaseDraft", label: "Press Release Draft", icon: Newspaper, color: "text-sky-400", tier: "enterprise", description: "Auto-generated SENS/RNS-style summary" },
  { key: "socialMediaContent", label: "Social Media Content", icon: Share2, color: "text-fuchsia-400", tier: "enterprise", description: "Ready-to-post content for LinkedIn/Twitter" },
  { key: "boardReadySummary", label: "Board-Ready Summary", icon: Briefcase, color: "text-purple-400", tier: "enterprise", description: "High-level verdict with risks and opportunities" },
];

const TIER_CONFIG = {
  essential: { label: "Essential", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20", icon: Star, modules: 4 },
  professional: { label: "Professional", color: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/20", icon: Crown, modules: 10 },
  enterprise: { label: "Enterprise", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20", icon: Package, modules: 20 },
};

type Tier = "essential" | "professional" | "enterprise";

function getModulesForTier(tier: Tier): Set<string> {
  const tiers: Tier[] = ["essential", "professional", "enterprise"];
  const idx = tiers.indexOf(tier);
  return new Set(AI_MODULES.filter((_, i) => {
    const modTier = AI_MODULES[i].tier as Tier;
    return tiers.indexOf(modTier) <= idx;
  }).map(m => m.key));
}

interface AIDashboardProps {
  sessions: Array<{
    id: number;
    clientName: string;
    eventName: string;
    eventType: string;
    platform: string;
    status: string;
    transcriptSegments: number | null;
    taggedMetricsGenerated: number | null;
    sentimentAvg: number | null;
    createdAt: Date;
  }>;
}

function ModuleCard({ module, data, isEnabled, onToggle }: {
  module: typeof AI_MODULES[0];
  data: any;
  isEnabled: boolean;
  onToggle: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const Icon = module.icon;
  const hasData = data != null && (typeof data === "string" ? data.length > 0 : typeof data === "object" ? (Array.isArray(data) ? data.length > 0 : Object.keys(data).length > 0) : true);

  return (
    <div className={`border rounded-xl overflow-hidden transition-all ${
      isEnabled
        ? "bg-white/[0.03] border-white/10"
        : "bg-white/[0.01] border-white/5 opacity-50"
    }`}>
      <div className="px-4 py-3 flex items-center gap-3">
        <button onClick={onToggle} className="shrink-0">
          <div className={`w-9 h-5 rounded-full transition-colors relative ${isEnabled ? "bg-emerald-500/40" : "bg-slate-700"}`}>
            <div className={`absolute top-0.5 w-4 h-4 rounded-full transition-all ${isEnabled ? "left-[18px] bg-emerald-400" : "left-0.5 bg-slate-500"}`} />
          </div>
        </button>
        <Icon className={`w-4 h-4 ${module.color} shrink-0`} />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-slate-200 truncate">{module.label}</div>
          <div className="text-[11px] text-slate-600 truncate">{module.description}</div>
        </div>
        <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium uppercase tracking-wider ${TIER_CONFIG[module.tier as Tier].bg} ${TIER_CONFIG[module.tier as Tier].color}`}>
          {module.tier}
        </span>
        {hasData && isEnabled && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-slate-500 hover:text-slate-300 transition-colors shrink-0"
          >
            {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        )}
      </div>

      {expanded && isEnabled && hasData && (
        <div className="px-4 pb-4 border-t border-white/5">
          <div className="mt-3 text-sm text-slate-300 space-y-2">
            <ModuleDataRenderer moduleKey={module.key} data={data} />
          </div>
        </div>
      )}
    </div>
  );
}

function ModuleDataRenderer({ moduleKey, data }: { moduleKey: string; data: any }) {
  if (!data) return <span className="text-slate-600 italic">No data available</span>;

  if (typeof data === "string") {
    return <p className="leading-relaxed whitespace-pre-wrap">{data}</p>;
  }

  if (moduleKey === "sentimentAnalysis" && typeof data === "object") {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className={`text-2xl font-bold ${data.score >= 70 ? "text-emerald-400" : data.score >= 50 ? "text-amber-400" : "text-red-400"}`}>
            {data.score}/100
          </div>
        </div>
        <p className="text-slate-400 text-xs leading-relaxed">{data.narrative}</p>
        {data.keyDrivers?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1">
            {data.keyDrivers.map((d: string, i: number) => (
              <span key={i} className="text-[11px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-400">{d}</span>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (moduleKey === "complianceReview" && typeof data === "object") {
    const riskColors: Record<string, string> = { Low: "text-emerald-400", Moderate: "text-amber-400", High: "text-orange-400", Critical: "text-red-400" };
    return (
      <div className="space-y-2">
        <span className={`text-sm font-semibold ${riskColors[data.riskLevel] || "text-slate-400"}`}>Risk Level: {data.riskLevel}</span>
        {data.flaggedPhrases?.length > 0 && (
          <div>
            <div className="text-xs text-slate-500 mb-1">Flagged Phrases:</div>
            <ul className="space-y-0.5">{data.flaggedPhrases.map((p: string, i: number) => <li key={i} className="text-xs text-red-300">• {p}</li>)}</ul>
          </div>
        )}
        {data.recommendations?.length > 0 && (
          <div>
            <div className="text-xs text-slate-500 mb-1">Recommendations:</div>
            <ul className="space-y-0.5">{data.recommendations.map((r: string, i: number) => <li key={i} className="text-xs text-slate-400">• {r}</li>)}</ul>
          </div>
        )}
      </div>
    );
  }

  if (moduleKey === "communicationScore" && typeof data === "object") {
    return (
      <div className="space-y-2">
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Overall", value: data.score },
            { label: "Clarity", value: data.clarity },
            { label: "Transparency", value: data.transparency },
          ].map(s => (
            <div key={s.label} className="bg-white/[0.03] rounded-lg p-2 text-center">
              <div className={`text-lg font-bold ${(s.value ?? 0) >= 70 ? "text-emerald-400" : (s.value ?? 0) >= 50 ? "text-amber-400" : "text-red-400"}`}>{s.value ?? "—"}</div>
              <div className="text-[10px] text-slate-600">{s.label}</div>
            </div>
          ))}
        </div>
        {data.narrative && <p className="text-xs text-slate-400 leading-relaxed">{data.narrative}</p>}
      </div>
    );
  }

  if (moduleKey === "sentimentArc" && typeof data === "object") {
    const trendColors: Record<string, string> = { Improving: "text-emerald-400", Stable: "text-blue-400", Declining: "text-red-400", Volatile: "text-amber-400" };
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="flex justify-between text-[10px] text-slate-600 mb-1">
              <span>Opening</span><span>Midpoint</span><span>Closing</span>
            </div>
            <div className="flex items-end gap-1 h-12">
              {[data.opening, data.midpoint, data.closing].map((v: number, i: number) => (
                <div key={i} className="flex-1 flex flex-col items-center">
                  <div className="text-xs font-medium text-slate-300 mb-0.5">{v}</div>
                  <div className={`w-full rounded-t ${v >= 70 ? "bg-emerald-500/40" : v >= 50 ? "bg-amber-500/40" : "bg-red-500/40"}`} style={{ height: `${Math.max(4, (v / 100) * 48)}px` }} />
                </div>
              ))}
            </div>
          </div>
          <span className={`text-sm font-semibold ${trendColors[data.trend] || "text-slate-400"}`}>{data.trend}</span>
        </div>
        {data.narrative && <p className="text-xs text-slate-400">{data.narrative}</p>}
      </div>
    );
  }

  if (moduleKey === "speakingPaceAnalysis" && typeof data === "object") {
    return (
      <div className="space-y-2">
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white/[0.03] rounded-lg p-2 text-center">
            <div className="text-lg font-bold text-indigo-400">{data.overallWpm ?? "—"}</div>
            <div className="text-[10px] text-slate-600">WPM</div>
          </div>
          <div className="bg-white/[0.03] rounded-lg p-2 text-center">
            <div className="text-lg font-bold text-slate-300">{data.paceLabel ?? "—"}</div>
            <div className="text-[10px] text-slate-600">Pace</div>
          </div>
          <div className="bg-white/[0.03] rounded-lg p-2 text-center">
            <div className="text-lg font-bold text-cyan-400">{data.deliveryScore ?? "—"}</div>
            <div className="text-[10px] text-slate-600">Delivery</div>
          </div>
        </div>
        {data.coachingTips?.length > 0 && (
          <ul className="space-y-0.5">{data.coachingTips.map((t: string, i: number) => <li key={i} className="text-xs text-slate-400">• {t}</li>)}</ul>
        )}
      </div>
    );
  }

  if (moduleKey === "toxicityScreen" && typeof data === "object") {
    const riskColors: Record<string, string> = { Clean: "text-emerald-400", Low: "text-blue-400", Moderate: "text-amber-400", High: "text-red-400" };
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <span className={`text-sm font-semibold ${riskColors[data.overallRisk] || "text-slate-400"}`}>{data.overallRisk}</span>
          {data.priceSensitive && <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">Price Sensitive</span>}
          {data.legalRisk && <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-400 border border-orange-500/20">Legal Risk</span>}
        </div>
        {data.flaggedContent?.length > 0 && (
          <ul className="space-y-1">{data.flaggedContent.map((f: any, i: number) => (
            <li key={i} className="text-xs"><span className="text-red-300">"{f.phrase}"</span> <span className="text-slate-600">— {f.issue} ({f.severity})</span></li>
          ))}</ul>
        )}
      </div>
    );
  }

  if (moduleKey === "boardReadySummary" && typeof data === "object") {
    const verdictColors: Record<string, string> = { Strong: "text-emerald-400", Satisfactory: "text-blue-400", Concerning: "text-amber-400", Critical: "text-red-400" };
    return (
      <div className="space-y-2">
        <div className={`text-lg font-bold ${verdictColors[data.verdict] || "text-slate-400"}`}>{data.verdict}</div>
        {data.keyRisks?.length > 0 && (
          <div><div className="text-xs text-red-400/70 mb-0.5">Risks</div><ul>{data.keyRisks.map((r: string, i: number) => <li key={i} className="text-xs text-slate-400">• {r}</li>)}</ul></div>
        )}
        {data.keyOpportunities?.length > 0 && (
          <div><div className="text-xs text-emerald-400/70 mb-0.5">Opportunities</div><ul>{data.keyOpportunities.map((o: string, i: number) => <li key={i} className="text-xs text-slate-400">• {o}</li>)}</ul></div>
        )}
        {data.recommendedActions?.length > 0 && (
          <div><div className="text-xs text-blue-400/70 mb-0.5">Actions</div><ul>{data.recommendedActions.map((a: string, i: number) => <li key={i} className="text-xs text-slate-400">• {a}</li>)}</ul></div>
        )}
      </div>
    );
  }

  if (Array.isArray(data)) {
    if (data.length === 0) return <span className="text-slate-600 italic text-xs">No items</span>;
    return (
      <div className="space-y-1.5">
        {data.slice(0, 10).map((item, i) => (
          <div key={i} className="bg-white/[0.02] rounded-lg px-3 py-2 text-xs">
            {typeof item === "string" ? (
              <span className="text-slate-300">• {item}</span>
            ) : typeof item === "object" ? (
              <div className="space-y-0.5">
                {Object.entries(item).map(([k, v]) => (
                  <div key={k}><span className="text-slate-500 capitalize">{k.replace(/([A-Z])/g, " $1").trim()}: </span><span className="text-slate-300">{String(v)}</span></div>
                ))}
              </div>
            ) : <span className="text-slate-300">{String(item)}</span>}
          </div>
        ))}
        {data.length > 10 && <div className="text-xs text-slate-600">+ {data.length - 10} more items</div>}
      </div>
    );
  }

  return <pre className="text-xs text-slate-400 overflow-x-auto whitespace-pre-wrap">{JSON.stringify(data, null, 2)}</pre>;
}

export default function AIDashboard({ sessions }: AIDashboardProps) {
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
  const [selectedTier, setSelectedTier] = useState<Tier>("enterprise");
  const [enabledModules, setEnabledModules] = useState<Set<string>>(() => getModulesForTier("enterprise"));
  const [searchQuery, setSearchQuery] = useState("");
  const [showTranscript, setShowTranscript] = useState(false);
  const [transcriptSearch, setTranscriptSearch] = useState("");

  const completedSessions = useMemo(() =>
    sessions.filter(s => s.status === "completed").sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ), [sessions]);

  const sessionDetail = trpc.shadowMode.getSession.useQuery(
    { sessionId: selectedSessionId! },
    { enabled: selectedSessionId != null }
  );

  const archives = trpc.archiveUpload.listArchives.useQuery();

  const selectedArchive = useMemo(() => {
    if (!selectedSessionId || !archives.data) return null;
    const eventId = `shadow-${selectedSessionId}`;
    return archives.data.find((a: any) => a.event_id === eventId) ?? null;
  }, [selectedSessionId, archives.data]);

  const archiveDetail = trpc.archiveUpload.getArchiveDetail.useQuery(
    { archiveId: selectedArchive?.id! },
    { enabled: selectedArchive?.id != null }
  );

  const aiReport = useMemo(() => {
    if (archiveDetail.data?.ai_report) return archiveDetail.data.ai_report;
    return null;
  }, [archiveDetail.data]);

  const setTier = useCallback((tier: Tier) => {
    setSelectedTier(tier);
    setEnabledModules(getModulesForTier(tier));
  }, []);

  const toggleModule = useCallback((key: string) => {
    setEnabledModules(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
    setSelectedTier("enterprise");
  }, []);

  const session = sessionDetail.data;
  const transcript = useMemo(() => {
    if (!session) return [];
    const segments = Array.isArray(session.transcriptSegments) ? session.transcriptSegments : [];
    if (!transcriptSearch) return segments;
    const q = transcriptSearch.toLowerCase();
    return segments.filter((s: any) => s.text?.toLowerCase().includes(q) || s.speaker?.toLowerCase().includes(q));
  }, [session, transcriptSearch]);

  const filteredModules = useMemo(() => {
    if (!searchQuery) return AI_MODULES;
    const q = searchQuery.toLowerCase();
    return AI_MODULES.filter(m => m.label.toLowerCase().includes(q) || m.description.toLowerCase().includes(q) || m.tier.includes(q));
  }, [searchQuery]);

  const enabledCount = enabledModules.size;

  const exportReport = useCallback(() => {
    if (!session || !aiReport) return;
    const lines: string[] = [];
    lines.push(`CuraLive AI Intelligence Report`);
    lines.push(`${"=".repeat(50)}`);
    lines.push(`Client: ${session.clientName}`);
    lines.push(`Event: ${session.eventName}`);
    lines.push(`Date: ${new Date(session.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}`);
    lines.push("");

    for (const mod of AI_MODULES) {
      if (!enabledModules.has(mod.key)) continue;
      const data = aiReport[mod.key];
      if (!data) continue;
      lines.push(`\n${"─".repeat(40)}`);
      lines.push(`${mod.label.toUpperCase()}`);
      lines.push(`${"─".repeat(40)}`);
      if (typeof data === "string") {
        lines.push(data);
      } else {
        lines.push(JSON.stringify(data, null, 2));
      }
    }

    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${session.clientName}_${session.eventName}_AI_Report.txt`.replace(/\s+/g, "_");
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Report exported");
  }, [session, aiReport, enabledModules]);

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-amber-500/5 via-white/[0.01] to-violet-500/5 border border-white/10 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <Brain className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-200">AI Intelligence Dashboard</h2>
            <p className="text-xs text-slate-500">Select a session to view recordings, transcripts, and all 20 AI analysis modules</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-slate-500 block mb-1.5">Select Session</label>
            <select
              value={selectedSessionId ?? ""}
              onChange={(e) => setSelectedSessionId(e.target.value ? Number(e.target.value) : null)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-amber-500/50"
            >
              <option value="">Choose a completed session...</option>
              {completedSessions.map(s => (
                <option key={s.id} value={s.id}>
                  {s.eventName} — {s.clientName} ({new Date(s.createdAt).toLocaleDateString("en-GB")})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-slate-500 block mb-1.5">Package Tier</label>
            <div className="flex gap-2">
              {(Object.entries(TIER_CONFIG) as [Tier, typeof TIER_CONFIG.essential][]).map(([tier, config]) => {
                const TierIcon = config.icon;
                return (
                  <button
                    key={tier}
                    onClick={() => setTier(tier)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-all flex-1 justify-center ${
                      selectedTier === tier
                        ? `${config.bg} ${config.color}`
                        : "bg-white/5 border-white/10 text-slate-500 hover:bg-white/10"
                    }`}
                  >
                    <TierIcon className="w-3.5 h-3.5" />
                    {config.label}
                    <span className="text-[10px] opacity-60">({config.modules})</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {!selectedSessionId ? (
        <div className="bg-white/[0.02] border border-white/10 rounded-xl p-12 text-center">
          <Brain className="w-12 h-12 text-slate-700 mx-auto mb-3" />
          <div className="text-slate-500 text-sm">Select a completed session above</div>
          <div className="text-slate-600 text-xs mt-1">View the recording, transcript, and AI analysis for any past event</div>
          {completedSessions.length === 0 && (
            <div className="mt-4 text-xs text-amber-400/70">No completed sessions yet — complete a live session first</div>
          )}
        </div>
      ) : sessionDetail.isLoading ? (
        <div className="bg-white/[0.02] border border-white/10 rounded-xl p-12 text-center">
          <Loader2 className="w-8 h-8 text-amber-400 mx-auto mb-3 animate-spin" />
          <div className="text-slate-400 text-sm">Loading session data...</div>
        </div>
      ) : session ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Volume2 className="w-4 h-4 text-cyan-400" />
                <span className="text-sm font-medium text-slate-200">Recording</span>
              </div>
              {session.recordingUrl ? (
                <div className="space-y-2">
                  {session.recordingUrl.startsWith("/api/shadow/recording/") ? (
                    <audio src={session.recordingUrl} controls preload="metadata" className="w-full" />
                  ) : (
                    <video src={session.recordingUrl} controls playsInline preload="metadata" className="w-full rounded-lg bg-black/50 max-h-[200px]" />
                  )}
                  <a href={session.recordingUrl} download
                    className="flex items-center justify-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/20 transition-colors w-full">
                    <Download className="w-3 h-3" />
                    Download Recording
                  </a>
                </div>
              ) : (
                <div className="text-center py-6">
                  <Volume2 className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                  <div className="text-xs text-slate-600">No recording available</div>
                </div>
              )}
            </div>

            <div className="lg:col-span-2 bg-white/[0.03] border border-white/10 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-violet-400" />
                  <span className="text-sm font-medium text-slate-200">Transcript</span>
                  <span className="text-xs text-slate-600">
                    ({Array.isArray(session.transcriptSegments) ? session.transcriptSegments.length : 0} segments)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {Array.isArray(session.transcriptSegments) && session.transcriptSegments.length > 0 && (
                    <>
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-slate-600" />
                        <input
                          type="text"
                          placeholder="Search..."
                          value={transcriptSearch}
                          onChange={(e) => setTranscriptSearch(e.target.value)}
                          className="pl-7 pr-2 py-1 text-xs bg-white/5 border border-white/10 rounded-lg text-slate-300 placeholder:text-slate-700 focus:outline-none focus:border-violet-500/50 w-36"
                        />
                      </div>
                      <button
                        onClick={() => {
                          const text = (session.transcriptSegments as any[]).map((s: any) =>
                            `${s.timeLabel ?? ""} ${s.speaker}: ${s.text}`
                          ).join("\n\n");
                          const blob = new Blob([text], { type: "text/plain" });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = `${session.clientName}_${session.eventName}_transcript.txt`.replace(/\s+/g, "_");
                          a.click();
                          URL.revokeObjectURL(url);
                          toast.success("Transcript exported");
                        }}
                        className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-200 border border-white/10 transition-colors"
                      >
                        <Download className="w-3 h-3" />
                        Export
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => setShowTranscript(!showTranscript)}
                    className="text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showTranscript ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {showTranscript ? (
                <div className="max-h-[300px] overflow-y-auto space-y-0 divide-y divide-white/5">
                  {transcript.length === 0 ? (
                    <div className="py-8 text-center text-slate-600 text-xs">
                      {transcriptSearch ? "No matching segments" : "No transcript available"}
                    </div>
                  ) : (
                    transcript.map((seg: any, i: number) => (
                      <div key={i} className="px-3 py-2 flex items-start gap-2">
                        <div className="text-[10px] text-slate-600 font-mono shrink-0 pt-0.5 w-10">
                          {seg.timeLabel ?? "—"}
                        </div>
                        <div>
                          <span className="text-[11px] font-semibold text-violet-300 mr-1.5">{seg.speaker}</span>
                          <span className="text-xs text-slate-300">{seg.text}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                <div className="py-6 text-center">
                  <button onClick={() => setShowTranscript(true)} className="text-xs text-violet-400 hover:text-violet-300 transition-colors">
                    Click to show transcript
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white/[0.03] border border-white/10 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <Brain className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="text-sm font-semibold text-slate-200">AI Analysis Modules</h3>
                  <p className="text-[11px] text-slate-600">{enabledCount} of 20 modules enabled for client report</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-slate-600" />
                  <input
                    type="text"
                    placeholder="Search modules..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-7 pr-3 py-1.5 text-xs bg-white/5 border border-white/10 rounded-lg text-slate-300 placeholder:text-slate-700 focus:outline-none focus:border-amber-500/50 w-40"
                  />
                </div>
                {aiReport && (
                  <Button size="sm" onClick={exportReport} className="bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/20 gap-1.5 text-xs">
                    <Download className="w-3.5 h-3.5" />
                    Export Report
                  </Button>
                )}
              </div>
            </div>

            <div className="p-4 space-y-2">
              {!aiReport && !archiveDetail.isLoading ? (
                <div className="py-8 text-center">
                  <Brain className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                  <div className="text-sm text-slate-500 mb-1">No AI report generated yet</div>
                  <p className="text-xs text-slate-600 max-w-md mx-auto">
                    AI analysis runs automatically when a session is processed through the archive pipeline. Upload this session's transcript in Archive Upload to generate the full 20-module report.
                  </p>
                </div>
              ) : archiveDetail.isLoading ? (
                <div className="py-8 text-center">
                  <Loader2 className="w-6 h-6 text-amber-400 mx-auto mb-2 animate-spin" />
                  <div className="text-xs text-slate-500">Loading AI analysis...</div>
                </div>
              ) : (
                filteredModules.map(mod => (
                  <ModuleCard
                    key={mod.key}
                    module={mod}
                    data={aiReport?.[mod.key]}
                    isEnabled={enabledModules.has(mod.key)}
                    onToggle={() => toggleModule(mod.key)}
                  />
                ))
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Session", value: session.eventName, sub: session.clientName, color: "text-slate-300" },
              { label: "Sentiment", value: session.sentimentAvg != null ? `${Math.round(session.sentimentAvg)}%` : "—", sub: "Average score", color: session.sentimentAvg != null && session.sentimentAvg >= 70 ? "text-emerald-400" : session.sentimentAvg != null && session.sentimentAvg >= 50 ? "text-amber-400" : "text-red-400" },
              { label: "Metrics", value: session.taggedMetricsGenerated ?? 0, sub: "Tagged records", color: "text-violet-400" },
              { label: "Modules Active", value: enabledCount, sub: `of 20 (${selectedTier})`, color: "text-amber-400" },
            ].map(stat => (
              <div key={stat.label} className="bg-white/[0.03] border border-white/10 rounded-xl p-4">
                <div className="text-xs text-slate-600 mb-1">{stat.label}</div>
                <div className={`text-xl font-bold ${stat.color} truncate`}>{stat.value}</div>
                <div className="text-[10px] text-slate-600 mt-0.5 truncate">{stat.sub}</div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
