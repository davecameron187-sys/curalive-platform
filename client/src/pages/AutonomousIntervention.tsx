import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useSmartBack } from "@/lib/useSmartBack";
import { toast } from "sonner";
import {
  ArrowLeft, Zap, ShieldAlert, TrendingDown, TrendingUp,
  MessageSquare, Users, Sparkles, CheckCircle2, Clock,
  AlertTriangle, Info, Activity, Brain, Play, BarChart2,
} from "lucide-react";

const ICON_MAP: Record<string, any> = {
  TrendingDown, TrendingUp, MessageSquare, ShieldAlert,
  Users, Sparkles, Activity, Brain,
};

const SEVERITY_STYLES = {
  info:     { badge: "bg-blue-500/20 text-blue-300 border-blue-500/30",     icon: "bg-blue-500/20 text-blue-400",     bar: "bg-blue-500"     },
  warning:  { badge: "bg-amber-500/20 text-amber-300 border-amber-500/30",  icon: "bg-amber-500/20 text-amber-400",   bar: "bg-amber-500"    },
  critical: { badge: "bg-red-500/20 text-red-300 border-red-500/30",        icon: "bg-red-500/20 text-red-400",       bar: "bg-red-500"      },
};

const COLOR_STYLES: Record<string, string> = {
  emerald: "border-emerald-500/30 bg-emerald-950/40",
  amber:   "border-amber-500/30 bg-amber-950/40",
  blue:    "border-blue-500/30 bg-blue-950/40",
  red:     "border-red-500/30 bg-red-950/40",
  violet:  "border-violet-500/30 bg-violet-950/40",
};

