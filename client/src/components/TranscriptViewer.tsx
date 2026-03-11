import { useState, useRef, useEffect, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Search, Download, User, Clock, Loader2, RefreshCw, ChevronDown, Filter, Mic, AlertCircle, Copy, Check, ArrowDown, Languages } from "lucide-react";
import { cn } from "@/lib/utils";

interface Segment {
  id?: number;
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

const LANGUAGES = [
  { code: "en", name: "English" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "es", name: "Spanish" },
  { code: "it", name: "Italian" },
  { code: "pt", name: "Portuguese" },
  { code: "ru", name: "Russian" },
  { code: "zh", name: "Chinese" },
  { code: "ja", name: "Japanese" },
  { code: "ko", name: "Korean" },
  { code: "ar", name: "Arabic", rtl: true },
  { code: "hi", name: "Hindi" },
];

function formatTime(seconds?: number): string {
  if (!seconds && seconds !== 0) return "--:--";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function TranscriptViewer({ eventId, segments = [], isLive = false, className = "" }: Props) {
  const [search, setSearch] = useState("");
  const [selectedSpeaker, setSelectedSpeaker] = useState<string>("all");
  const [language, setLanguage] = useState("en");
  const [copied, setCopied] = useState(false);
  const [autoScroll, setAutoScroll] = useState(isLive);
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: transcriptData, refetch } = trpc.transcription.getTranscript.useQuery(
    { eventId },
    { refetchInterval: isLive ? 3000 : false }
  );

  const { data: jobs } = trpc.transcription.listJobs.useQuery({ eventId });

  const startWhisper = trpc.transcription.startWhisperJob.useMutation({
    onSuccess: () => refetch(),
  });

  const allSegments = useMemo(() => {
    return [...segments, ...(transcriptData?.segments ?? [])];
  }, [segments, transcriptData?.segments]);

  const speakers = useMemo(() => {
    return Array.from(new Set(allSegments.map(s => s.speaker ?? "Unknown")));
  }, [allSegments]);
  
  const currentLang = LANGUAGES.find(l => l.code === language) || LANGUAGES[0];

  useEffect(() => {
    if (autoScroll && isLive) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [allSegments.length, autoScroll, isLive]);

  const filtered = allSegments.filter(seg => {
    const matchSearch = !search || seg.text.toLowerCase().includes(search.toLowerCase());
    const matchSpeaker = selectedSpeaker === "all" || (seg.speaker ?? "Unknown") === selectedSpeaker;
    return matchSearch && matchSpeaker;
  });

  const handleCopy = () => {
    const text = filtered.map(s => `[${formatTime(s.startTime)}] ${s.speaker ?? "Speaker"}: ${s.text}`).join("\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const latestJob = jobs?.[0];
  const meta = transcriptData?.metadata;

  return (
    <div className={cn("flex flex-col bg-slate-900 rounded-lg border border-slate-700 overflow-hidden", className)}>
      <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-700 bg-slate-800/50">
        <Mic className="w-4 h-4 text-slate-400 flex-shrink-0" />
        <span className="text-sm font-medium text-white flex-1">Transcript</span>
        
        {isLive && (
          <button 
            onClick={() => setAutoScroll(!autoScroll)}
            className={cn(
              "flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-bold uppercase transition-colors",
              autoScroll ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-slate-800 text-slate-400 border border-slate-700"
            )}
          >
            {autoScroll ? <><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live Scroll</> : "Manual Scroll"}
          </button>
        )}

        <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded px-2 py-1">
          <Languages className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="bg-transparent text-xs text-white focus:outline-none cursor-pointer"
          >
            {LANGUAGES.map(l => <option key={l.code} value={l.code} className="bg-slate-800">{l.name}</option>)}
          </select>
        </div>

        {!isLive && !meta && (!latestJob || latestJob.status === "failed") && (
          <button
            onClick={() => startWhisper.mutate({ eventId, language })}
            disabled={startWhisper.isPending}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-700/50 hover:bg-blue-700 border border-blue-600/30 rounded text-xs text-blue-300 transition-colors"
          >
            {startWhisper.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
            Start Whisper
          </button>
        )}
      </div>

      {latestJob && latestJob.status !== "completed" && (
        <div className={cn(
          "flex items-center gap-2 px-4 py-2.5 border-b",
          latestJob.status === "failed" ? "bg-red-500/10 border-red-500/20" : "bg-blue-500/10 border-blue-500/20"
        )}>
          {latestJob.status === "failed" ? (
            <AlertCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
          ) : (
            <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin flex-shrink-0" />
          )}
          <div className="flex-1">
            <p className={cn("text-xs font-medium", latestJob.status === "failed" ? "text-red-300" : "text-blue-300")}>
              {latestJob.status === "failed" ? `Failed: ${latestJob.errorMessage}` : `Transcription Job: ${latestJob.status}...`}
            </p>
            {latestJob.status === "processing" && (
              <div className="mt-1.5 w-full bg-blue-500/10 rounded-full h-1 overflow-hidden">
                <div className="bg-blue-500 h-full animate-progress" style={{ width: '60%' }} />
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-700 bg-slate-900/50">
        <div className="flex-1 flex items-center gap-2 bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5">
          <Search className="w-3.5 h-3.5 text-slate-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search transcript..."
            className="flex-1 bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded px-2 py-1.5">
          <User className="w-3.5 h-3.5 text-slate-500" />
          <select
            value={selectedSpeaker}
            onChange={(e) => setSelectedSpeaker(e.target.value)}
            className="bg-transparent text-xs text-white focus:outline-none cursor-pointer"
          >
            <option value="all" className="bg-slate-800">All Speakers</option>
            {speakers.map(s => <option key={s} value={s} className="bg-slate-800">{s}</option>)}
          </select>
        </div>
        <button 
          onClick={handleCopy}
          className="p-1.5 bg-slate-800 border border-slate-700 rounded hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          title="Copy to clipboard"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>

      <div 
        ref={scrollRef}
        className={cn(
          "flex-1 overflow-y-auto p-4 space-y-6 min-h-0 relative",
          currentLang.rtl && "text-right"
        )}
        dir={currentLang.rtl ? "rtl" : "ltr"}
      >
        {filtered.length === 0 ? (
          <div className="text-center py-20 text-slate-500">
            <Mic className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p className="text-sm">{allSegments.length === 0 ? "Transcript will appear here once processing starts" : "No results match your search"}</p>
          </div>
        ) : filtered.map((seg, i) => {
          const isLowConfidence = seg.confidence != null && seg.confidence < 0.8;
          return (
            <div key={seg.id || i} className="group relative">
              <div className={cn(
                "flex items-start gap-3",
                currentLang.rtl && "flex-row-reverse"
              )}>
                <div className="flex flex-col items-center pt-1">
                  <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-400 group-hover:border-teal-500/50 group-hover:text-teal-400 transition-colors">
                    {seg.speaker?.substring(0, 2).toUpperCase() ?? "S"}
                  </div>
                </div>
                <div className="flex-1 space-y-1">
                  <div className={cn(
                    "flex items-center gap-2",
                    currentLang.rtl && "flex-row-reverse"
                  )}>
                    <span className="text-xs font-bold text-teal-400">{seg.speaker ?? "Speaker"}</span>
                    {seg.startTime !== undefined && (
                      <button 
                        onClick={() => {/* Jump to timestamp in video if player exists */}}
                        className="text-[10px] text-slate-600 font-mono hover:text-teal-400 transition-colors"
                      >
                        {formatTime(seg.startTime)}
                      </button>
                    )}
                    {isLowConfidence && (
                      <span className="px-1.5 py-0.5 bg-amber-500/10 text-amber-500 text-[10px] font-medium rounded border border-amber-500/20 flex items-center gap-1">
                        <AlertCircle className="w-2.5 h-2.5" /> Low Confidence
                      </span>
                    )}
                  </div>
                  <p className={cn(
                    "text-sm leading-relaxed transition-colors",
                    isLowConfidence ? "text-slate-400" : "text-slate-200",
                    "group-hover:text-white"
                  )}
                  dangerouslySetInnerHTML={{
                    __html: search
                      ? seg.text.replace(new RegExp(`(${search})`, "gi"), '<mark class="bg-yellow-500/30 text-yellow-200 rounded px-0.5">$1</mark>')
                      : seg.text
                  }}
                  />
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} className="h-4" />
        
        {!autoScroll && isLive && allSegments.length > 0 && (
          <button 
            onClick={() => setAutoScroll(true)}
            className="absolute bottom-4 right-4 bg-teal-600 hover:bg-teal-500 text-white p-2 rounded-full shadow-lg animate-bounce flex items-center gap-2 px-3 z-10"
          >
            <ArrowDown className="w-4 h-4" />
            <span className="text-xs font-bold">Jump to Live</span>
          </button>
        )}
      </div>

      {meta && (
        <div className="px-4 py-2 bg-slate-800/80 border-t border-slate-700 flex items-center justify-between text-[10px] text-slate-400 font-medium">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1"><RefreshCw className="w-3 h-3" /> {meta.source}</span>
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {formatTime(meta.duration ?? undefined)}</span>
            <span>{meta.wordCount?.toLocaleString()} words</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={cn(
              "px-1.5 py-0.5 rounded",
              Number(meta.confidence) < 0.8 ? "bg-amber-500/20 text-amber-400" : "bg-slate-700 text-slate-300"
            )}>
              Confidence: {(Number(meta.confidence) * 100).toFixed(1)}%
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

