import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { ShieldCheck, ArrowLeft, Download, Filter, Clock, CheckCircle2, FileText, AlertTriangle } from "lucide-react";

const ACTION_COLORS: Record<string, string> = {
  flagged: "text-red-400 bg-red-500/10",
  reviewed: "text-amber-400 bg-amber-500/10",
  approved: "text-emerald-400 bg-emerald-500/10",
  disclosed: "text-blue-400 bg-blue-500/10",
  certificate_generated: "text-violet-400 bg-violet-500/10",
  exported: "text-slate-400 bg-slate-500/10",
};

const ACTION_ICONS: Record<string, any> = {
  flagged: AlertTriangle,
  reviewed: Clock,
  approved: CheckCircle2,
  disclosed: FileText,
  certificate_generated: ShieldCheck,
  exported: Download,
};

export default function ComplianceAuditLog() {
  const [, navigate] = useLocation();

  const { data: log } = trpc.compliance.getAuditLog.useQuery({ limit: 100 });

  const entries = log ?? [];

  function exportLog() {
    const csv = ["timestamp,event_id,action,user_id,details",
      ...entries.map(e => `${e.createdAt},${e.eventId ?? ""},${e.action},${e.userId ?? ""},${JSON.stringify(e.details ?? "")}`)
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `compliance-audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  }

  return (
    <div className="min-h-screen bg-[#0a0d14] text-slate-200">
      <div className="border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/")} className="text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-8 h-8 bg-gradient-to-br from-red-600 to-orange-600 rounded-lg flex items-center justify-center">
            <ShieldCheck className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Compliance Audit Log</h1>
            <p className="text-xs text-slate-400">All compliance events across all events</p>
          </div>
        </div>
        <button
          onClick={exportLog}
          className="flex items-center gap-2 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded text-xs text-slate-300 transition-colors"
        >
          <Download className="w-3.5 h-3.5" /> Export CSV
        </button>
      </div>

      <div className="p-6 max-w-4xl mx-auto">
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-6">
          {["flagged", "reviewed", "approved", "disclosed", "certificate_generated", "exported"].map(action => {
            const Icon = ACTION_ICONS[action] ?? AlertTriangle;
            const count = entries.filter(e => e.action === action).length;
            return (
              <div key={action} className="bg-slate-800/50 border border-slate-700 rounded-lg p-3 text-center">
                <Icon className={`w-4 h-4 mx-auto mb-1 ${ACTION_COLORS[action]?.split(" ")[0]}`} />
                <p className="text-lg font-bold text-white">{count}</p>
                <p className="text-xs text-slate-500 capitalize">{action.replace(/_/g, " ")}</p>
              </div>
            );
          })}
        </div>

        {entries.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <ShieldCheck className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="text-sm">No compliance events recorded yet</p>
            <p className="text-xs text-slate-600 mt-1">Events appear here when compliance scans are run on post-event reports</p>
          </div>
        ) : (
          <div className="space-y-2">
            {entries.map((entry) => {
              const Icon = ACTION_ICONS[entry.action] ?? AlertTriangle;
              const colors = ACTION_COLORS[entry.action] ?? ACTION_COLORS.exported;
              return (
                <div key={entry.id} className="flex items-start gap-3 bg-slate-800/40 border border-slate-700/50 rounded-lg px-4 py-3">
                  <div className={`w-7 h-7 rounded flex items-center justify-center flex-shrink-0 ${colors}`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-white capitalize font-medium">{entry.action.replace(/_/g, " ")}</span>
                      {entry.eventId && (
                        <span className="text-xs text-slate-500">· Event {entry.eventId}</span>
                      )}
                    </div>
                    {entry.details && (
                      <p className="text-xs text-slate-400 mt-0.5 truncate">{entry.details}</p>
                    )}
                  </div>
                  <span className="text-xs text-slate-600 flex-shrink-0">
                    {entry.createdAt ? new Date(entry.createdAt).toLocaleString() : "—"}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
