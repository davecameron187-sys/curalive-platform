import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  ShieldCheck, ArrowLeft, AlertTriangle, CheckCircle2, Clock,
  FileText, Loader2, Search, RefreshCw, Download
} from "lucide-react";

const RISK_COLORS: Record<string, string> = {
  low: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  medium: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  high: "bg-red-500/15 text-red-300 border-red-500/30",
};

const STATUS_COLORS: Record<string, string> = {
  flagged: "bg-red-500/10 text-red-300",
  reviewed: "bg-amber-500/10 text-amber-300",
  approved: "bg-emerald-500/10 text-emerald-300",
  disclosed: "bg-blue-500/10 text-blue-300",
};

const STATUS_ICONS: Record<string, any> = {
  flagged: AlertTriangle,
  reviewed: Clock,
  approved: CheckCircle2,
  disclosed: FileText,
};

export default function ComplianceReport() {
  const { id: eventId } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [filterRisk, setFilterRisk] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [generating, setGenerating] = useState(false);

  const { data: flags, refetch } = trpc.compliance.getFlaggedStatements.useQuery(
    { eventId: eventId ?? "" },
    { enabled: !!eventId }
  );

  const scanTranscript = trpc.compliance.scanTranscript.useMutation({
    onMutate: () => setGenerating(true),
    onSuccess: (data) => {
      toast.success(`${data.flaggedCount} statements flagged for review`);
      refetch();
      setGenerating(false);
    },
    onError: (e) => { toast.error(e.message); setGenerating(false); },
  });

  const reviewStatement = trpc.compliance.reviewStatement.useMutation({
    onSuccess: () => { toast.success("Marked as reviewed"); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const approveStatement = trpc.compliance.approveStatement.useMutation({
    onSuccess: () => { toast.success("Statement approved"); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const generateCert = trpc.compliance.generateComplianceCertificate.useMutation({
    onSuccess: (data) => {
      const certJson = JSON.stringify(data.certificate, null, 2);
      const blob = new Blob([certJson], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `compliance-certificate-${eventId}.json`;
      a.click();
      toast.success("Compliance Certificate downloaded");
    },
    onError: (e) => toast.error(e.message),
  });

  const allFlags = flags ?? [];
  const filtered = allFlags.filter(f => {
    const matchSearch = !search || f.statementText.toLowerCase().includes(search.toLowerCase()) || (f.speakerName ?? "").toLowerCase().includes(search.toLowerCase());
    const matchRisk = filterRisk === "all" || f.riskLevel === filterRisk;
    const matchStatus = filterStatus === "all" || f.complianceStatus === filterStatus;
    return matchSearch && matchRisk && matchStatus;
  });

  const stats = {
    total: allFlags.length,
    high: allFlags.filter(f => f.riskLevel === "high").length,
    medium: allFlags.filter(f => f.riskLevel === "medium").length,
    approved: allFlags.filter(f => f.complianceStatus === "approved").length,
    pending: allFlags.filter(f => f.complianceStatus === "flagged").length,
  };

  return (
    <div className="min-h-screen bg-[#0a0d14] text-slate-200">
      <div className="border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(`/post-event/${eventId}`)} className="text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-8 h-8 bg-gradient-to-br from-red-600 to-orange-600 rounded-lg flex items-center justify-center">
            <ShieldCheck className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Compliance Review</h1>
            <p className="text-xs text-slate-400">Event: {eventId}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {allFlags.length > 0 && (
            <button
              onClick={() => generateCert.mutate({ eventId: eventId ?? "", eventTitle: eventId })}
              disabled={generateCert.isPending}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded text-xs text-slate-300 transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> Certificate
            </button>
          )}
          <button
            onClick={() => scanTranscript.mutate({ eventId: eventId ?? "" })}
            disabled={generating}
            className="flex items-center gap-2 px-3 py-1.5 bg-red-700/60 hover:bg-red-700 border border-red-600/40 rounded text-xs font-medium text-red-200 transition-colors"
          >
            {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            {generating ? "Scanning..." : "Scan Transcript"}
          </button>
        </div>
      </div>

      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: "Total Flags", value: stats.total, color: "text-slate-300" },
            { label: "High Risk", value: stats.high, color: "text-red-400" },
            { label: "Medium Risk", value: stats.medium, color: "text-amber-400" },
            { label: "Approved", value: stats.approved, color: "text-emerald-400" },
            { label: "Pending Review", value: stats.pending, color: "text-orange-400" },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-slate-800/50 border border-slate-700 rounded-lg p-3 text-center">
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {allFlags.length === 0 ? (
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-10 text-center">
            <ShieldCheck className="w-12 h-12 mx-auto mb-3 text-slate-500 opacity-40" />
            <h2 className="text-sm font-semibold text-white mb-2">No statements scanned yet</h2>
            <p className="text-xs text-slate-400 mb-4">Click "Scan Transcript" to use AI to identify potentially non-compliant statements from the event.</p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3">
              <div className="flex-1 flex items-center gap-2 bg-slate-800 border border-slate-700 rounded px-3 py-2">
                <Search className="w-4 h-4 text-slate-500" />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search statements..."
                  className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none" />
              </div>
              <select value={filterRisk} onChange={(e) => setFilterRisk(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none">
                <option value="all">All Risk</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none">
                <option value="all">All Status</option>
                <option value="flagged">Flagged</option>
                <option value="reviewed">Reviewed</option>
                <option value="approved">Approved</option>
              </select>
            </div>

            <div className="space-y-3">
              {filtered.map((flag) => {
                const StatusIcon = STATUS_ICONS[flag.complianceStatus] ?? AlertTriangle;
                return (
                  <div key={flag.id} className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <p className="text-sm text-white leading-relaxed flex-1">"{flag.statementText}"</p>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span className={`px-2 py-0.5 rounded border text-xs font-medium ${RISK_COLORS[flag.riskLevel]}`}>
                          {flag.riskLevel} risk
                        </span>
                        <span className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[flag.complianceStatus]}`}>
                          <StatusIcon className="w-3 h-3" />
                          {flag.complianceStatus}
                        </span>
                      </div>
                    </div>
                    {(flag.speakerName || flag.timestamp) && (
                      <p className="text-xs text-slate-500 mb-2">
                        {flag.speakerName && <span className="text-slate-400">{flag.speakerName}</span>}
                        {flag.timestamp && <span> · {flag.timestamp}</span>}
                      </p>
                    )}
                    {flag.flagReason && (
                      <p className="text-xs text-slate-400 mb-3 bg-slate-900/40 px-3 py-2 rounded border-l-2 border-amber-500/40">
                        {flag.flagReason}
                      </p>
                    )}
                    {flag.complianceStatus === "flagged" && (
                      <div className="flex gap-2">
                        <button onClick={() => reviewStatement.mutate({ flagId: flag.id })}
                          className="flex items-center gap-1 px-2.5 py-1 bg-amber-700/30 hover:bg-amber-700/50 border border-amber-600/30 rounded text-xs text-amber-300 transition-colors">
                          <Clock className="w-3 h-3" /> Mark Reviewed
                        </button>
                      </div>
                    )}
                    {flag.complianceStatus === "reviewed" && (
                      <div className="flex gap-2">
                        <button onClick={() => approveStatement.mutate({ flagId: flag.id })}
                          className="flex items-center gap-1 px-2.5 py-1 bg-emerald-700/30 hover:bg-emerald-700/50 border border-emerald-600/30 rounded text-xs text-emerald-300 transition-colors">
                          <CheckCircle2 className="w-3 h-3" /> Approve
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
              {filtered.length === 0 && (
                <p className="text-center text-slate-500 py-8 text-sm">No statements match your filters</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
