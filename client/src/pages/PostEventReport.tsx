import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { FileText, Download, RefreshCw, ArrowLeft, Brain, BarChart2, MessageSquare, Clock, Star, Zap, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

type ReportType = "full" | "executive" | "compliance";

function Section({ title, icon: Icon, content, color = "blue" }: { title: string; icon: any; content: string | null; color?: string }) {
  const colors: Record<string, string> = {
    blue: "text-blue-400 border-blue-500/30",
    green: "text-emerald-400 border-emerald-500/30",
    amber: "text-amber-400 border-amber-500/30",
    violet: "text-violet-400 border-violet-500/30",
    red: "text-red-400 border-red-500/30",
  };
  let parsed: any = null;
  if (content) {
    try { parsed = JSON.parse(content); } catch {}
  }
  return (
    <div className={`bg-slate-800/50 border rounded-lg p-5 border-l-2 ${colors[color]}`}>
      <div className="flex items-center gap-2 mb-3">
        <Icon className={`w-4 h-4 ${colors[color].split(" ")[0]}`} />
        <h3 className="text-sm font-semibold text-white">{title}</h3>
      </div>
      {!content ? (
        <p className="text-xs text-slate-500 italic">Not available</p>
      ) : parsed && typeof parsed === "object" ? (
        <pre className="text-xs text-slate-300 whitespace-pre-wrap font-mono leading-relaxed">
          {JSON.stringify(parsed, null, 2)}
        </pre>
      ) : (
        <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{content}</p>
      )}
    </div>
  );
}

export default function PostEventReport() {
  const { id: eventId } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const [reportType, setReportType] = useState<ReportType>("executive");
  const [generating, setGenerating] = useState(false);

  const { data: report, refetch } = trpc.postEventReport.getReport.useQuery(
    { eventId: eventId ?? "" },
    { enabled: !!eventId, refetchInterval: (data) => (!data || data.status === "generating") ? 3000 : false }
  );

  const generate = trpc.postEventReport.generate.useMutation({
    onMutate: () => setGenerating(true),
    onSuccess: () => {
      toast.success("Report generation started");
      refetch();
      setGenerating(false);
    },
    onError: (e) => { toast.error(e.message); setGenerating(false); },
  });

  const regenerate = trpc.postEventReport.regenerate.useMutation({
    onSuccess: () => { toast.success("Regenerating report..."); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const isGenerating = report?.status === "generating" || generating;
  const isCompleted = report?.status === "completed";

  return (
    <div className="min-h-screen bg-[#0a0d14] text-slate-200">
      <div className="border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
            <FileText className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Post-Event AI Report</h1>
            <p className="text-xs text-slate-400">Event: {eventId}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isCompleted && (
            <button
              onClick={() => regenerate.mutate({ reportId: report.id, eventId: eventId ?? "", reportType })}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded text-xs text-slate-300 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Regenerate
            </button>
          )}
          {isCompleted && report.pdfUrl && (
            <a
              href={report.pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded text-xs text-white font-medium transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Download PDF
            </a>
          )}
        </div>
      </div>

      <div className="p-6 max-w-4xl mx-auto space-y-6">
        {!report && (
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-8 text-center">
            <Brain className="w-12 h-12 mx-auto mb-4 text-blue-400 opacity-60" />
            <h2 className="text-base font-semibold text-white mb-2">No report generated yet</h2>
            <p className="text-sm text-slate-400 mb-6">Generate an AI-powered report from this event's transcript, Q&A, and engagement data.</p>

            <div className="flex items-center justify-center gap-3 mb-6">
              {(["executive", "full", "compliance"] as ReportType[]).map(t => (
                <button
                  key={t}
                  onClick={() => setReportType(t)}
                  className={`px-3 py-1.5 rounded text-xs font-medium border transition-colors ${
                    reportType === t ? "bg-blue-600 border-blue-500 text-white" : "bg-slate-700 border-slate-600 text-slate-300 hover:border-blue-500/50"
                  }`}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>

            <button
              onClick={() => generate.mutate({ eventId: eventId ?? "", reportType })}
              disabled={generating}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded font-medium text-sm text-white transition-colors mx-auto"
            >
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
              {generating ? "Generating..." : "Generate Report"}
            </button>
          </div>
        )}

        {isGenerating && (
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-6 flex items-center gap-4">
            <Loader2 className="w-6 h-6 text-blue-400 animate-spin flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-white">Generating AI report...</p>
              <p className="text-xs text-slate-400 mt-0.5">Analysing transcript, Q&A, and sentiment data. This takes about 30 seconds.</p>
            </div>
          </div>
        )}

        {isCompleted && report && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Report Type", value: report.reportType, icon: FileText },
                { label: "Status", value: "Completed", icon: CheckCircle2 },
                { label: "Generated", value: new Date(report.createdAt).toLocaleDateString(), icon: Clock },
                { label: "AI Powered", value: "Forge AI", icon: Brain },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-xs text-slate-400">{label}</span>
                  </div>
                  <p className="text-sm font-semibold text-white capitalize">{value}</p>
                </div>
              ))}
            </div>

            <Section title="Executive Summary" icon={Brain} content={report.aiSummary} color="blue" />
            <Section title="Key Moments" icon={Star} content={report.keyMoments} color="amber" />
            <Section title="Sentiment Analysis" icon={BarChart2} content={report.sentimentOverview} color="green" />
            <Section title="Q&A Summary" icon={MessageSquare} content={report.qaSummary} color="violet" />
            <Section title="Compliance Flags" icon={AlertCircle} content={report.complianceFlags} color="red" />
            <Section title="Engagement Metrics" icon={Zap} content={report.engagementMetrics} color="green" />
          </>
        )}
      </div>
    </div>
  );
}
