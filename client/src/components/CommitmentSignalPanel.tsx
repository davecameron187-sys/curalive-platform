import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Zap, TrendingUp, AlertTriangle, MessageSquare, DollarSign, BarChart3, Trash2, Loader2, Send, ChevronDown, ChevronUp } from "lucide-react";

type SignalType = "soft_commit" | "interest" | "objection" | "question" | "pricing_discussion" | "size_discussion";

const SIGNAL_CONFIG: Record<SignalType, { label: string; color: string; bg: string; border: string; icon: React.ElementType }> = {
  soft_commit: { label: "Soft Commit", color: "text-emerald-400", bg: "bg-emerald-900/20", border: "border-emerald-700/40", icon: TrendingUp },
  interest: { label: "Interest", color: "text-blue-400", bg: "bg-blue-900/20", border: "border-blue-700/40", icon: Zap },
  objection: { label: "Objection", color: "text-red-400", bg: "bg-red-900/20", border: "border-red-700/40", icon: AlertTriangle },
  question: { label: "Question", color: "text-amber-400", bg: "bg-amber-900/20", border: "border-amber-700/40", icon: MessageSquare },
  pricing_discussion: { label: "Pricing", color: "text-violet-400", bg: "bg-violet-900/20", border: "border-violet-700/40", icon: DollarSign },
  size_discussion: { label: "Size", color: "text-cyan-400", bg: "bg-cyan-900/20", border: "border-cyan-700/40", icon: BarChart3 },
};

interface Props {
  meetingDbId: number;
  roadshowId: string;
  investorId?: number;
  investorName?: string;
  institution?: string;
}

export function CommitmentSignalPanel({ meetingDbId, roadshowId, investorId, investorName, institution }: Props) {
  const [transcript, setTranscript] = useState("");
  const [isExpanded, setIsExpanded] = useState(true);

  const { data: signals = [], refetch } = trpc.roadshowAI.getMeetingSignals.useQuery(
    { meetingDbId },
    { refetchInterval: 15000 }
  );

  const analyse = trpc.roadshowAI.analyseTranscript.useMutation({
    onSuccess: (data) => {
      toast.success(`${data.savedCount} signal${data.savedCount !== 1 ? "s" : ""} detected`);
      setTranscript("");
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteSignal = trpc.roadshowAI.deleteSignal.useMutation({
    onSuccess: () => { toast.success("Signal removed"); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const softCommits = signals.filter(s => s.signalType === "soft_commit");
  const interests = signals.filter(s => s.signalType === "interest");
  const objections = signals.filter(s => s.signalType === "objection");

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-slate-800/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-400" />
          <span className="text-sm font-semibold text-white">Commitment Signal Detector</span>
          {signals.length > 0 && (
            <div className="flex items-center gap-1.5 ml-2">
              {softCommits.length > 0 && (
                <span className="text-[10px] font-bold bg-emerald-900/40 text-emerald-400 border border-emerald-700/40 px-1.5 py-0.5 rounded">
                  {softCommits.length} commit{softCommits.length !== 1 ? "s" : ""}
                </span>
              )}
              {interests.length > 0 && (
                <span className="text-[10px] font-bold bg-blue-900/40 text-blue-400 border border-blue-700/40 px-1.5 py-0.5 rounded">
                  {interests.length} interest
                </span>
              )}
              {objections.length > 0 && (
                <span className="text-[10px] font-bold bg-red-900/40 text-red-400 border border-red-700/40 px-1.5 py-0.5 rounded">
                  {objections.length} objection{objections.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>
          )}
        </div>
        {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
      </div>

      {isExpanded && (
        <div className="px-4 pb-4 space-y-4">
          {/* Transcript input */}
          <div>
            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
              Paste transcript snippet to analyse
            </label>
            <textarea
              value={transcript}
              onChange={e => setTranscript(e.target.value)}
              placeholder={`Paste a section of the meeting transcript here...\n\nExample: "We'd be interested in participating at the $5m level if the pricing comes in around 8x. We have concerns about the leverage ratio but the management team is impressive."`}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 resize-none focus:outline-none focus:border-slate-500 transition-colors"
              rows={4}
              style={{ fontFamily: "'Inter', sans-serif" }}
            />
            <button
              onClick={() => {
                if (!transcript.trim()) return;
                analyse.mutate({ meetingDbId, roadshowId, transcriptSnippet: transcript, investorId, investorName, institution });
              }}
              disabled={analyse.isPending || !transcript.trim()}
              className="mt-2 flex items-center gap-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-black px-4 py-2 rounded-lg text-xs font-bold transition-colors"
            >
              {analyse.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              {analyse.isPending ? "Analysing…" : "Analyse for Signals"}
            </button>
          </div>

          {/* Detected signals */}
          {signals.length > 0 ? (
            <div className="space-y-2">
              <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                Detected Signals ({signals.length})
              </div>
              {signals.map(sig => {
                const cfg = SIGNAL_CONFIG[sig.signalType as SignalType] ?? SIGNAL_CONFIG.interest;
                const Icon = cfg.icon;
                return (
                  <div key={sig.id} className={`flex items-start gap-3 ${cfg.bg} border ${cfg.border} rounded-lg px-3 py-2.5`}>
                    <Icon className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${cfg.color}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${cfg.color}`}>{cfg.label}</span>
                        <span className="text-[10px] text-slate-500">
                          {sig.confidenceScore}% confidence
                        </span>
                        {sig.indicatedAmount && (
                          <span className="text-[10px] font-semibold bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded">
                            {sig.indicatedAmount}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed italic" style={{ fontFamily: "'Inter', sans-serif" }}>
                        "{sig.quote}"
                      </p>
                      {sig.investorName && (
                        <p className="text-[10px] text-slate-500 mt-1">{sig.investorName} · {sig.institution}</p>
                      )}
                    </div>
                    <button
                      onClick={() => deleteSignal.mutate({ signalId: sig.id })}
                      className="flex-shrink-0 text-slate-600 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-slate-600 text-center py-2" style={{ fontFamily: "'Inter', sans-serif" }}>
              No signals detected yet. Paste a transcript snippet above to get started.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
