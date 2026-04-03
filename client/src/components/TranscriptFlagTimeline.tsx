import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Flag, Clock, ChevronDown, ChevronUp, AlertTriangle, Shield, TrendingUp, Zap, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TranscriptFlagTimelineProps {
  sessionId: number;
}

const FLAG_TYPES = [
  { value: "notable" as const, label: "Notable", icon: Flag, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
  { value: "compliance" as const, label: "Compliance", icon: Shield, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
  { value: "forward-guidance" as const, label: "Forward Guidance", icon: TrendingUp, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
  { value: "tone-shift" as const, label: "Tone Shift", icon: Zap, color: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/20" },
  { value: "action-required" as const, label: "Action Required", icon: AlertTriangle, color: "text-red-400", bg: "bg-red-500/10 border-red-500/20" },
];

export function TranscriptFlagTimeline({ sessionId }: TranscriptFlagTimelineProps) {
  const [expanded, setExpanded] = useState(true);
  const [flagText, setFlagText] = useState("");
  const [flagType, setFlagType] = useState<typeof FLAG_TYPES[number]["value"]>("notable");
  const [flagNote, setFlagNote] = useState("");
  const [flagSpeaker, setFlagSpeaker] = useState("");

  const { data: markers, refetch } = trpc.operations.getSessionMarkers.useQuery({ sessionId });
  const flagSegment = trpc.operations.flagTranscriptSegment.useMutation({ onSuccess: () => { refetch(); setFlagText(""); setFlagNote(""); } });

  return (
    <div className="bg-white/[0.03] border border-white/10 rounded-xl overflow-hidden">
      <button onClick={() => setExpanded(!expanded)} className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/[0.02] transition-colors">
        <div className="flex items-center gap-2">
          <Flag className="w-4 h-4 text-violet-400" />
          <span className="text-sm font-semibold text-slate-200">Transcript Flags & Timeline</span>
          <span className="text-xs text-slate-500 bg-white/5 px-2 py-0.5 rounded-full">{markers?.length ?? 0}</span>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3">
          <div className="bg-white/[0.02] rounded-lg p-3 space-y-2">
            <div className="flex gap-2">
              <input value={flagText} onChange={e => setFlagText(e.target.value)} placeholder="Transcript segment to flag..." className="flex-1 bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-violet-500" />
              <input value={flagSpeaker} onChange={e => setFlagSpeaker(e.target.value)} placeholder="Speaker" className="w-24 bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-violet-500" />
            </div>
            <div className="flex gap-2 items-center">
              <div className="flex gap-1 flex-1 flex-wrap">
                {FLAG_TYPES.map(ft => (
                  <button key={ft.value} onClick={() => setFlagType(ft.value)} className={`px-2 py-1 text-[10px] rounded border transition-colors ${flagType === ft.value ? ft.bg + " " + ft.color : "border-gray-700 text-gray-500 hover:border-gray-600"}`}>
                    {ft.label}
                  </button>
                ))}
              </div>
              <Button size="sm" disabled={!flagText.trim() || flagSegment.isPending} onClick={() => flagSegment.mutate({ sessionId, segmentText: flagText, flagType, operatorNote: flagNote || undefined, speaker: flagSpeaker || undefined })} className="bg-violet-600 hover:bg-violet-500 text-white text-xs px-3">
                Flag
              </Button>
            </div>
            <input value={flagNote} onChange={e => setFlagNote(e.target.value)} placeholder="Operator note (optional)" className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-violet-500" />
          </div>

          {markers && markers.length > 0 && (
            <div className="relative pl-4 border-l-2 border-white/10 space-y-3">
              {markers.map((m: any) => {
                const ft = FLAG_TYPES.find(f => f.value === m.flagType) || FLAG_TYPES[0];
                const Icon = ft.icon;
                return (
                  <div key={m.id} className="relative">
                    <div className={`absolute -left-[21px] w-3 h-3 rounded-full border-2 ${ft.bg}`} />
                    <div className={`${ft.bg} border rounded-lg p-3`}>
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className={`w-3 h-3 ${ft.color}`} />
                        <span className={`text-[10px] font-semibold uppercase tracking-wider ${ft.color}`}>{ft.label}</span>
                        {m.speaker && <span className="text-[10px] text-slate-400">· {m.speaker}</span>}
                        <span className="text-[10px] text-slate-600 ml-auto">{new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">{m.segmentText}</p>
                      {m.operatorNote && <p className="text-[10px] text-slate-500 mt-1 italic">{m.operatorNote}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