export default function AutonomousIntervention() {
  const goBack = useSmartBack("/operator-links");
  const [activeTab, setActiveTab] = useState<"rules" | "active" | "history">("rules");
  const [firing, setFiring] = useState<string | null>(null);

  const rulesQuery = trpc.autonomousIntervention.getRules.useQuery();
  const activeQuery = trpc.autonomousIntervention.getActive.useQuery({ eventId: undefined });
  const historyQuery = trpc.autonomousIntervention.getHistory.useQuery({ limit: 30 });
  const statsQuery = trpc.autonomousIntervention.getStats.useQuery();

  const triggerMutation = trpc.autonomousIntervention.trigger.useMutation({
    onSuccess: () => {
      activeQuery.refetch();
      historyQuery.refetch();
      statsQuery.refetch();
      toast.success("Intervention triggered — agent is acting");
    },
  });

  const acknowledgeMutation = trpc.autonomousIntervention.acknowledge.useMutation({
    onSuccess: () => {
      activeQuery.refetch();
      historyQuery.refetch();
      statsQuery.refetch();
      toast.success("Intervention acknowledged");
    },
  });

  const fireRule = async (ruleId: string) => {
    setFiring(ruleId);
    const rule = rulesQuery.data?.find(r => r.id === ruleId);
    await triggerMutation.mutateAsync({ ruleId, triggerValue: rule?.threshold });
    setFiring(null);
  };

  const stats = statsQuery.data;
  const rules = rulesQuery.data ?? [];
  const active = activeQuery.data ?? [];
  const history = historyQuery.data ?? [];

  return (
    <div className="min-h-screen bg-[#060b18] text-white flex flex-col">

      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-800/60 bg-[#080d1a]">
        <button onClick={goBack} className="flex items-center gap-1.5 text-slate-400 hover:text-slate-200 transition-colors text-sm">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="w-px h-4 bg-slate-700" />
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-orange-500/20 border border-orange-500/30 flex items-center justify-center">
            <Zap className="w-4 h-4 text-orange-400" />
          </div>
          <div>
            <div className="text-sm font-bold text-white tracking-tight">Autonomous Intervention Engine</div>
            <div className="text-[10px] text-slate-500 uppercase tracking-widest">Real-Time Agentic Actions</div>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-3">
          {stats && stats.pending > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold animate-pulse">
              <AlertTriangle className="w-3 h-3" /> {stats.pending} Active
            </div>
          )}
          <div className="px-2 py-0.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-[10px] text-orange-400 font-semibold uppercase tracking-wider">{rules.length} Rules Loaded</div>
        </div>
      </div>

      {/* Stats row */}
      {stats && (
        <div className="grid grid-cols-4 gap-px bg-slate-800/40 border-b border-slate-800">
          {[
            { label: "Total Interventions", value: stats.total, icon: Zap, color: "text-violet-400" },
            { label: "Pending Action", value: stats.pending, icon: AlertTriangle, color: "text-amber-400" },
            { label: "Acknowledged", value: stats.acknowledged, icon: CheckCircle2, color: "text-emerald-400" },
            { label: "Critical Events", value: stats.critical, icon: ShieldAlert, color: "text-red-400" },
          ].map(s => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="flex items-center gap-3 px-5 py-3 bg-[#080d1a]">
                <Icon className={`w-4 h-4 ${s.color} shrink-0`} />
                <div>
                  <div className="text-lg font-black text-white">{s.value}</div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-wide">{s.label}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-800 bg-[#080d1a] px-6">
        {([
          { id: "rules", label: "Intervention Rules", count: rules.length },
          { id: "active", label: "Active Now", count: active.length, urgent: active.length > 0 },
          { id: "history", label: "History", count: history.length },
        ] as const).map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold uppercase tracking-wide border-b-2 transition-colors ${
              activeTab === tab.id ? "border-orange-400 text-orange-300" : "border-transparent text-slate-500 hover:text-slate-300"
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${(tab as any).urgent ? "bg-amber-500/20 text-amber-300" : "bg-slate-700 text-slate-400"}`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-6">

        {/* ── Rules tab ─────────────────────────────────────────────────────── */}
        {activeTab === "rules" && (
          <div className="max-w-4xl mx-auto space-y-4">
            <p className="text-sm text-slate-400 mb-6">
              These rules run autonomously during every live event. When a threshold is crossed, the corresponding agent fires immediately — no human needs to press anything.
              Use the <span className="text-orange-300 font-semibold">Fire Now</span> button to simulate a trigger for demo purposes.
            </p>
            {rules.map(rule => {
              const Icon = ICON_MAP[rule.icon] ?? Zap;
              const sev = SEVERITY_STYLES[rule.severity];
              const col = COLOR_STYLES[rule.color] ?? COLOR_STYLES.violet;
              return (
                <div key={rule.id} className={`rounded-2xl border ${col} p-5`}>
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${sev.icon}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-sm font-bold text-white">{rule.name}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${sev.badge}`}>{rule.severity}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] border border-slate-700 text-slate-400">{rule.bundle}</span>
                      </div>
                      <p className="text-xs text-slate-400 mb-2">{rule.description}</p>
                      <div className="flex items-start gap-1.5 p-3 rounded-lg bg-slate-900/60 border border-slate-700/40">
                        <Zap className="w-3 h-3 text-orange-400 mt-0.5 shrink-0" />
                        <p className="text-xs text-slate-300">{rule.action}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => fireRule(rule.id)}
                      disabled={firing === rule.id}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 text-orange-300 text-xs font-semibold transition-colors disabled:opacity-50 shrink-0"
                    >
                      {firing === rule.id
                        ? <><span className="w-3 h-3 border border-orange-400/30 border-t-orange-400 rounded-full animate-spin" /> Firing…</>
                        : <><Play className="w-3 h-3" /> Fire Now</>
                      }
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Active tab ────────────────────────────────────────────────────── */}
        {activeTab === "active" && (
          <div className="max-w-4xl mx-auto space-y-4">
            {active.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
                <CheckCircle2 className="w-12 h-12 text-emerald-500/40" />
                <div className="text-slate-400 text-sm">No active interventions</div>
                <div className="text-slate-600 text-xs">All agents are monitoring. Trigger a rule from the Rules tab to see it here.</div>
              </div>
            ) : active.map(item => {
              const sev = SEVERITY_STYLES[item.severity];
              return (
                <div key={item.id} className={`rounded-2xl border ${item.severity === "critical" ? "border-red-500/40 bg-red-950/40" : item.severity === "warning" ? "border-amber-500/30 bg-amber-950/30" : "border-blue-500/30 bg-blue-950/30"} p-5`}>
                  <div className="flex items-start gap-4">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${sev.icon}`}>
                      <Zap className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-sm font-bold text-white">{item.ruleName}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${sev.badge}`}>{item.severity}</span>
                        {item.bundleTriggered && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] border border-slate-700 text-slate-400">{item.bundleTriggered}</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-300 mb-1">{item.actionTaken}</p>
                      <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                        <Clock className="w-3 h-3" />
                        {new Date(item.createdAt).toLocaleString()}
                        {item.triggerValue != null && <><span>·</span><span>Value: {item.triggerValue}</span></>}
                      </div>
                    </div>
                    <button
                      onClick={() => acknowledgeMutation.mutate({ id: item.id, outcome: "Reviewed and actioned by operator" })}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold transition-colors shrink-0"
                    >
                      <CheckCircle2 className="w-3 h-3" /> Acknowledge
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── History tab ───────────────────────────────────────────────────── */}
        {activeTab === "history" && (
          <div className="max-w-4xl mx-auto">
            {history.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
                <BarChart2 className="w-12 h-12 text-slate-700" />
                <div className="text-slate-400 text-sm">No intervention history yet</div>
                <div className="text-slate-600 text-xs">Trigger rules from the Rules tab to build a history log</div>
              </div>
            ) : (
              <div className="space-y-2">
                {history.map(item => {
                  const sev = SEVERITY_STYLES[item.severity];
                  return (
                    <div key={item.id} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-900/50 border border-slate-800">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${sev.icon}`}>
                        <Zap className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-slate-200">{item.ruleName}</span>
                          <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase border ${sev.badge}`}>{item.severity}</span>
                          {item.acknowledged && <span className="px-1.5 py-0.5 rounded-full text-[9px] border border-emerald-700/50 text-emerald-400">✓ Acknowledged</span>}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate">{item.actionTaken}</div>
                      </div>
                      <div className="text-[10px] text-slate-600 font-mono shrink-0">{new Date(item.createdAt).toLocaleString()}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
