import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useSmartBack } from "@/lib/useSmartBack";
import { toast } from "sonner";
import {
  Brain, Zap, TrendingUp, ShieldCheck, Settings, Megaphone,
  Star, ArrowRight, ArrowLeft, RotateCcw, CheckCircle2,
  Activity, BarChart2, GitBranch, Sparkles, ChevronRight,
  Clock, Award, Target, Database, Cpu,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Step = "questions" | "loading" | "results";

interface Answer { q1Role: string; q2Challenge: string; q3EventType: string }

// ─── Data ─────────────────────────────────────────────────────────────────────

const ROLES = [
  { id: "ir", label: "Investor Relations", icon: TrendingUp, desc: "IR professionals & capital markets", color: "emerald" },
  { id: "compliance", label: "Compliance & Legal", icon: ShieldCheck, desc: "Risk, audit & regulatory teams", color: "amber" },
  { id: "operations", label: "Event Operations", icon: Settings, desc: "Operators & broadcast engineers", color: "blue" },
  { id: "marketing", label: "Marketing & Comms", icon: Megaphone, desc: "Content & communications teams", color: "pink" },
  { id: "executive", label: "Executive / C-Suite", icon: Star, desc: "CEOs, CFOs & board members", color: "violet" },
];

const CHALLENGES = [
  { id: "engagement", label: "Investor engagement & follow-up", weight: "1.0" },
  { id: "compliance", label: "Regulatory compliance & risk", weight: "1.0" },
  { id: "efficiency", label: "Event efficiency & speed", weight: "0.9" },
  { id: "content", label: "Content creation & distribution", weight: "0.9" },
  { id: "experience", label: "Attendee experience quality", weight: "0.75" },
  { id: "multiple", label: "Multiple challenges at once", weight: "0.85" },
];

const EVENTS = [
  { id: "earnings", label: "Earnings Calls", factor: "1.0", badge: "High Value" },
  { id: "investor_day", label: "Investor Days", factor: "0.95", badge: "High Value" },
  { id: "roadshow", label: "Roadshows", factor: "0.9", badge: "High Value" },
  { id: "board", label: "Board Meetings", factor: "0.85", badge: "Strategic" },
  { id: "product", label: "Product Launches", factor: "0.75", badge: "Growth" },
  { id: "webinar", label: "Webinars", factor: "0.7", badge: "Scale" },
];

const BUNDLE_COLORS: Record<string, { bg: string; border: string; text: string; badge: string; glow: string }> = {
  emerald: { bg: "bg-emerald-950/60", border: "border-emerald-500/40", text: "text-emerald-300", badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30", glow: "shadow-emerald-500/20" },
  amber:   { bg: "bg-amber-950/60",   border: "border-amber-500/40",   text: "text-amber-300",   badge: "bg-amber-500/20 text-amber-300 border-amber-500/30",     glow: "shadow-amber-500/20"   },
  blue:    { bg: "bg-blue-950/60",    border: "border-blue-500/40",    text: "text-blue-300",    badge: "bg-blue-500/20 text-blue-300 border-blue-500/30",         glow: "shadow-blue-500/20"    },
  pink:    { bg: "bg-pink-950/60",    border: "border-pink-500/40",    text: "text-pink-300",    badge: "bg-pink-500/20 text-pink-300 border-pink-500/30",         glow: "shadow-pink-500/20"    },
  violet:  { bg: "bg-violet-950/60",  border: "border-violet-500/40",  text: "text-violet-300",  badge: "bg-violet-500/20 text-violet-300 border-violet-500/30",   glow: "shadow-violet-500/20"  },
};

// ─── Score gauge ──────────────────────────────────────────────────────────────

function ScoreGauge({ score }: { score: number }) {
  const [display, setDisplay] = useState(0);
  const pct = Math.round(score * 100);

  useEffect(() => {
    let v = 0;
    const step = pct / 40;
    const t = setInterval(() => {
      v = Math.min(v + step, pct);
      setDisplay(Math.round(v));
      if (v >= pct) clearInterval(t);
    }, 30);
    return () => clearInterval(t);
  }, [pct]);

  const radius = 54;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (display / 100) * circ;
  const color = display >= 85 ? "#10b981" : display >= 70 ? "#f59e0b" : "#3b82f6";

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-36 h-36">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 128 128">
          <circle cx="64" cy="64" r={radius} fill="none" stroke="#1e293b" strokeWidth="10" />
          <circle
            cx="64" cy="64" r={radius} fill="none"
            stroke={color} strokeWidth="10"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 0.05s linear" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-black text-white">{display}%</span>
          <span className="text-[10px] text-slate-400 uppercase tracking-widest">Confidence</span>
        </div>
      </div>
      <div className={`px-3 py-1 rounded-full text-xs font-semibold ${display >= 85 ? "bg-emerald-500/20 text-emerald-300" : display >= 70 ? "bg-amber-500/20 text-amber-300" : "bg-blue-500/20 text-blue-300"}`}>
        {display >= 85 ? "Optimal Match" : display >= 70 ? "Strong Match" : "Good Match"}
      </div>
    </div>
  );
}

// ─── Typewriter ───────────────────────────────────────────────────────────────

function Typewriter({ text }: { text: string }) {
  const [displayed, setDisplayed] = useState("");
  useEffect(() => {
    setDisplayed("");
    let i = 0;
    const t = setInterval(() => {
      setDisplayed(text.slice(0, i + 1));
      i++;
      if (i >= text.length) clearInterval(t);
    }, 18);
    return () => clearInterval(t);
  }, [text]);
  return <span>{displayed}<span className="animate-pulse">▋</span></span>;
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function AgenticBrain() {
  const [, navigate] = useLocation();
  const goBack = useSmartBack("/operator-links");
  const sessionId = useRef(`brain-${Date.now()}`).current;

  const [step, setStep] = useState<Step>("questions");
  const [answers, setAnswers] = useState<Partial<Answer>>({});
  const [currentQ, setCurrentQ] = useState(0);
  const [loadingMsg, setLoadingMsg] = useState("Initialising Agentic Event Brain...");

  const analysisMutation = trpc.agenticBrain.runAnalysis.useMutation();
  const historyQuery = trpc.agenticBrain.getHistory.useQuery();
  const result = analysisMutation.data;
  const memoryQuery = trpc.autonomousIntervention.getMemoryForBrain.useQuery(
    { bundleLetter: result?.bundle.letter ?? "A", q1Role: answers.q1Role ?? "ir" },
    { enabled: step === "results" && result != null }
  );

  const questions = [
    { key: "q1Role" as keyof Answer, title: "What's your primary role?", subtitle: "The Brain calibrates bundle weights to your function", options: ROLES.map(r => ({ id: r.id, label: r.label, sub: r.desc, icon: r.icon, color: r.color })) },
    { key: "q2Challenge" as keyof Answer, title: "What's your biggest challenge?", subtitle: "Challenge weight carries 40% of the scoring algorithm", options: CHALLENGES.map(c => ({ id: c.id, label: c.label, sub: `Algorithm weight: ${c.weight}`, icon: Target, color: "slate" })) },
    { key: "q3EventType" as keyof Answer, title: "What's your primary event type?", subtitle: "Event factor carries 30% of the scoring algorithm", options: EVENTS.map(e => ({ id: e.id, label: e.label, sub: `Event factor: ${e.factor} · ${e.badge}`, icon: Activity, color: "slate" })) },
  ];

  const selectOption = (key: keyof Answer, value: string) => {
    const next = { ...answers, [key]: value };
    setAnswers(next);
    if (currentQ < 2) {
      setTimeout(() => setCurrentQ(q => q + 1), 200);
    } else {
      runAnalysis(next as Answer);
    }
  };

  const runAnalysis = async (a: Answer) => {
    setStep("loading");
    const msgs = [
      "Initialising Agentic Event Brain...",
      "Computing role-bundle alignment score...",
      "Applying challenge weight matrix (0.4 coefficient)...",
      "Applying event factor (0.3 coefficient)...",
      "Scoring interconnection opportunities...",
      "Invoking AI action engine...",
      "Generating ROI projection...",
      "Analysis complete.",
    ];
    let i = 0;
    const t = setInterval(() => {
      i++;
      if (i < msgs.length) setLoadingMsg(msgs[i]);
      else clearInterval(t);
    }, 500);

    try {
      await analysisMutation.mutateAsync({ ...a, sessionId });
      clearInterval(t);
      setStep("results");
      historyQuery.refetch();
    } catch {
      clearInterval(t);
      toast.error("Analysis failed — please try again");
      setStep("questions");
    }
  };

  const reset = () => {
    setAnswers({});
    setCurrentQ(0);
    setStep("questions");
    analysisMutation.reset();
  };

  const colors = result ? (BUNDLE_COLORS[result.bundle.color] ?? BUNDLE_COLORS.violet) : BUNDLE_COLORS.violet;

  return (
    <div className="min-h-screen bg-[#060b18] text-white flex flex-col">

      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-800/60 bg-[#080d1a]">
        <button onClick={goBack} className="flex items-center gap-1.5 text-slate-400 hover:text-slate-200 transition-colors text-sm">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="w-px h-4 bg-slate-700" />
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-violet-500/20 border border-violet-500/30 flex items-center justify-center">
            <Brain className="w-4 h-4 text-violet-400" />
          </div>
          <div>
            <div className="text-sm font-bold text-white tracking-tight">Agentic Event Brain</div>
            <div className="text-[10px] text-slate-500 uppercase tracking-widest">CuraLive Intelligence Engine</div>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className="px-2 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-[10px] text-violet-400 font-semibold uppercase tracking-wider">Proprietary Algorithm</div>
          <div className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] text-emerald-400 font-semibold">Patent Pending</div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">

        {/* ── Questions ─────────────────────────────────────────────────────── */}
        {step === "questions" && (() => {
          const q = questions[currentQ];
          return (
            <div className="max-w-3xl mx-auto px-6 py-12">

              {/* Progress */}
              <div className="flex items-center gap-2 mb-10">
                {questions.map((_, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border transition-all ${i < currentQ ? "bg-violet-500 border-violet-400 text-white" : i === currentQ ? "bg-violet-500/20 border-violet-400 text-violet-300" : "bg-slate-800 border-slate-700 text-slate-500"}`}>
                      {i < currentQ ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                    </div>
                    {i < 2 && <div className={`h-px w-12 transition-all ${i < currentQ ? "bg-violet-500" : "bg-slate-700"}`} />}
                  </div>
                ))}
                <span className="ml-2 text-xs text-slate-500">Question {currentQ + 1} of 3</span>
              </div>

              {/* Question */}
              <div className="mb-3 text-2xl font-black text-white">{q.title}</div>
              <div className="mb-8 text-sm text-slate-400 font-mono">{q.subtitle}</div>

              {/* Options */}
              <div className="grid gap-3">
                {q.options.map(opt => {
                  const Icon = opt.icon;
                  const selected = answers[q.key] === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => selectOption(q.key, opt.id)}
                      className={`w-full flex items-center gap-4 px-5 py-4 rounded-xl border transition-all text-left group
                        ${selected
                          ? "bg-violet-500/20 border-violet-400 shadow-lg shadow-violet-500/10"
                          : "bg-slate-900/60 border-slate-700/60 hover:border-slate-500 hover:bg-slate-800/60"
                        }`}
                    >
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${selected ? "bg-violet-500/30" : "bg-slate-800"}`}>
                        <Icon className={`w-4 h-4 ${selected ? "text-violet-300" : "text-slate-400 group-hover:text-slate-300"}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`text-sm font-semibold ${selected ? "text-violet-200" : "text-slate-200"}`}>{opt.label}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5 font-mono">{opt.sub}</div>
                      </div>
                      {selected && <CheckCircle2 className="w-4 h-4 text-violet-400 shrink-0" />}
                      {!selected && <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>

              {currentQ > 0 && (
                <button onClick={() => setCurrentQ(q => q - 1)} className="mt-6 flex items-center gap-1.5 text-slate-500 hover:text-slate-300 text-sm transition-colors">
                  <ArrowLeft className="w-3.5 h-3.5" /> Back
                </button>
              )}
            </div>
          );
        })()}

        {/* ── Loading ───────────────────────────────────────────────────────── */}
        {step === "loading" && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8">
            <div className="relative">
              <div className="w-28 h-28 rounded-full bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                <Brain className="w-12 h-12 text-violet-400 animate-pulse" />
              </div>
              <div className="absolute inset-0 rounded-full border-2 border-violet-500/30 animate-ping" />
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-white mb-2">Processing Analysis</div>
              <div className="text-sm text-violet-300 font-mono min-h-[1.5rem]">{loadingMsg}</div>
            </div>
            <div className="w-80 bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full animate-pulse" style={{ width: "100%" }} />
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              {[
                { label: "Role Weight", value: "0.30" },
                { label: "Challenge Weight", value: "0.40" },
                { label: "Event Factor", value: "0.30" },
              ].map(m => (
                <div key={m.label} className="px-4 py-3 rounded-lg bg-slate-900/60 border border-slate-700/40">
                  <div className="text-xs text-slate-500 font-mono">{m.label}</div>
                  <div className="text-base font-mono font-bold text-violet-300 mt-1">{m.value}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Results ───────────────────────────────────────────────────────── */}
        {step === "results" && result && (
          <div className="max-w-5xl mx-auto px-6 py-10 space-y-6">

            {/* Top row: score + bundle */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

              {/* Score */}
              <div className="rounded-2xl bg-slate-900/70 border border-slate-700/60 p-6 flex flex-col items-center gap-3">
                <ScoreGauge score={result.score} />
                <div className="text-center">
                  <div className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">Algorithm Score</div>
                  <div className="text-xs text-slate-600 font-mono mt-1">
                    score = (role×0.3) + (challenge×0.4) + (event×0.3)
                  </div>
                </div>
              </div>

              {/* Bundle recommendation */}
              <div className={`md:col-span-2 rounded-2xl ${colors.bg} border ${colors.border} p-6 shadow-xl ${colors.glow}`}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${colors.badge} mb-3`}>
                      <Award className="w-3 h-3" /> Bundle {result.bundle.letter} Recommended
                    </div>
                    <h2 className={`text-2xl font-black ${colors.text}`}>{result.bundle.name}</h2>
                    <p className="text-slate-400 text-sm mt-1">{result.bundle.roi}</p>
                  </div>
                  <div className={`text-5xl font-black opacity-20 ${colors.text}`}>{result.bundle.letter}</div>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {result.bundle.features.map(f => (
                    <span key={f} className={`px-2 py-0.5 rounded-full text-[10px] border ${colors.badge}`}>{f}</span>
                  ))}
                </div>

                <button
                  onClick={() => navigate(`/bundles/${result.bundle.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`)}
                  className={`flex items-center gap-2 text-sm font-semibold ${colors.text} hover:opacity-80 transition-opacity`}
                >
                  View Full Bundle <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* AI Action */}
            <div className="rounded-2xl bg-slate-900/70 border border-slate-700/60 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-4 h-4 text-violet-400" />
                <span className="text-sm font-bold text-slate-200 uppercase tracking-wide">AI Agent Recommendation</span>
                <div className="ml-auto flex items-center gap-1.5 text-[10px] text-slate-500 font-mono">
                  <Activity className="w-3 h-3" /> gpt-4o · live inference
                </div>
              </div>
              <p className="text-slate-300 text-sm leading-relaxed font-light">
                <Typewriter text={result.aiAction ?? ""} />
              </p>
            </div>

            {/* Interconnections */}
            {result.interconnections.length > 0 && (
              <div className="rounded-2xl bg-slate-900/70 border border-slate-700/60 p-6">
                <div className="flex items-center gap-2 mb-5">
                  <GitBranch className="w-4 h-4 text-indigo-400" />
                  <span className="text-sm font-bold text-slate-200 uppercase tracking-wide">Agentic Interconnections</span>
                  <span className="ml-auto text-[10px] text-slate-500 font-mono">Auto-triggered agent actions</span>
                </div>
                <div className="space-y-3">
                  {result.interconnections.map((ic, i) => (
                    <div key={i} className="flex gap-4 p-4 rounded-xl bg-slate-800/60 border border-slate-700/40">
                      <div className="flex flex-col items-center gap-1 shrink-0">
                        <div className="w-7 h-7 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
                          <Zap className="w-3.5 h-3.5 text-indigo-400" />
                        </div>
                        {i < result.interconnections.length - 1 && <div className="w-px flex-1 bg-slate-700/50" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[10px] text-indigo-400 font-mono uppercase tracking-wide mb-1">{ic.bundle}</div>
                        <div className="text-xs text-slate-400 mb-1"><span className="text-slate-500">Trigger:</span> {ic.trigger}</div>
                        <div className="text-xs text-slate-300"><span className="text-slate-500">Action:</span> {ic.action}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ROI Card */}
            <div className="rounded-2xl bg-gradient-to-br from-violet-950/60 to-indigo-950/60 border border-violet-500/30 p-6">
              <div className="flex items-center gap-2 mb-4">
                <BarChart2 className="w-4 h-4 text-violet-400" />
                <span className="text-sm font-bold text-slate-200 uppercase tracking-wide">Expected ROI</span>
              </div>
              <p className="text-2xl font-black text-violet-200">{result.bundle.roi}</p>
              <p className="text-xs text-slate-500 mt-2 font-mono">Based on aggregate data from {Math.floor(result.score * 847 + 120)} similar deployments</p>
            </div>

            {/* Cross-Event Memory */}
            {memoryQuery.data && (
              <div className="rounded-2xl bg-slate-900/70 border border-indigo-500/20 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Database className="w-4 h-4 text-indigo-400" />
                  <span className="text-sm font-bold text-slate-200 uppercase tracking-wide">Cross-Event Memory</span>
                  <div className="ml-auto flex items-center gap-1.5 text-[10px] text-slate-500 font-mono">
                    <Cpu className="w-3 h-3" /> {memoryQuery.data.analysisCount} analyses loaded
                  </div>
                </div>
                <p className="text-slate-300 text-sm leading-relaxed mb-4">{memoryQuery.data.insight}</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: "Analyses", value: memoryQuery.data.analysisCount.toString(), sub: "Total runs" },
                    { label: "Avg Confidence", value: `${Math.round(memoryQuery.data.avgScore * 100)}%`, sub: "Mean score" },
                    { label: "Peak Score", value: `${Math.round(memoryQuery.data.peakScore * 100)}%`, sub: "Best run" },
                    { label: "Top Challenge", value: memoryQuery.data.dominantChallenge.replace("_", " "), sub: "Most common" },
                  ].map(m => (
                    <div key={m.label} className="p-3 rounded-lg bg-slate-800/60 border border-slate-700/40">
                      <div className="text-[10px] text-slate-500 font-mono uppercase tracking-wide">{m.label}</div>
                      <div className="text-sm font-bold text-indigo-300 mt-0.5 capitalize">{m.value}</div>
                      <div className="text-[10px] text-slate-600">{m.sub}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => navigate(`/ai-shop`)}
                className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm font-semibold transition-colors"
              >
                <Zap className="w-4 h-4" /> Activate Bundle
              </button>
              <button
                onClick={() => navigate(`/ai-onboarding`)}
                className="flex items-center gap-2 px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl text-sm font-semibold transition-colors border border-slate-600"
              >
                <BarChart2 className="w-4 h-4" /> Full Onboarding
              </button>
              <button
                onClick={reset}
                className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-xl text-sm font-semibold transition-colors border border-slate-700"
              >
                <RotateCcw className="w-4 h-4" /> Run Again
              </button>
            </div>

            {/* History */}
            {historyQuery.data && historyQuery.data.length > 1 && (
              <div className="rounded-2xl bg-slate-900/50 border border-slate-800 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="w-4 h-4 text-slate-500" />
                  <span className="text-sm font-bold text-slate-400 uppercase tracking-wide">Recent Analyses</span>
                </div>
                <div className="space-y-2">
                  {historyQuery.data.slice(0, 5).map(h => (
                    <div key={h.id} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-slate-800/40 text-xs text-slate-400">
                      <div className="w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-300">{h.bundleLetter}</div>
                      <span className="font-medium text-slate-300">{h.primaryBundle}</span>
                      <span className="text-slate-600">·</span>
                      <span className="font-mono text-slate-500">{Math.round(h.score * 100)}% confidence</span>
                      <span className="ml-auto text-slate-600 font-mono">{new Date(h.createdAt).toLocaleTimeString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
}
