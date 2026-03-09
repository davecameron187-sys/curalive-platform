import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Search, Download, User, Clock, Loader2, RefreshCw, ChevronDown, Filter, Mic, AlertCircle } from "lucide-react";

interface Segment {
  speaker?: string;
  text: string;
  startTime?: number;
  endTime?: number;
  confidence?: number;
  language?: string;
}

interface Props {
  eventId: string;
  segments?: Segment[];
  isLive?: boolean;
  className?: string;
}

function formatTime(seconds?: number): string {
  if (!seconds && seconds !== 0) return "--:--";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function TranscriptViewer({ eventId, segments = [], isLive = false, className = "" }: Props) {
  const [search, setSearch] = useState("");
  const [selectedSpeaker, setSelectedSpeaker] = useState<string>("all");
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: transcriptData, refetch } = trpc.transcription.getTranscript.useQuery(
    { eventId },
    { refetchInterval: isLive ? 5000 : false }
  );

  const { data: jobs } = trpc.transcription.listJobs.useQuery({ eventId });

  const startWhisper = trpc.transcription.startWhisperJob.useMutation({
    onSuccess: () => refetch(),
  });

  const allSegments = [...segments, ...(transcriptData?.segments ?? [])];
  const speakers = Array.from(new Set(allSegments.map(s => s.speaker ?? "Unknown")));

  const filtered = allSegments.filter(seg => {
    const matchSearch = !search || seg.text.toLowerCase().includes(search.toLowerCase());
    const matchSpeaker = selectedSpeaker === "all" || (seg.speaker ?? "Unknown") === selectedSpeaker;
    return matchSearch && matchSpeaker;
  });

  const latestJob = jobs?.[0];
  const meta = transcriptData?.metadata;

  return (
    <div className={`flex flex-col bg-slate-900 rounded-lg border border-slate-700 ${className}`}>
      <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-700">
        <Mic className="w-4 h-4 text-slate-400 flex-shrink-0" />
        <span className="text-sm font-medium text-white flex-1">Transcript</span>
        {isLive && (
          <span className="flex items-center gap-1 text-xs text-emerald-400 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live
          </span>
        )}
        {!isLive && !meta && !latestJob && (
          <button
            onClick={() => startWhisper.mutate({ eventId })}
            disabled={startWhisper.isPending}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-700/50 hover:bg-blue-700 border border-blue-600/30 rounded text-xs text-blue-300 transition-colors"
          >
            {startWhisper.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
            Process Whisper
          </button>
        )}
      </div>

      {latestJob?.status === "failed" && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-500/10 border-b border-amber-500/20">
          <AlertCircle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
          <p className="text-xs text-amber-300">{latestJob.errorMessage ?? "Transcription failed"}</p>
        </div>
      )}

      {meta && (
        <div className="flex items-center gap-4 px-4 py-2.5 border-b border-slate-700 bg-slate-800/30 text-xs text-slate-400">
          <span>Source: <span className="text-slate-300">{meta.source}</span></span>
          {meta.language && <span>Lang: <span className="text-slate-300">{meta.language}</span></span>}
          {meta.wordCount && <span>{meta.wordCount.toLocaleString()} words</span>}
          {meta.confidence && <span>Confidence: <span className="text-slate-300">{meta.confidence}</span></span>}
        </div>
      )}

      <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-700">
        <div className="flex-1 flex items-center gap-2 bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5">
          <Search className="w-3.5 h-3.5 text-slate-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search transcript..."
            className="flex-1 bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none"
          />
        </div>
        {speakers.length > 1 && (
          <select
            value={selectedSpeaker}
            onChange={(e) => setSelectedSpeaker(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-xs text-white focus:outline-none"
          >
            <option value="all">All speakers</option>
            {speakers.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {filtered.length === 0 ? (
          <div className="text-center py-10 text-slate-500">
            <Mic className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">{allSegments.length === 0 ? "No transcript available" : "No results match your search"}</p>
          </div>
        ) : filtered.map((seg, i) => (
          <div key={i} className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0">
                <User className="w-3 h-3 text-slate-400" />
              </div>
              <span className="text-xs font-semibold text-teal-400">{seg.speaker ?? "Speaker"}</span>
              {seg.startTime !== undefined && (
                <span className="flex items-center gap-1 text-xs text-slate-600">
                  <Clock className="w-2.5 h-2.5" /> {formatTime(seg.startTime)}
                </span>
              )}
              {search && seg.text.toLowerCase().includes(search.toLowerCase()) && (
                <span className="ml-auto px-1.5 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded">match</span>
              )}
            </div>
            <p className="text-sm text-slate-300 leading-relaxed pl-7"
              dangerouslySetInnerHTML={{
                __html: search
                  ? seg.text.replace(new RegExp(`(${search})`, "gi"), '<mark class="bg-yellow-500/30 text-yellow-200 rounded px-0.5">$1</mark>')
                  : seg.text
              }}
            />
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {allSegments.length > 0 && (
        <div className="border-t border-slate-700 px-4 py-2 flex items-center justify-between">
          <span className="text-xs text-slate-500">{filtered.length} of {allSegments.length} segments</span>
          <button className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors">
            <Download className="w-3.5 h-3.5" /> Export
          </button>
        </div>
      )}
    </div>
  );
}
