import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  ArrowLeft,
  Activity,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  FileText,
  Database,
  Phone,
  Brain,
  Radio,
  Video,
  Calendar,
  Clock,
  ChevronDown,
  ChevronRight,
  Loader2,
  Zap,
  HelpCircle,
} from "lucide-react";

const SERVICE_META: Record<string, { label: string; icon: any; color: string }> = {
  database: { label: "Database", icon: Database, color: "text-blue-400" },
  twilio: { label: "Twilio (Telephony)", icon: Phone, color: "text-green-400" },
  openai: { label: "OpenAI (AI Engine)", icon: Brain, color: "text-purple-400" },
  ably: { label: "Ably (Real-time)", icon: Radio, color: "text-orange-400" },
  recall: { label: "Recall.ai (Bots)", icon: Video, color: "text-cyan-400" },
  active_events: { label: "Active Events", icon: Calendar, color: "text-yellow-400" },
};

const STATUS_STYLES: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  healthy: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/30", dot: "bg-emerald-400" },
  degraded: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/30", dot: "bg-amber-400" },
  critical: { bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/30", dot: "bg-red-400" },
  unknown: { bg: "bg-slate-500/10", text: "text-slate-400", border: "border-slate-500/30", dot: "bg-slate-400" },
};

const CATEGORY_LABELS: Record<string, { label: string; color: string; icon: any }> = {
  platform: { label: "CuraLive Platform", color: "text-red-400", icon: Shield },
  participant: { label: "Participant Side", color: "text-amber-400", icon: HelpCircle },
  presenter: { label: "Presenter Side", color: "text-orange-400", icon: HelpCircle },
  network: { label: "Network / ISP", color: "text-blue-400", icon: Zap },
  third_party: { label: "Third-Party Service", color: "text-purple-400", icon: AlertTriangle },
  unknown: { label: "Under Investigation", color: "text-slate-400", icon: HelpCircle },
};

function ScoreMeter({ score, status }: { score: number; status: string }) {
  const styles = STATUS_STYLES[status] || STATUS_STYLES.unknown;
  return (
    <div className={`rounded-xl border ${styles.border} ${styles.bg} p-6 text-center`}>
      <div className={`text-5xl font-bold ${styles.text}`}>{score}</div>
      <div className="text-sm text-slate-400 mt-1">Platform Health Score</div>
      <div className={`mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${styles.bg} ${styles.text}`}>
        <span className={`w-2 h-2 rounded-full ${styles.dot} animate-pulse`} />
        {status.toUpperCase()}
      </div>
    </div>
  );
}

