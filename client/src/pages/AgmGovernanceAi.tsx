import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Shield, Brain, BarChart3, AlertTriangle, CheckCircle2, XCircle,
  Vote, Users, Scale, FileText, TrendingUp, Eye, ChevronRight,
  Plus, RefreshCw, Loader2, Gavel, AlertCircle, Target,
  ArrowLeft, Mic, MessageSquare, PieChart, Activity,
} from "lucide-react";

type View = "sessions" | "create" | "dashboard";

export default function AgmGovernanceAi() {
  const [view, setView] = useState<View>("sessions");
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-[#0a0f1c] to-slate-950 text-white">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <Header view={view} onBack={() => setView("sessions")} />

        {view === "sessions" && (
          <SessionList
            onSelect={(id) => { setActiveSessionId(id); setView("dashboard"); }}
            onCreate={() => setView("create")}
          />
        )}

        {view === "create" && (
          <CreateSession onCreated={(id) => { setActiveSessionId(id); setView("dashboard"); }} onCancel={() => setView("sessions")} />
        )}

        {view === "dashboard" && activeSessionId && (
          <SessionDashboard sessionId={activeSessionId} onBack={() => setView("sessions")} />
        )}
      </div>
    </div>
  );
}

function Header({ view, onBack }: { view: View; onBack: () => void }) {
  return (
    <div className="flex items-center gap-4 mb-8">
      {view !== "sessions" && (
        <button onClick={onBack} className="p-2 hover:bg-slate-800 rounded-lg transition">
          <ArrowLeft className="w-5 h-5 text-slate-400" />
        </button>
      )}
      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600/30 to-blue-600/30 flex items-center justify-center border border-violet-500/30">
        <Brain className="w-7 h-7 text-violet-400" />
      </div>
      <div>
        <h1 className="text-2xl font-bold bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">
          AGM Governance AI
        </h1>
        <p className="text-sm text-slate-500">6 Autonomous Self-Evolving Algorithms · Companies Act 71 · JSE · King IV</p>
      </div>
      <div className="ml-auto flex items-center gap-2">
        {[
          { icon: Vote, label: "Resolution Predictor", color: "text-emerald-400" },
          { icon: Eye, label: "Dissent Engine", color: "text-amber-400" },
          { icon: MessageSquare, label: "Q&A Triage", color: "text-blue-400" },
          { icon: Users, label: "Quorum Intel", color: "text-cyan-400" },
          { icon: Shield, label: "Regulatory Guardian", color: "text-red-400" },
          { icon: FileText, label: "Report Generator", color: "text-violet-400" },
        ].map((algo, i) => (
          <div key={i} className="flex items-center gap-1 px-2 py-1 bg-slate-800/50 border border-slate-700/50 rounded-lg" title={algo.label}>
            <algo.icon className={`w-3.5 h-3.5 ${algo.color}`} />
            <span className="text-[9px] text-slate-500 hidden xl:inline">{algo.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SessionList({ onSelect, onCreate }: { onSelect: (id: number) => void; onCreate: () => void }) {
  const sessionsQ = trpc.agmGovernance.listSessions.useQuery({ limit: 20 });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { icon: Brain, label: "Self-Evolving", desc: "Every AGM makes the AI smarter", color: "from-violet-600/20 to-violet-800/10", border: "border-violet-500/20" },
          { icon: Shield, label: "Multi-Framework", desc: "Companies Act 71 · JSE · King IV", color: "from-blue-600/20 to-blue-800/10", border: "border-blue-500/20" },
          { icon: Target, label: "6 Algorithms", desc: "Prediction · Dissent · Triage · Quorum · Compliance · Reports", color: "from-emerald-600/20 to-emerald-800/10", border: "border-emerald-500/20" },
        ].map((c, i) => (
          <div key={i} className={`bg-gradient-to-br ${c.color} border ${c.border} rounded-xl p-5`}>
            <c.icon className="w-6 h-6 text-slate-300 mb-2" />
            <div className="font-semibold text-white">{c.label}</div>
            <div className="text-xs text-slate-400 mt-1">{c.desc}</div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-300">AGM Intelligence Sessions</h2>
        <button onClick={onCreate} className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 rounded-lg text-sm font-semibold transition">
          <Plus className="w-4 h-4" /> New AGM Session
        </button>
      </div>

      {sessionsQ.isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 text-violet-400 animate-spin" /></div>
      ) : (sessionsQ.data ?? []).length === 0 ? (
        <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-12 text-center">
          <Brain className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-400">No AGM Sessions Yet</h3>
          <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
            Create your first AGM intelligence session to activate the 6 autonomous governance algorithms.
            The AI starts learning from its very first AGM.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {(sessionsQ.data ?? []).map((s: any) => (
            <button key={s.id} onClick={() => onSelect(s.id)}
              className="w-full flex items-center justify-between p-4 bg-slate-800/40 hover:bg-slate-800/70 border border-slate-700/50 rounded-xl transition text-left group">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  s.status === "completed" ? "bg-emerald-900/30 border-emerald-500/30"
                  : s.status === "live" ? "bg-blue-900/30 border-blue-500/30"
                  : "bg-slate-800 border-slate-600/30"
                } border`}>
                  <Gavel className={`w-5 h-5 ${
                    s.status === "completed" ? "text-emerald-400"
                    : s.status === "live" ? "text-blue-400"
                    : "text-slate-500"
                  }`} />
                </div>
                <div>
                  <div className="font-semibold text-white">{s.agmTitle}</div>
                  <div className="text-xs text-slate-500">{s.clientName} · {s.agmDate ?? "No date"} · {s.jurisdiction?.replace("_", " ")}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {s.governanceScore != null && (
                  <div className="text-right">
                    <div className={`text-lg font-bold font-mono ${s.governanceScore >= 80 ? "text-emerald-400" : s.governanceScore >= 60 ? "text-amber-400" : "text-red-400"}`}>
                      {Math.round(s.governanceScore)}
                    </div>
                    <div className="text-[9px] text-slate-500">Gov. Score</div>
                  </div>
                )}
                <div className="flex flex-col items-end gap-1">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    s.status === "completed" ? "bg-emerald-900/50 text-emerald-400"
                    : s.status === "live" ? "bg-blue-900/50 text-blue-400"
                    : s.status === "processing" ? "bg-amber-900/50 text-amber-400"
                    : "bg-slate-700 text-slate-400"
                  }`}>{s.status}</span>
                  {s.totalResolutions > 0 && (
                    <span className="text-[10px] text-slate-500">{s.totalResolutions} resolutions</span>
                  )}
                </div>
                <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition" />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function CreateSession({ onCreated, onCancel }: { onCreated: (id: number) => void; onCancel: () => void }) {
  const [clientName, setClientName] = useState("");
  const [agmTitle, setAgmTitle] = useState("");
  const [agmDate, setAgmDate] = useState("");
  const [jurisdiction, setJurisdiction] = useState("south_africa");
  const createMut = trpc.agmGovernance.createSession.useMutation();

  const handleCreate = async () => {
    if (!clientName.trim() || !agmTitle.trim()) {
      toast.error("Client name and AGM title are required");
      return;
    }
    try {
      const result = await createMut.mutateAsync({
        clientName: clientName.trim(),
        agmTitle: agmTitle.trim(),
        agmDate: agmDate || undefined,
        jurisdiction: jurisdiction as any,
      });
      toast.success("AGM intelligence session created — algorithms activated");
      onCreated(result.sessionId);
    } catch (err: any) {
      toast.error(err.message ?? "Failed to create session");
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-6 space-y-5">
        <div className="flex items-center gap-3 mb-2">
          <Gavel className="w-5 h-5 text-violet-400" />
          <h2 className="text-lg font-semibold">New AGM Intelligence Session</h2>
        </div>
        <div>
          <label className="block text-sm text-slate-400 mb-1.5">Client / Company Name</label>
          <input value={clientName} onChange={e => setClientName(e.target.value)} placeholder="e.g. Naspers Limited"
            className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder:text-slate-600" />
        </div>
        <div>
          <label className="block text-sm text-slate-400 mb-1.5">AGM Title</label>
          <input value={agmTitle} onChange={e => setAgmTitle(e.target.value)} placeholder="e.g. 2026 Annual General Meeting"
            className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder:text-slate-600" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1.5">AGM Date</label>
            <input type="date" value={agmDate} onChange={e => setAgmDate(e.target.value)}
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1.5">Jurisdiction</label>
            <select value={jurisdiction} onChange={e => setJurisdiction(e.target.value)}
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white">
              <option value="south_africa">South Africa (Companies Act 71)</option>
              <option value="united_kingdom">United Kingdom</option>
              <option value="united_states">United States</option>
              <option value="australia">Australia</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        <div className="bg-violet-900/20 border border-violet-500/20 rounded-lg p-4">
          <div className="text-sm font-semibold text-violet-300 mb-2">Algorithms That Will Activate</div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { icon: Vote, name: "Resolution Sentiment Predictor", desc: "Predicts approval % from debate" },
              { icon: Eye, name: "Dissent Pattern Engine", desc: "Detects recurring shareholder opposition" },
              { icon: MessageSquare, name: "Q&A Governance Triage", desc: "Classifies questions by regulatory significance" },
              { icon: Users, name: "Quorum Intelligence", desc: "Monitors thresholds vs benchmarks" },
              { icon: Shield, name: "Regulatory Speech Guardian", desc: "Flags Companies Act / JSE / King IV issues" },
              { icon: FileText, name: "Governance Report Generator", desc: "Board-ready autonomous reports" },
            ].map((a, i) => (
              <div key={i} className="flex items-start gap-2 text-xs">
                <a.icon className="w-3.5 h-3.5 text-violet-400 mt-0.5 shrink-0" />
                <div><span className="text-slate-300 font-medium">{a.name}</span><br/><span className="text-slate-500">{a.desc}</span></div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button onClick={onCancel} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm font-medium transition">Cancel</button>
          <button onClick={handleCreate} disabled={createMut.isPending}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 rounded-lg text-sm font-semibold transition disabled:opacity-50">
            {createMut.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Initialising...</> : <><Brain className="w-4 h-4" /> Activate AGM Intelligence</>}
          </button>
        </div>
      </div>
    </div>
  );
}

function SessionDashboard({ sessionId, onBack }: { sessionId: number; onBack: () => void }) {
  const dashQ = trpc.agmGovernance.dashboard.useQuery({ sessionId }, { refetchInterval: 10000 });
  const [tab, setTab] = useState<"overview" | "resolutions" | "algorithms" | "report">("overview");
  const reportMut = trpc.agmGovernance.generateReport.useMutation();

  if (dashQ.isLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 text-violet-400 animate-spin" /></div>;
  }

  const d = dashQ.data;
  if (!d) return <div className="text-center text-slate-500 py-20">Session not found</div>;

  const handleGenerateReport = async () => {
    try {
      const result = await reportMut.mutateAsync({ sessionId });
      toast.success(`Governance report generated. ${result.observationsFedToEvolution} observations fed to evolution engine.`);
      dashQ.refetch();
    } catch (err: any) {
      toast.error(err.message ?? "Report generation failed");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">{d.session.agmTitle}</h2>
          <p className="text-sm text-slate-500">{d.session.clientName} · {d.session.agmDate ?? "—"} · {d.session.jurisdiction?.replace("_", " ")}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => dashQ.refetch()} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition">
            <RefreshCw className="w-4 h-4 text-slate-400" />
          </button>
          <button onClick={handleGenerateReport} disabled={reportMut.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 rounded-lg text-sm font-semibold transition disabled:opacity-50">
            {reportMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
            Generate Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <StatCard label="Resolutions" value={d.summary.totalResolutions} icon={<Vote className="w-5 h-5 text-slate-400" />} />
        <StatCard label="Carried" value={d.summary.carried} icon={<CheckCircle2 className="w-5 h-5 text-emerald-400" />} />
        <StatCard label="Defeated" value={d.summary.defeated} icon={<XCircle className="w-5 h-5 text-red-400" />} />
        <StatCard label="Pending" value={d.summary.pending} icon={<Activity className="w-5 h-5 text-blue-400" />} />
        <StatCard label="Prediction Acc." value={d.summary.avgPredictionAccuracy != null ? `${d.summary.avgPredictionAccuracy}%` : "—"} icon={<Target className="w-5 h-5 text-violet-400" />} />
        <StatCard label="Critical Alerts" value={d.summary.criticalAlerts} icon={<AlertCircle className="w-5 h-5 text-red-400" />} />
        <StatCard label="Gov. Score" value={d.session.governanceScore != null ? Math.round(d.session.governanceScore) : "—"}
          icon={<Shield className={`w-5 h-5 ${(d.session.governanceScore ?? 0) >= 80 ? "text-emerald-400" : (d.session.governanceScore ?? 0) >= 60 ? "text-amber-400" : "text-red-400"}`} />}
        />
      </div>

      <div className="flex gap-1 bg-slate-800/50 rounded-lg p-1">
        {(["overview", "resolutions", "algorithms", "report"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition ${tab === t ? "bg-violet-600 text-white" : "text-slate-400 hover:text-white hover:bg-slate-700"}`}>
            {t === "overview" ? "Overview" : t === "resolutions" ? "Resolutions" : t === "algorithms" ? "Algorithms" : "Report"}
          </button>
        ))}
      </div>

      {tab === "overview" && <OverviewTab data={d} />}
      {tab === "resolutions" && <ResolutionsTab sessionId={sessionId} resolutions={d.resolutions} onRefresh={() => dashQ.refetch()} />}
      {tab === "algorithms" && <AlgorithmsTab data={d} />}
      {tab === "report" && <ReportTab report={d.session.aiGovernanceReport} />}
    </div>
  );
}

function OverviewTab({ data }: { data: any }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-slate-400 mb-3 flex items-center gap-2">
          <Activity className="w-4 h-4" /> Algorithm Activity
        </h3>
        <div className="space-y-2">
          {[
            { key: "resolution_sentiment", name: "Resolution Predictor", icon: Vote, color: "bg-emerald-500" },
            { key: "dissent_pattern", name: "Dissent Engine", icon: Eye, color: "bg-amber-500" },
            { key: "qa_governance_triage", name: "Q&A Triage", icon: MessageSquare, color: "bg-blue-500" },
            { key: "quorum_intelligence", name: "Quorum Intelligence", icon: Users, color: "bg-cyan-500" },
            { key: "regulatory_guardian", name: "Regulatory Guardian", icon: Shield, color: "bg-red-500" },
            { key: "governance_report", name: "Report Generator", icon: FileText, color: "bg-violet-500" },
          ].map(algo => {
            const count = data.algorithmStats[algo.key] ?? 0;
            return (
              <div key={algo.key} className="flex items-center justify-between py-1.5">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${algo.color}`} />
                  <algo.icon className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-sm text-slate-300">{algo.name}</span>
                </div>
                <span className={`text-sm font-mono ${count > 0 ? "text-white" : "text-slate-600"}`}>{count} obs</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-slate-400 mb-3 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" /> Recent Observations
        </h3>
        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {(data.observations ?? []).slice(0, 15).map((o: any) => (
            <div key={o.id} className={`flex items-start gap-2 p-2 rounded-lg text-xs ${
              o.severity === "critical" ? "bg-red-900/20 border border-red-500/20"
              : o.severity === "high" ? "bg-amber-900/20 border border-amber-500/20"
              : "bg-slate-800/50"
            }`}>
              <SeverityDot severity={o.severity} />
              <div className="flex-1 min-w-0">
                <div className="text-slate-300 font-medium truncate">{o.title}</div>
                <div className="text-slate-500 mt-0.5 line-clamp-2">{o.detail}</div>
              </div>
            </div>
          ))}
          {(data.observations ?? []).length === 0 && (
            <div className="text-center text-slate-600 py-6">No observations yet — run algorithms to generate</div>
          )}
        </div>
      </div>

      {(data.dissentPatterns ?? []).length > 0 && (
        <div className="lg:col-span-2 bg-slate-800/40 border border-slate-700/50 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-400 mb-3 flex items-center gap-2">
            <Eye className="w-4 h-4" /> Dissent Patterns (Self-Evolving Memory)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {(data.dissentPatterns ?? []).map((p: any) => (
              <div key={p.id} className="bg-slate-900/50 border border-slate-700/50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${
                    p.patternType === "threshold_breach" ? "bg-red-900/50 text-red-400"
                    : p.patternType === "institutional_block" ? "bg-amber-900/50 text-amber-400"
                    : "bg-slate-700 text-slate-400"
                  }`}>{p.patternType.replace("_", " ")}</span>
                  {p.category && <span className="text-[9px] text-slate-500">{p.category}</span>}
                  <span className="ml-auto text-[9px] text-slate-600">×{p.frequency}</span>
                </div>
                <div className="text-xs text-slate-300">{p.description}</div>
                {p.actionRecommendation && (
                  <div className="text-[10px] text-violet-400 mt-1.5 italic">{p.actionRecommendation}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ResolutionsTab({ sessionId, resolutions, onRefresh }: { sessionId: number; resolutions: any[]; onRefresh: () => void }) {
  const [showAdd, setShowAdd] = useState(false);
  const [resNum, setResNum] = useState(resolutions.length + 1);
  const [resTitle, setResTitle] = useState("");
  const [resCat, setResCat] = useState("ordinary");
  const addMut = trpc.agmGovernance.addResolution.useMutation();
  const predictMut = trpc.agmGovernance.predictApproval.useMutation();
  const recordMut = trpc.agmGovernance.recordResult.useMutation();
  const [resultInputs, setResultInputs] = useState<Record<number, string>>({});

  const handleAdd = async () => {
    if (!resTitle.trim()) { toast.error("Title required"); return; }
    try {
      await addMut.mutateAsync({ sessionId, resolutionNumber: resNum, title: resTitle.trim(), category: resCat as any });
      toast.success(`Resolution ${resNum} added`);
      setResTitle(""); setResNum(r => r + 1); setShowAdd(false);
      onRefresh();
    } catch (err: any) { toast.error(err.message); }
  };

  const handlePredict = async (resId: number) => {
    try {
      const result = await predictMut.mutateAsync({ sessionId, resolutionId: resId });
      toast.success(`Predicted ${result.predictedApprovalPct}% approval (confidence ${Math.round(result.confidence * 100)}%)`);
      onRefresh();
    } catch (err: any) { toast.error(err.message); }
  };

  const handleRecordResult = async (resId: number) => {
    const pct = parseFloat(resultInputs[resId] ?? "");
    if (isNaN(pct) || pct < 0 || pct > 100) { toast.error("Enter valid percentage (0-100)"); return; }
    try {
      const result = await recordMut.mutateAsync({ sessionId, resolutionId: resId, actualApprovalPct: pct });
      toast.success(`Result recorded: ${result.status}. Prediction accuracy: ${result.accuracy != null ? Math.round(result.accuracy) + "%" : "N/A"}`);
      onRefresh();
    } catch (err: any) { toast.error(err.message); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-400">Resolutions</h3>
        <button onClick={() => setShowAdd(!showAdd)} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 rounded-lg text-xs font-semibold transition">
          <Plus className="w-3.5 h-3.5" /> Add Resolution
        </button>
      </div>

      {showAdd && (
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4 space-y-3">
          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className="block text-[10px] text-slate-500 mb-1">Number</label>
              <input type="number" value={resNum} onChange={e => setResNum(parseInt(e.target.value) || 1)}
                className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1.5 text-sm text-white" />
            </div>
            <div className="col-span-2">
              <label className="block text-[10px] text-slate-500 mb-1">Title</label>
              <input value={resTitle} onChange={e => setResTitle(e.target.value)} placeholder="e.g. Approval of annual financial statements"
                className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1.5 text-sm text-white placeholder:text-slate-600" />
            </div>
            <div>
              <label className="block text-[10px] text-slate-500 mb-1">Category</label>
              <select value={resCat} onChange={e => setResCat(e.target.value)}
                className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1.5 text-sm text-white">
                {["ordinary","special","advisory","remuneration","board_election","auditor_appointment","share_repurchase","dividend","esg","other"].map(c => (
                  <option key={c} value={c}>{c.replace("_", " ")}</option>
                ))}
              </select>
            </div>
          </div>
          <button onClick={handleAdd} disabled={addMut.isPending}
            className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-600 rounded text-xs font-semibold transition disabled:opacity-50">
            {addMut.isPending ? "Adding..." : "Add"}
          </button>
        </div>
      )}

      {resolutions.length === 0 ? (
        <div className="text-center text-slate-600 py-12">No resolutions yet — add resolutions to activate the prediction engine</div>
      ) : (
        <div className="space-y-3">
          {resolutions.map((r: any) => (
            <div key={r.id} className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-slate-500">#{r.resolutionNumber}</span>
                    <span className="text-sm font-semibold text-white">{r.title}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] px-1.5 py-0.5 bg-slate-700 rounded text-slate-400">{r.category?.replace("_", " ")}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                      r.status === "carried" ? "bg-emerald-900/50 text-emerald-400"
                      : r.status === "defeated" ? "bg-red-900/50 text-red-400"
                      : r.status === "debating" ? "bg-blue-900/50 text-blue-400"
                      : "bg-slate-700 text-slate-400"
                    }`}>{r.status}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {r.predictedApprovalPct == null && (
                    <button onClick={() => handlePredict(r.id)} disabled={predictMut.isPending}
                      className="flex items-center gap-1 px-2 py-1 bg-violet-700 hover:bg-violet-600 rounded text-[10px] font-semibold transition">
                      <Brain className="w-3 h-3" /> Predict
                    </button>
                  )}
                </div>
              </div>

              {(r.predictedApprovalPct != null || r.actualApprovalPct != null) && (
                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-700/50">
                  {r.predictedApprovalPct != null && (
                    <div className="flex items-center gap-2">
                      <Target className="w-3.5 h-3.5 text-violet-400" />
                      <span className="text-xs text-slate-400">Predicted:</span>
                      <span className="text-sm font-bold font-mono text-violet-300">{r.predictedApprovalPct}%</span>
                    </div>
                  )}
                  {r.sentimentDuringDebate != null && (
                    <div className="flex items-center gap-2">
                      <BarChart3 className="w-3.5 h-3.5 text-blue-400" />
                      <span className="text-xs text-slate-400">Sentiment:</span>
                      <span className="text-sm font-bold font-mono text-blue-300">{r.sentimentDuringDebate}/100</span>
                    </div>
                  )}
                  {r.actualApprovalPct != null && (
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-xs text-slate-400">Actual:</span>
                      <span className="text-sm font-bold font-mono text-emerald-300">{r.actualApprovalPct}%</span>
                    </div>
                  )}
                  {r.predictionAccuracy != null && (
                    <div className="flex items-center gap-2">
                      <TrendingUp className={`w-3.5 h-3.5 ${r.predictionAccuracy >= 80 ? "text-emerald-400" : r.predictionAccuracy >= 60 ? "text-amber-400" : "text-red-400"}`} />
                      <span className="text-xs text-slate-400">Accuracy:</span>
                      <span className={`text-sm font-bold font-mono ${r.predictionAccuracy >= 80 ? "text-emerald-300" : r.predictionAccuracy >= 60 ? "text-amber-300" : "text-red-300"}`}>
                        {Math.round(r.predictionAccuracy)}%
                      </span>
                    </div>
                  )}
                  {r.actualApprovalPct == null && r.predictedApprovalPct != null && (
                    <div className="flex items-center gap-1.5 ml-auto">
                      <input
                        type="number" step="0.1" min="0" max="100"
                        value={resultInputs[r.id] ?? ""}
                        onChange={e => setResultInputs(prev => ({ ...prev, [r.id]: e.target.value }))}
                        placeholder="Actual %"
                        className="w-20 bg-slate-900 border border-slate-600 rounded px-2 py-1 text-xs text-white"
                      />
                      <button onClick={() => handleRecordResult(r.id)} disabled={recordMut.isPending}
                        className="px-2 py-1 bg-emerald-700 hover:bg-emerald-600 rounded text-[10px] font-semibold transition">
                        Record
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AlgorithmsTab({ data }: { data: any }) {
  const sessionId = data.session.id;
  const dissentMut = trpc.agmGovernance.analyzeDissentPatterns.useMutation();
  const quorumMut = trpc.agmGovernance.analyzeQuorum.useMutation();
  const complianceMut = trpc.agmGovernance.scanCompliance.useMutation();
  const triageMut = trpc.agmGovernance.triageQuestions.useMutation();

  const [quorumForm, setQuorumForm] = useState({ attendance: "", proxies: "", totalShares: "", represented: "" });
  const [qaText, setQaText] = useState("");
  const [complianceText, setComplianceText] = useState("");
  const [expandedAlgo, setExpandedAlgo] = useState<string | null>(null);

  const handleRunDissent = async () => {
    try {
      const r = await dissentMut.mutateAsync({ sessionId, clientName: data.session.clientName });
      toast.success(`Dissent analysis: ${r.patternsFound} patterns found, risk level: ${r.riskLevel}`);
    } catch (err: any) { toast.error(err.message); }
  };

  const handleRunQuorum = async () => {
    const a = parseInt(quorumForm.attendance), p = parseInt(quorumForm.proxies),
      t = parseInt(quorumForm.totalShares), r = parseInt(quorumForm.represented);
    if ([a, p, t, r].some(isNaN)) { toast.error("Fill in all quorum fields"); return; }
    try {
      const result = await quorumMut.mutateAsync({ sessionId, attendanceCount: a, proxyCount: p, totalEligibleShares: t, sharesRepresented: r });
      toast.success(`Quorum ${result.quorumMet ? "MET" : "NOT MET"}: ${result.quorumPercentage}%`);
    } catch (err: any) { toast.error(err.message); }
  };

  const handleRunTriage = async () => {
    const questions = qaText.split("\n").filter(l => l.trim()).map(line => {
      const match = line.match(/^\[?(.+?)\]?:\s*(.+)$/);
      return match ? { speaker: match[1].trim(), question: match[2].trim() } : { speaker: "Shareholder", question: line.trim() };
    });
    if (questions.length === 0) { toast.error("Paste at least one question"); return; }
    try {
      const r = await triageMut.mutateAsync({ sessionId, questions });
      toast.success(`Triaged ${r.triaged.length} questions, ${r.governanceQuestionCount} governance-related`);
    } catch (err: any) { toast.error(err.message); }
  };

  const handleRunCompliance = async () => {
    const segments = complianceText.split("\n").filter(l => l.trim()).map((line, i) => {
      const match = line.match(/^\[?(.+?)\]?:\s*(.+)$/);
      return match
        ? { speaker: match[1].trim(), text: match[2].trim(), timestamp: i }
        : { speaker: "Speaker", text: line.trim(), timestamp: i };
    });
    if (segments.length === 0) { toast.error("Paste transcript segments"); return; }
    try {
      const r = await complianceMut.mutateAsync({ sessionId, transcriptSegments: segments });
      toast.success(`Compliance scan: ${r.alerts.length} alerts, score ${r.complianceScore}/100`);
    } catch (err: any) { toast.error(err.message); }
  };
  const algorithms = [
    {
      key: "resolution_sentiment", name: "Resolution Sentiment Predictor", icon: Vote, color: "emerald",
      desc: "Predicts resolution approval percentages by analysing live debate sentiment, historical patterns, and category baselines. Learns from prediction accuracy vs actual outcomes. When accuracy drops below 75%, it feeds observations to the evolution engine for recalibration.",
      stats: `${data.resolutions.filter((r: any) => r.predictedApprovalPct != null).length} predictions made`,
    },
    {
      key: "dissent_pattern", name: "Shareholder Dissent Pattern Engine", icon: Eye, color: "amber",
      desc: "Builds institutional memory of shareholder opposition across AGMs. Detects category dissent (e.g. recurring remuneration pushback), threshold breaches (defeated resolutions), and cross-client trends. Uses evidence decay (14-day half-life) to weight recent patterns higher.",
      stats: `${data.dissentPatterns.length} patterns tracked`,
    },
    {
      key: "qa_governance_triage", name: "Q&A Governance Triage", icon: MessageSquare, color: "blue",
      desc: "Classifies shareholder questions by governance category (remuneration, board composition, ESG, audit, etc.) and regulatory significance. Identifies which questions legally must be addressed under Companies Act 71 and JSE Listings Requirements vs King IV best practice.",
      stats: `${data.session.qaQuestionsGovernance ?? 0} governance questions triaged`,
    },
    {
      key: "quorum_intelligence", name: "Quorum & Participation Intelligence", icon: Users, color: "cyan",
      desc: "Monitors attendance vs quorum thresholds by jurisdiction (SA: 25% of voting rights). Benchmarks participation against historical AGMs using decay-weighted averages. Alerts on thin quorum margins, unusual proxy patterns, and attendance deviations.",
      stats: `Quorum: ${data.session.quorumMet ? "Met" : data.session.quorumPercentage != null ? "NOT MET" : "Pending"} ${data.session.quorumPercentage != null ? `(${data.session.quorumPercentage}%)` : ""}`,
    },
    {
      key: "regulatory_guardian", name: "Regulatory Speech Guardian", icon: Shield, color: "red",
      desc: "Scans AGM speech for regulatory violations across 8 rule categories: Companies Act 71 (notice, director duty, resolution procedure, shareholder rights), JSE Listings (price-sensitive info, cautionary), King IV governance, and forward-looking statements. Critical flags auto-feed to the evolution engine.",
      stats: `${data.session.regulatoryAlerts ?? 0} regulatory alerts`,
    },
    {
      key: "governance_report", name: "Post-AGM Governance Report Generator", icon: FileText, color: "violet",
      desc: "Generates comprehensive board-ready governance reports with 12 sections: executive summary, resolution outcomes, governance health score, dissent analysis, compliance incidents, participation metrics, shareholder engagement, benchmarks, AI prediction performance, strategic recommendations, YoY trends, and next AGM preparation.",
      stats: data.session.aiGovernanceReport ? "Report generated" : "Awaiting generation",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-violet-900/30 to-blue-900/30 border border-violet-500/20 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <Brain className="w-5 h-5 text-violet-400" />
          <span className="text-sm font-semibold text-violet-300">Self-Evolution Integration</span>
        </div>
        <p className="text-xs text-slate-400">
          All 6 algorithms feed observations into the core AI Evolution Engine (Module M). After every AGM, weak predictions, missed risks, and governance gaps are automatically detected and used to improve future performance. Evolution observations generated this session: <span className="text-violet-300 font-mono font-bold">{data.session.evolutionObservationsGenerated ?? 0}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {algorithms.map(algo => {
          const obsCount = data.algorithmStats[algo.key] ?? 0;
          const colors: Record<string, string> = {
            emerald: "border-emerald-500/30 from-emerald-900/10",
            amber: "border-amber-500/30 from-amber-900/10",
            blue: "border-blue-500/30 from-blue-900/10",
            cyan: "border-cyan-500/30 from-cyan-900/10",
            red: "border-red-500/30 from-red-900/10",
            violet: "border-violet-500/30 from-violet-900/10",
          };
          const dotColors: Record<string, string> = {
            emerald: "bg-emerald-500", amber: "bg-amber-500", blue: "bg-blue-500",
            cyan: "bg-cyan-500", red: "bg-red-500", violet: "bg-violet-500",
          };
          const isExpanded = expandedAlgo === algo.key;
          const hasRunPanel = ["dissent_pattern", "qa_governance_triage", "quorum_intelligence", "regulatory_guardian"].includes(algo.key);
          return (
            <div key={algo.key} className={`bg-gradient-to-br ${colors[algo.color]} to-transparent border rounded-xl p-4`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${dotColors[algo.color]} ${obsCount > 0 ? "animate-pulse" : ""}`} />
                  <algo.icon className="w-4 h-4 text-slate-400" />
                  <span className="text-sm font-semibold text-white">{algo.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-slate-500">{obsCount} obs</span>
                  {hasRunPanel && (
                    <button onClick={() => setExpandedAlgo(isExpanded ? null : algo.key)}
                      className="px-2 py-0.5 bg-slate-700 hover:bg-slate-600 rounded text-[10px] font-semibold text-slate-300 transition">
                      {isExpanded ? "Close" : "Run"}
                    </button>
                  )}
                </div>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">{algo.desc}</p>
              <div className="mt-2 text-[10px] text-slate-500">{algo.stats}</div>

              {isExpanded && algo.key === "dissent_pattern" && (
                <div className="mt-3 pt-3 border-t border-slate-700/50">
                  <button onClick={handleRunDissent} disabled={dissentMut.isPending}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-700 hover:bg-amber-600 rounded text-xs font-semibold transition disabled:opacity-50">
                    {dissentMut.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Eye className="w-3 h-3" />}
                    Analyze Dissent Patterns
                  </button>
                  <p className="text-[10px] text-slate-500 mt-1">Scans all resolutions for opposition patterns and builds institutional memory.</p>
                </div>
              )}

              {isExpanded && algo.key === "quorum_intelligence" && (
                <div className="mt-3 pt-3 border-t border-slate-700/50 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <input value={quorumForm.attendance} onChange={e => setQuorumForm(f => ({...f, attendance: e.target.value}))}
                      placeholder="Attendance count" type="number" className="bg-slate-900 border border-slate-600 rounded px-2 py-1 text-[11px] text-white" />
                    <input value={quorumForm.proxies} onChange={e => setQuorumForm(f => ({...f, proxies: e.target.value}))}
                      placeholder="Proxy count" type="number" className="bg-slate-900 border border-slate-600 rounded px-2 py-1 text-[11px] text-white" />
                    <input value={quorumForm.totalShares} onChange={e => setQuorumForm(f => ({...f, totalShares: e.target.value}))}
                      placeholder="Total eligible shares" type="number" className="bg-slate-900 border border-slate-600 rounded px-2 py-1 text-[11px] text-white" />
                    <input value={quorumForm.represented} onChange={e => setQuorumForm(f => ({...f, represented: e.target.value}))}
                      placeholder="Shares represented" type="number" className="bg-slate-900 border border-slate-600 rounded px-2 py-1 text-[11px] text-white" />
                  </div>
                  <button onClick={handleRunQuorum} disabled={quorumMut.isPending}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-700 hover:bg-cyan-600 rounded text-xs font-semibold transition disabled:opacity-50">
                    {quorumMut.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Users className="w-3 h-3" />}
                    Analyze Quorum
                  </button>
                </div>
              )}

              {isExpanded && algo.key === "qa_governance_triage" && (
                <div className="mt-3 pt-3 border-t border-slate-700/50 space-y-2">
                  <textarea value={qaText} onChange={e => setQaText(e.target.value)} rows={3}
                    placeholder={"[John Smith]: What is the board's position on executive pay?\n[Jane Doe]: Can you explain the related party transaction?"}
                    className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1.5 text-[10px] text-white font-mono resize-y placeholder:text-slate-600" />
                  <button onClick={handleRunTriage} disabled={triageMut.isPending}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-700 hover:bg-blue-600 rounded text-xs font-semibold transition disabled:opacity-50">
                    {triageMut.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <MessageSquare className="w-3 h-3" />}
                    Triage Questions
                  </button>
                </div>
              )}

              {isExpanded && algo.key === "regulatory_guardian" && (
                <div className="mt-3 pt-3 border-t border-slate-700/50 space-y-2">
                  <textarea value={complianceText} onChange={e => setComplianceText(e.target.value)} rows={3}
                    placeholder={"[CEO]: This is confidential but we're in discussions about a potential merger\n[Chair]: We don't need to answer that question, move on"}
                    className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1.5 text-[10px] text-white font-mono resize-y placeholder:text-slate-600" />
                  <button onClick={handleRunCompliance} disabled={complianceMut.isPending}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-700 hover:bg-red-600 rounded text-xs font-semibold transition disabled:opacity-50">
                    {complianceMut.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Shield className="w-3 h-3" />}
                    Scan Compliance
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ReportTab({ report }: { report: any }) {
  if (!report) {
    return (
      <div className="text-center py-16">
        <FileText className="w-12 h-12 text-slate-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-slate-400">No Report Generated Yet</h3>
        <p className="text-sm text-slate-500 mt-2">Click "Generate Report" to create a comprehensive board-ready governance report.</p>
      </div>
    );
  }

  const sections = [
    { key: "executiveSummary", title: "Executive Summary", icon: FileText },
    { key: "resolutionOutcomes", title: "Resolution Outcomes", icon: Vote },
    { key: "governanceHealthScore", title: "Governance Health Score", icon: Shield },
    { key: "dissentAnalysis", title: "Dissent Analysis", icon: Eye },
    { key: "complianceIncidents", title: "Compliance Incidents", icon: AlertTriangle },
    { key: "participationMetrics", title: "Participation Metrics", icon: Users },
    { key: "shareholderEngagement", title: "Shareholder Engagement", icon: MessageSquare },
    { key: "benchmarkComparison", title: "Benchmark Comparison", icon: BarChart3 },
    { key: "aiPredictionPerformance", title: "AI Prediction Performance", icon: Target },
    { key: "strategicRecommendations", title: "Strategic Recommendations", icon: TrendingUp },
    { key: "yearOverYearTrends", title: "Year-Over-Year Trends", icon: PieChart },
    { key: "nextAgmPreparation", title: "Next AGM Preparation", icon: Scale },
  ];

  return (
    <div className="space-y-4">
      <div className="bg-emerald-900/20 border border-emerald-500/20 rounded-lg p-3 flex items-center gap-2">
        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
        <span className="text-sm text-emerald-300">Board-ready governance report generated by AI</span>
      </div>
      {sections.map(s => {
        const content = report[s.key];
        if (content === undefined || content === null) return null;
        return (
          <div key={s.key} className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <s.icon className="w-4 h-4 text-violet-400" />
              <h3 className="text-sm font-semibold text-slate-300">{s.title}</h3>
            </div>
            <div className="text-sm text-slate-400 leading-relaxed whitespace-pre-wrap">
              {typeof content === "string" ? content : JSON.stringify(content, null, 2)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: number | string; icon: React.ReactNode }) {
  return (
    <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-3 flex items-center gap-2.5">
      {icon}
      <div>
        <div className="text-lg font-bold font-mono text-white">{value}</div>
        <div className="text-[9px] text-slate-500 uppercase tracking-wider">{label}</div>
      </div>
    </div>
  );
}

function SeverityDot({ severity }: { severity: string }) {
  const colors: Record<string, string> = {
    critical: "bg-red-500", high: "bg-amber-500", medium: "bg-yellow-500", low: "bg-blue-500", info: "bg-slate-500",
  };
  return <div className={`w-2 h-2 rounded-full shrink-0 mt-1 ${colors[severity] ?? "bg-slate-500"}`} />;
}
