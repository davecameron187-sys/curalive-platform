import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { BookOpen, Loader2, RefreshCw, ChevronDown, ChevronUp, Target, AlertTriangle, MessageSquare, Lightbulb, User } from "lucide-react";

interface Props {
  investorId: number;
  meetingDbId: number;
  roadshowId: string;
  investorName: string;
  institution: string;
}

export function BriefingPackPanel({ investorId, meetingDbId, roadshowId, investorName, institution }: Props) {
  const [isExpanded, setIsExpanded] = useState(true);

  const { data: pack, refetch, isLoading } = trpc.roadshowAI.getBriefingPack.useQuery(
    { investorId, meetingDbId },
    { staleTime: 5 * 60 * 1000 }
  );

  const generate = trpc.roadshowAI.generateBriefingPack.useMutation({
    onSuccess: () => { toast.success("Briefing pack generated"); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-slate-800/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-indigo-400" />
          <span className="text-sm font-semibold text-white">AI Briefing Pack</span>
          {pack && (
            <span className="text-[10px] font-semibold bg-indigo-900/40 text-indigo-400 border border-indigo-700/40 px-1.5 py-0.5 rounded">
              Ready
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              generate.mutate({ investorId, meetingDbId, roadshowId });
            }}
            disabled={generate.isPending}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-3 py-1 rounded-lg text-[11px] font-semibold transition-colors"
          >
            {generate.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
            {generate.isPending ? "Generating…" : pack ? "Regenerate" : "Generate"}
          </button>
          {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
        </div>
      </div>

      {isExpanded && (
        <div className="px-4 pb-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-slate-500" />
            </div>
          ) : !pack ? (
            <div className="text-center py-8">
              <BookOpen className="w-8 h-8 text-slate-700 mx-auto mb-3" />
              <p className="text-sm text-slate-500 mb-1" style={{ fontFamily: "'Inter', sans-serif" }}>
                No briefing pack yet for {investorName}
              </p>
              <p className="text-xs text-slate-600" style={{ fontFamily: "'Inter', sans-serif" }}>
                Click Generate to create an AI briefing note for this meeting.
              </p>
            </div>
          ) : (
            <div className="space-y-4 mt-1">
              {/* Investor Profile */}
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Investor Profile</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>
                  {pack.investorProfile}
                </p>
              </div>

              {/* Recent Activity */}
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <Target className="w-3.5 h-3.5 text-blue-400" />
                  <span className="text-[10px] font-semibold text-blue-400 uppercase tracking-wider">Recent Activity & Positioning</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>
                  {pack.recentActivity}
                </p>
              </div>

              {/* Talking Points */}
              {pack.suggestedTalkingPoints?.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider">Suggested Talking Points</span>
                  </div>
                  <ul className="space-y-1.5">
                    {pack.suggestedTalkingPoints.map((point: string, i: number) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-amber-500 text-[10px] font-bold mt-0.5 flex-shrink-0">{i + 1}.</span>
                        <span className="text-xs text-slate-300 leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Known Concerns */}
              {pack.knownConcerns?.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                    <span className="text-[10px] font-semibold text-red-400 uppercase tracking-wider">Likely Objections / Concerns</span>
                  </div>
                  <ul className="space-y-1.5">
                    {pack.knownConcerns.map((concern: string, i: number) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-red-500 text-xs flex-shrink-0 mt-0.5">•</span>
                        <span className="text-xs text-slate-300 leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>{concern}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Opening Recommendation */}
              {pack.previousInteractions && (
                <div className="bg-indigo-900/20 border border-indigo-700/30 rounded-lg px-3 py-2.5">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="text-[10px] font-semibold text-indigo-400 uppercase tracking-wider">Opening Recommendation</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed italic" style={{ fontFamily: "'Inter', sans-serif" }}>
                    "{pack.previousInteractions}"
                  </p>
                </div>
              )}

              <p className="text-[10px] text-slate-600 text-right" style={{ fontFamily: "'Inter', sans-serif" }}>
                Generated {new Date(pack.generatedAt).toLocaleString()}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
