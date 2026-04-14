import { useState, useRef, useEffect, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Mic, MicOff, Loader2, ChevronDown, ChevronUp, Radio, Zap, AlertCircle } from "lucide-react";

interface TranscriptSegment {
  id: string;
  text: string;
  timestamp: Date;
  analysed: boolean;
  signals?: number;
}

interface Props {
  meetingDbId: number;
  roadshowId: string;
  investorId?: number;
  investorName?: string;
  institution?: string;
}

// Extend window type for SpeechRecognition
interface ISpeechRecognitionEvent {
  resultIndex: number;
  results: { [index: number]: { isFinal: boolean; [alt: number]: { transcript: string } }; length: number };
}
interface ISpeechRecognitionErrorEvent {
  error: string;
}
interface ISpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onresult: ((event: ISpeechRecognitionEvent) => void) | null;
  onerror: ((event: ISpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}
declare global {
  interface Window {
    SpeechRecognition: new () => ISpeechRecognition;
    webkitSpeechRecognition: new () => ISpeechRecognition;
  }
}

export function LiveTranscriptFeed({ meetingDbId, roadshowId, investorId, investorName, institution }: Props) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [segments, setSegments] = useState<TranscriptSegment[]>([]);
  const [interimText, setInterimText] = useState("");
  const [autoAnalyse, setAutoAnalyse] = useState(true);
  const [supported, setSupported] = useState(true);
  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const pendingBufferRef = useRef<string>("");
  const analyseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const analyseTranscript = trpc.roadshowAI.analyseTranscript.useMutation({
    onSuccess: (data, variables) => {
      setSegments(prev => prev.map(s =>
        s.text === variables.transcriptSnippet
          ? { ...s, analysed: true, signals: data.signals.length }
          : s
      ));
      if (data.signals.length > 0) {
        toast.success(`${data.signals.length} signal${data.signals.length > 1 ? "s" : ""} detected — ${data.overallSentiment}`, { duration: 3000 });
      }
    },
    onError: () => {},
  });

  const triggerAnalysis = useCallback((text: string) => {
    if (!text.trim() || text.trim().split(" ").length < 8) return;
    analyseTranscript.mutate({
      meetingDbId,
      roadshowId,
      transcriptSnippet: text,
      investorId,
      investorName,
      institution,
    });
  }, [meetingDbId, roadshowId, investorId, investorName, institution]);

  const startListening = useCallback(() => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      setSupported(false);
      toast.error("Speech recognition not supported in this browser. Use Chrome or Edge.");
      return;
    }

    const recognition: ISpeechRecognition = new SpeechRecognitionAPI();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      let interim = "";
      let finalText = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalText += transcript + " ";
        } else {
          interim += transcript;
        }
      }

      setInterimText(interim);

      if (finalText.trim()) {
        const segmentId = `seg-${Date.now()}`;
        const newSegment: TranscriptSegment = {
          id: segmentId,
          text: finalText.trim(),
          timestamp: new Date(),
          analysed: false,
        };
        setSegments(prev => [...prev.slice(-49), newSegment]); // keep last 50
        pendingBufferRef.current += " " + finalText.trim();

        // Auto-analyse after 5 seconds of silence or 100+ words
        if (autoAnalyse) {
          if (analyseTimerRef.current) clearTimeout(analyseTimerRef.current);
          const wordCount = pendingBufferRef.current.trim().split(/\s+/).length;
          const delay = wordCount >= 80 ? 500 : 5000;
          analyseTimerRef.current = setTimeout(() => {
            const buffer = pendingBufferRef.current.trim();
            if (buffer) {
              triggerAnalysis(buffer);
              pendingBufferRef.current = "";
            }
          }, delay);
        }
      }
    };

    recognition.onerror = (event) => {
      if (event.error === "not-allowed") {
        toast.error("Microphone access denied. Please allow microphone permissions.");
        setIsListening(false);
      }
    };

    recognition.onend = () => {
      // Auto-restart if still supposed to be listening
      if (recognitionRef.current && isListening) {
        try { recognition.start(); } catch (_) {}
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
    setIsExpanded(true);
    toast.success("Live transcription started", { duration: 2000 });
  }, [autoAnalyse, triggerAnalysis, isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.onend = null;
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    if (analyseTimerRef.current) clearTimeout(analyseTimerRef.current);
    // Flush remaining buffer
    const buffer = pendingBufferRef.current.trim();
    if (buffer && autoAnalyse) triggerAnalysis(buffer);
    pendingBufferRef.current = "";
    setIsListening(false);
    setInterimText("");
    toast.info("Transcription stopped", { duration: 2000 });
  }, [autoAnalyse, triggerAnalysis]);

  // Scroll to bottom when new segments arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [segments, interimText]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
      }
      if (analyseTimerRef.current) clearTimeout(analyseTimerRef.current);
    };
  }, []);

  if (!supported) return null;

  return (
    <div className={`bg-slate-900 border rounded-xl overflow-hidden transition-colors ${isListening ? "border-red-700/60" : "border-slate-800"}`}>
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-slate-800/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          {isListening ? (
            <div className="relative">
              <Radio className="w-4 h-4 text-red-400" />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            </div>
          ) : (
            <Mic className="w-4 h-4 text-slate-400" />
          )}
          <span className="text-sm font-semibold text-white">Live Transcript Feed</span>
          {isListening && (
            <span className="text-[10px] font-semibold bg-red-900/40 text-red-400 border border-red-700/40 px-1.5 py-0.5 rounded animate-pulse">
              LIVE
            </span>
          )}
          {segments.length > 0 && (
            <span className="text-[10px] text-slate-500">{segments.length} segment{segments.length !== 1 ? "s" : ""}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Auto-analyse toggle */}
          <button
            onClick={(e) => { e.stopPropagation(); setAutoAnalyse(!autoAnalyse); }}
            className={`flex items-center gap-1.5 text-[10px] font-semibold px-2 py-1 rounded border transition-colors ${
              autoAnalyse
                ? "bg-indigo-900/30 text-indigo-400 border-indigo-700/40"
                : "bg-slate-800 text-slate-500 border-slate-700"
            }`}
            title="Auto-detect commitment signals from transcript"
          >
            <Zap className="w-3 h-3" /> Auto-Detect
          </button>
          {/* Start/Stop button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              isListening ? stopListening() : startListening();
            }}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
              isListening
                ? "bg-red-700 hover:bg-red-600 text-white"
                : "bg-slate-700 hover:bg-slate-600 text-white"
            }`}
          >
            {isListening ? <><MicOff className="w-3 h-3" /> Stop</> : <><Mic className="w-3 h-3" /> Start</>}
          </button>
          {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-slate-800">
          {/* Browser support note */}
          <div className="flex items-center gap-2 px-4 py-2 bg-amber-900/10 border-b border-amber-800/20">
            <AlertCircle className="w-3 h-3 text-amber-500 flex-shrink-0" />
            <span className="text-[10px] text-amber-400/80" style={{ fontFamily: "'Inter', sans-serif" }}>
              Requires Chrome or Edge with microphone permission. Captures operator's microphone — position near speaker.
            </span>
          </div>

          {/* Transcript scroll area */}
          <div
            ref={scrollRef}
            className="h-48 overflow-y-auto px-4 py-3 space-y-2 bg-slate-950/50"
          >
            {segments.length === 0 && !interimText ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Mic className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                  <p className="text-xs text-slate-600" style={{ fontFamily: "'Inter', sans-serif" }}>
                    {isListening ? "Listening… speak now" : "Click Start to begin live transcription"}
                  </p>
                </div>
              </div>
            ) : (
              <>
                {segments.map((seg) => (
                  <div key={seg.id} className="flex items-start gap-2">
                    <span className="text-[9px] text-slate-600 mt-0.5 flex-shrink-0 font-mono">
                      {seg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                    </span>
                    <p className="text-xs text-slate-300 leading-relaxed flex-1" style={{ fontFamily: "'Inter', sans-serif" }}>
                      {seg.text}
                    </p>
                    <div className="flex-shrink-0">
                      {seg.analysed ? (
                        seg.signals && seg.signals > 0 ? (
                          <span className="text-[9px] font-bold text-emerald-400 bg-emerald-900/20 px-1.5 py-0.5 rounded">
                            {seg.signals} signal{seg.signals > 1 ? "s" : ""}
                          </span>
                        ) : (
                          <span className="text-[9px] text-slate-600">✓</span>
                        )
                      ) : analyseTranscript.isPending ? (
                        <Loader2 className="w-3 h-3 animate-spin text-slate-600" />
                      ) : null}
                    </div>
                  </div>
                ))}
                {interimText && (
                  <div className="flex items-start gap-2 opacity-50">
                    <span className="text-[9px] text-slate-600 mt-0.5 flex-shrink-0 font-mono">…</span>
                    <p className="text-xs text-slate-400 leading-relaxed italic" style={{ fontFamily: "'Inter', sans-serif" }}>
                      {interimText}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer stats */}
          {segments.length > 0 && (
            <div className="flex items-center justify-between px-4 py-2 border-t border-slate-800 bg-slate-900/50">
              <div className="flex items-center gap-4">
                <span className="text-[10px] text-slate-500">
                  {segments.reduce((acc, s) => acc + s.text.split(" ").length, 0)} words
                </span>
                <span className="text-[10px] text-emerald-400">
                  {segments.filter(s => s.signals && s.signals > 0).length} segments with signals
                </span>
              </div>
              <button
                onClick={() => {
                  const buffer = pendingBufferRef.current.trim() || segments.slice(-3).map(s => s.text).join(" ");
                  if (buffer) triggerAnalysis(buffer);
                }}
                disabled={analyseTranscript.isPending}
                className="flex items-center gap-1.5 text-[10px] font-semibold text-indigo-400 hover:text-indigo-300 disabled:opacity-50 transition-colors"
              >
                {analyseTranscript.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                Analyse Now
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