function ServiceCard({ result }: { result: any }) {
  const meta = SERVICE_META[result.service] || { label: result.service, icon: Activity, color: "text-slate-400" };
  const styles = STATUS_STYLES[result.status] || STATUS_STYLES.unknown;
  const Icon = meta.icon;

  return (
    <div className={`rounded-lg border ${styles.border} ${styles.bg} p-4`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon className={`w-5 h-5 ${meta.color}`} />
          <span className="text-sm font-medium text-white">{meta.label}</span>
        </div>
        <span className={`w-2.5 h-2.5 rounded-full ${styles.dot} ${result.status !== "healthy" ? "animate-pulse" : ""}`} />
      </div>
      <div className="flex items-center justify-between">
        <span className={`text-xs font-medium px-2 py-0.5 rounded ${styles.bg} ${styles.text} border ${styles.border}`}>
          {result.status.toUpperCase()}
        </span>
        <span className="text-xs text-slate-500">{result.latencyMs}ms</span>
      </div>
      {result.details?.error && (
        <p className="text-xs text-red-400/80 mt-2 truncate">{result.details.error}</p>
      )}
    </div>
  );
}

function IncidentRow({ incident, onGenerateReport, generatingId }: { incident: any; onGenerateReport: (id: number) => void; generatingId: number | null }) {
  const [expanded, setExpanded] = useState(false);
  const category = CATEGORY_LABELS[incident.root_cause_category] || CATEGORY_LABELS.unknown;
  const CategoryIcon = category.icon;
  const isActive = incident.status === "active";
  const severity = incident.severity === "critical" ? "text-red-400 bg-red-500/10 border-red-500/30" : "text-amber-400 bg-amber-500/10 border-amber-500/30";

  return (
    <div className={`rounded-lg border ${isActive ? "border-red-500/30 bg-red-500/5" : "border-slate-700 bg-slate-800/50"} overflow-hidden`}>
      <button onClick={() => setExpanded(!expanded)} className="w-full flex items-center gap-3 p-4 text-left hover:bg-white/5 transition">
        {expanded ? <ChevronDown className="w-4 h-4 text-slate-500 flex-shrink-0" /> : <ChevronRight className="w-4 h-4 text-slate-500 flex-shrink-0" />}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs font-medium px-2 py-0.5 rounded border ${severity}`}>
              {incident.severity.toUpperCase()}
            </span>
            <span className={`text-xs font-medium ${isActive ? "text-red-400" : "text-emerald-400"}`}>
              {isActive ? "ACTIVE" : "RESOLVED"}
            </span>
            <span className="text-xs text-slate-500">
              {SERVICE_META[incident.service]?.label || incident.service}
            </span>
          </div>
          <p className="text-sm text-slate-200 truncate">{incident.title}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <CategoryIcon className={`w-4 h-4 ${category.color}`} />
          <span className={`text-xs ${category.color}`}>{category.label}</span>
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-slate-700/50 pt-3 space-y-3">
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-slate-500">Detected</span>
              <p className="text-slate-300">{new Date(Number(incident.detected_at)).toLocaleString()}</p>
            </div>
            <div>
              <span className="text-slate-500">Resolved</span>
              <p className="text-slate-300">{incident.resolved_at ? new Date(Number(incident.resolved_at)).toLocaleString() : "Ongoing"}</p>
            </div>
          </div>

          {incident.root_cause && (
            <div>
              <span className="text-xs text-slate-500">Root Cause Analysis</span>
              <p className="text-sm text-slate-300 mt-1">{incident.root_cause}</p>
            </div>
          )}

          <div className={`flex items-center gap-2 p-2 rounded border ${category.color === "text-red-400" ? "bg-red-500/10 border-red-500/20" : category.color === "text-amber-400" ? "bg-amber-500/10 border-amber-500/20" : "bg-slate-700/50 border-slate-600"}`}>
            <CategoryIcon className={`w-4 h-4 ${category.color}`} />
            <span className={`text-xs font-medium ${category.color}`}>
              Issue attributed to: {category.label}
            </span>
          </div>

          <button
            onClick={() => onGenerateReport(incident.id)}
            disabled={generatingId === incident.id}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:opacity-50 text-white text-sm rounded-lg transition"
          >
            {generatingId === incident.id ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileText className="w-4 h-4" />
            )}
            {generatingId === incident.id ? "Generating Report..." : "Generate Customer Report"}
          </button>
        </div>
      )}
    </div>
  );
}

function ReportModal({ report, onClose }: { report: any; onClose: () => void }) {
  const category = CATEGORY_LABELS[report.rootCauseAttribution] || CATEGORY_LABELS.unknown;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-3xl w-full max-h-[85vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">{report.title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        <div className={`flex items-center gap-2 p-3 rounded-lg mb-4 border ${category.color === "text-red-400" ? "bg-red-500/10 border-red-500/20" : "bg-emerald-500/10 border-emerald-500/20"}`}>
          <Shield className={`w-5 h-5 ${category.color}`} />
          <span className={`text-sm font-medium ${category.color}`}>
            Root cause attributed to: {category.label}
          </span>
        </div>

        <div className="mb-4">
          <h3 className="text-sm font-medium text-slate-400 mb-1">Executive Summary</h3>
          <p className="text-sm text-slate-200">{report.summary}</p>
        </div>

        <div className="mb-4">
          <h3 className="text-sm font-medium text-slate-400 mb-1">Detailed Analysis</h3>
          <div className="text-sm text-slate-300 whitespace-pre-wrap bg-slate-800/50 rounded-lg p-4 border border-slate-700">
            {report.detailedAnalysis}
          </div>
        </div>

        {report.recommendations && (
          <div className="mb-4">
            <h3 className="text-sm font-medium text-slate-400 mb-1">Recommendations</h3>
            <div className="text-sm text-slate-300 whitespace-pre-wrap bg-slate-800/50 rounded-lg p-4 border border-slate-700">
              {report.recommendations}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 mt-4">
          <button
            onClick={() => {
              const text = `${report.title}\n\n${report.summary}\n\n${report.detailedAnalysis}\n\nRecommendations:\n${report.recommendations}`;
              navigator.clipboard.writeText(text);
              toast.success("Report copied to clipboard");
            }}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition"
          >
            Copy to Clipboard
          </button>
          <button onClick={onClose} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg transition">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default function HealthGuardian() {
  const [, navigate] = useLocation();
  const [generatingId, setGeneratingId] = useState<number | null>(null);
  const [report, setReport] = useState<any>(null);
  const [incidentFilter, setIncidentFilter] = useState<string>("all");

  const { data: status, refetch: refetchStatus, isLoading: statusLoading } = trpc.healthGuardian.currentStatus.useQuery(undefined, {
    refetchInterval: 15000,
  });

  const { data: incidents, refetch: refetchIncidents } = trpc.healthGuardian.incidents.useQuery(
    { status: incidentFilter === "all" ? undefined : incidentFilter, limit: 50 },
    { refetchInterval: 30000 }
  );

  const runCheck = trpc.healthGuardian.runCheck.useMutation({
    onSuccess: () => {
      toast.success("Health check completed");
      refetchStatus();
      refetchIncidents();
    },
    onError: (e) => toast.error(e.message),
  });

  const generateReport = trpc.healthGuardian.generateReport.useMutation({
    onSuccess: (data) => {
      setReport(data);
      setGeneratingId(null);
      toast.success("Customer report generated");
    },
    onError: (e) => {
      setGeneratingId(null);
      toast.error(e.message);
    },
  });

  const handleGenerateReport = (incidentId: number) => {
    setGeneratingId(incidentId);
    generateReport.mutate({ incidentId });
  };

  const overallScore = status?.overall?.score ?? 100;
  const overallStatus = status?.overall?.status ?? "unknown";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/")} className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-400" />
                AI Infrastructure Guardian
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">Autonomous platform health monitoring with AI-powered root cause analysis</p>
            </div>
          </div>
          <button
            onClick={() => runCheck.mutate()}
            disabled={runCheck.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white text-sm rounded-lg transition"
          >
            {runCheck.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Run Health Check Now
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
          <ScoreMeter score={overallScore} status={overallStatus} />
          <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-3 gap-3">
            {statusLoading ? (
              <div className="col-span-3 flex items-center justify-center py-8 text-slate-500">
                <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading service status...
              </div>
            ) : status?.results && status.results.length > 0 ? (
              status.results.map((r: any) => <ServiceCard key={r.service} result={r} />)
            ) : (
              <div className="col-span-3 flex items-center justify-center py-8 text-slate-500">
                <Activity className="w-5 h-5 mr-2" /> Waiting for first health check...
              </div>
            )}
          </div>
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              Incidents & Root Cause Analysis
            </h2>
            <div className="flex items-center gap-2">
              {["all", "active", "resolved"].map((f) => (
                <button
                  key={f}
                  onClick={() => setIncidentFilter(f)}
                  className={`px-3 py-1 text-xs rounded-lg transition ${
                    incidentFilter === f ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                  }`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            {Array.isArray(incidents) && incidents.length > 0 ? (
              (incidents as any[]).map((incident: any) => (
                <IncidentRow
                  key={incident.id}
                  incident={incident}
                  onGenerateReport={handleGenerateReport}
                  generatingId={generatingId}
                />
              ))
            ) : (
              <div className="text-center py-12 text-slate-500 border border-slate-800 rounded-lg bg-slate-900/50">
                <CheckCircle className="w-8 h-8 mx-auto mb-2 text-emerald-500/50" />
                <p className="text-sm">No incidents recorded</p>
                <p className="text-xs text-slate-600 mt-1">The AI Guardian is monitoring all services continuously</p>
              </div>
            )}
          </div>
        </div>

        <div className="border border-slate-800 rounded-lg bg-slate-900/50 p-4">
          <h3 className="text-sm font-medium text-slate-400 mb-2 flex items-center gap-2">
            <Clock className="w-4 h-4" /> How It Works
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-500">
            <div className="flex items-start gap-2">
              <Activity className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <span className="text-slate-300 font-medium">Deep Service Checks</span>
                <p className="mt-0.5">Every 30 seconds, the Guardian tests database, telephony, AI, real-time messaging, and bot services at the application level — not just pinging servers.</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Brain className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
              <div>
                <span className="text-slate-300 font-medium">AI Root Cause Analysis</span>
                <p className="mt-0.5">When an incident is detected, AI analyses the context and attributes the root cause — platform, participant, presenter, network, or third-party service.</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <FileText className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <span className="text-slate-300 font-medium">Customer Reports</span>
                <p className="mt-0.5">Generate professional incident reports that clearly show where the issue originated — proving when connectivity problems came from the participant's side, not the platform.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {report && <ReportModal report={report} onClose={() => setReport(null)} />}
    </div>
  );
}
