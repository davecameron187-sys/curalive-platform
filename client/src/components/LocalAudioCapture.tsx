// @ts-nocheck
import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Mic, MicOff, Radio, Square, Volume2, VolumeX,
  Monitor, Loader2, AlertTriangle, CheckCircle2,
} from "lucide-react";

type CaptureMode = "mic" | "tab" | "system";

interface LocalAudioCaptureProps {
  sessionId: number;
  isActive: boolean;
  mode?: "primary" | "standby";
  onSegment?: (segment: { speaker: string; text: string; timestamp: number; timeLabel: string }) => void;
}

const WHISPER_CHUNK_INTERVAL_MS = 15000;

export default function LocalAudioCapture({ sessionId, isActive, mode = "primary", onSegment }: LocalAudioCaptureProps) {
  const [captureMode, setCaptureMode] = useState<CaptureMode>("tab");
  const [isCapturing, setIsCapturing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [segmentCount, setSegmentCount] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [isSavingRecording, setIsSavingRecording] = useState(false);
  const [recordingSaved, setRecordingSaved] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);

  const recognitionRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const interimRef = useRef<string>("");

  const whisperRecorderRef = useRef<MediaRecorder | null>(null);
  const whisperChunksRef = useRef<Blob[]>([]);
  const whisperInitChunkRef = useRef<Blob | null>(null);
  const whisperIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const whisperActiveRef = useRef(false);
  const captureModeRef = useRef<CaptureMode>(captureMode);
  const standbyBufferRef = useRef<Blob[]>([]);
  const isStandbyRef = useRef(mode === "standby");

  useEffect(() => {
    captureModeRef.current = captureMode;
  }, [captureMode]);

  const pushSegment = trpc.shadowMode.pushTranscriptSegment.useMutation();

  const sendSegment = useCallback((text: string, speaker?: string) => {
    if (!text.trim() || text.trim().length < 2) return;
    const now = Date.now();
    const timeLabel = new Date(now).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
    const segment = { speaker: speaker || "Call Audio", text: text.trim(), timestamp: now, timeLabel };

    setSegmentCount(c => c + 1);
    onSegment?.(segment);

    pushSegment.mutate({
      sessionId,
      speaker: segment.speaker,
      text: segment.text,
      timestamp: segment.timestamp,
      timeLabel: segment.timeLabel,
    });
  }, [sessionId, onSegment, pushSegment]);

  const [chunksSent, setChunksSent] = useState(0);
  const [lastChunkSize, setLastChunkSize] = useState(0);
  const [lastChunkStatus, setLastChunkStatus] = useState<string>("");

  const sendWhisperChunk = useCallback(async () => {
    const chunkCount = whisperChunksRef.current.length;
    if (chunkCount === 0) {
      console.log("[LocalAudio] sendWhisperChunk: no chunks collected yet");
      return;
    }

    const currentChunks = whisperChunksRef.current;
    const initChunk = whisperInitChunkRef.current;
    const parts = initChunk
      ? [initChunk, ...currentChunks]
      : currentChunks;
    const blob = new Blob(parts, { type: "audio/webm;codecs=opus" });
    whisperChunksRef.current = [];

    console.log(`[LocalAudio] sendWhisperChunk: ${chunkCount} sub-chunks, blob size=${blob.size} bytes`);
    setLastChunkSize(blob.size);

    if (blob.size < 1000) {
      console.log("[LocalAudio] Chunk too small, skipping (< 1000 bytes — likely silence)");
      setLastChunkStatus("too small (silence?)");
      return;
    }

    setIsTranscribing(true);
    setLastChunkStatus("sending...");
    try {
      const fd = new FormData();
      fd.append("file", blob, "chunk.webm");
      const res = await fetch("/api/transcribe-audio", { method: "POST", body: fd });
      const statusCode = res.status;
      if (res.ok) {
        const data = await res.json();
        const transcript = data.transcript;
        console.log(`[LocalAudio] Whisper response OK: "${transcript?.slice(0, 80)}..." (${transcript?.length || 0} chars)`);
        setChunksSent(c => c + 1);
        if (transcript && transcript.trim().length > 1) {
          sendSegment(transcript, "Call Audio");
          setLastChunkStatus(`transcribed (${transcript.trim().split(/\s+/).length} words)`);
        } else {
          setLastChunkStatus("empty transcript returned");
        }
      } else {
        const errText = await res.text().catch(() => "");
        console.warn(`[LocalAudio] Whisper failed (${statusCode}):`, errText.slice(0, 200));
        setLastChunkStatus(`failed (${statusCode})`);
      }
    } catch (err: any) {
      console.warn("[LocalAudio] Whisper chunk error:", err);
      setLastChunkStatus(`error: ${err.message}`);
    } finally {
      setIsTranscribing(false);
    }
  }, [sendSegment]);

  const startWhisperTranscription = useCallback((stream: MediaStream) => {
    try {
      const audioStream = new MediaStream(stream.getAudioTracks());
      const recorder = new MediaRecorder(audioStream, { mimeType: "audio/webm;codecs=opus" });
      whisperChunksRef.current = [];
      whisperActiveRef.current = true;

      let subChunkCount = 0;
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          if (!whisperInitChunkRef.current) {
            whisperInitChunkRef.current = e.data;
          }
          whisperChunksRef.current.push(e.data);
          subChunkCount++;
          if (subChunkCount <= 3 || subChunkCount % 10 === 0) {
            console.log(`[LocalAudio] Recorder data: sub-chunk #${subChunkCount}, size=${e.data.size} bytes, total buffered=${whisperChunksRef.current.length}`);
          }
        }
      };

      recorder.onerror = (e: any) => {
        console.error("[LocalAudio] MediaRecorder error:", e.error || e);
      };

      recorder.start(1000);
      whisperRecorderRef.current = recorder;
      console.log(`[LocalAudio] MediaRecorder state: ${recorder.state}, mimeType: ${recorder.mimeType}`);

      whisperIntervalRef.current = setInterval(() => {
        if (whisperActiveRef.current) {
          sendWhisperChunk();
        }
      }, WHISPER_CHUNK_INTERVAL_MS);

      console.log("[LocalAudio] Whisper chunked transcription started (output audio)");
    } catch (err) {
      console.warn("[LocalAudio] Failed to start Whisper transcription:", err);
    }
  }, [sendWhisperChunk]);

  const stopWhisperTranscription = useCallback(() => {
    whisperActiveRef.current = false;
    whisperInitChunkRef.current = null;
    if (whisperIntervalRef.current) {
      clearInterval(whisperIntervalRef.current);
      whisperIntervalRef.current = null;
    }
    if (whisperRecorderRef.current && whisperRecorderRef.current.state !== "inactive") {
      try {
        whisperRecorderRef.current.onstop = () => {
          sendWhisperChunk();
        };
        whisperRecorderRef.current.stop();
      } catch {
        sendWhisperChunk();
      }
    } else {
      sendWhisperChunk();
    }
    whisperRecorderRef.current = null;
  }, [sendWhisperChunk]);

  const startSpeechRecognition = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("Speech recognition is not supported in this browser. Please use Chrome or Edge.");
      return null;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      let finalTranscript = "";
      let interimTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      if (finalTranscript) {
        sendSegment(finalTranscript, "Microphone");
        interimRef.current = "";
      } else {
        interimRef.current = interimTranscript;
      }
    };

    recognition.onerror = (event: any) => {
      if (event.error === "no-speech" || event.error === "aborted") return;
      console.warn("[LocalAudio] Speech recognition error:", event.error);
      if (event.error === "not-allowed") {
        setError("Microphone access denied. Please allow microphone access and try again.");
        stopCapture();
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      if (isCapturing && !isPaused) {
        try {
          recognition.start();
          setIsListening(true);
        } catch {}
      }
    };

    return recognition;
  }, [sendSegment, isCapturing, isPaused]);

  const startAudioLevelMonitor = useCallback((stream: MediaStream) => {
    try {
      const ctx = new AudioContext();
      audioContextRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        analyser.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((sum, v) => sum + v, 0) / dataArray.length;
        setAudioLevel(Math.min(100, Math.round((avg / 128) * 100)));
        animFrameRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch {}
  }, []);

  const startCapture = useCallback(async () => {
    setError(null);

    try {
      let stream: MediaStream;

      if (captureMode === "tab" || captureMode === "system") {
        try {
          stream = await navigator.mediaDevices.getDisplayMedia({
            audio: true,
            video: true,
          });

          const videoTracks = stream.getVideoTracks();
          videoTracks.forEach(track => {
            track.enabled = false;
          });
        } catch (err: any) {
          if (err.name === "NotAllowedError") {
            setError("Screen sharing was cancelled. You need to share a tab/window and check 'Share audio' to capture the call audio.");
            return;
          }
          throw err;
        }

        const audioTracks = stream.getAudioTracks();
        if (audioTracks.length === 0) {
          stream.getTracks().forEach(t => t.stop());
          setError("No audio track found. When sharing, make sure to check 'Share tab audio' or 'Share system audio' at the bottom of the dialog.");
          return;
        }
      } else {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      }

      streamRef.current = stream;

      stream.getTracks().forEach(track => {
        track.onended = () => {
          stopCapture();
          toast.info("Audio capture stopped — the shared tab or audio source was closed.");
        };
      });

      startAudioLevelMonitor(stream);

      try {
        const recorder = new MediaRecorder(stream, { mimeType: "audio/webm;codecs=opus" });
        chunksRef.current = [];
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunksRef.current.push(e.data);
        };
        recorder.start(5000);
        mediaRecorderRef.current = recorder;
      } catch {}

      if (captureMode === "tab" || captureMode === "system") {
        startWhisperTranscription(stream);
        setIsListening(true);
      } else {
        const recognition = startSpeechRecognition();
        if (recognition) {
          recognitionRef.current = recognition;
          recognition.start();
          setIsListening(true);
        }
      }

      setIsCapturing(true);
      setIsPaused(false);
      toast.success(
        captureMode === "tab" || captureMode === "system"
          ? "Capturing call audio — transcribing output via Whisper AI"
          : "Local audio capture started — CuraLive is now listening"
      );
    } catch (err: any) {
      console.error("[LocalAudio] Start failed:", err);
      setError(`Failed to start audio capture: ${err.message}`);
    }
  }, [captureMode, startSpeechRecognition, startAudioLevelMonitor, startWhisperTranscription]);

  const saveRecording = useCallback(async () => {
    if (chunksRef.current.length === 0) return;
    setIsSavingRecording(true);
    try {
      const blob = new Blob(chunksRef.current, { type: "audio/webm;codecs=opus" });
      const formData = new FormData();
      formData.append("recording", blob, `shadow-${sessionId}.webm`);

      const res = await fetch(`/api/shadow/recording/${sessionId}`, {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        setRecordingSaved(true);
        toast.success("Recording saved — available for download in the session");
      } else {
        toast.error("Failed to save recording");
      }
    } catch (err) {
      console.error("[LocalAudio] Recording save failed:", err);
      toast.error("Failed to save recording");
    } finally {
      setIsSavingRecording(false);
      chunksRef.current = [];
    }
  }, [sessionId]);

  const stopCapture = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      recognitionRef.current = null;
    }

    stopWhisperTranscription();

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (audioContextRef.current) {
      try { audioContextRef.current.close(); } catch {}
      audioContextRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      try {
        mediaRecorderRef.current.onstop = () => {
          saveRecording();
        };
        mediaRecorderRef.current.stop();
      } catch {
        saveRecording();
      }
    } else {
      saveRecording();
    }
    mediaRecorderRef.current = null;

    setIsCapturing(false);
    setIsPaused(false);
    setAudioLevel(0);
    setIsListening(false);
  }, [saveRecording, stopWhisperTranscription]);

  const togglePause = useCallback(() => {
    if (isPaused) {
      if (captureModeRef.current === "mic" && recognitionRef.current) {
        try { recognitionRef.current.start(); setIsListening(true); } catch {}
      }
      if (captureModeRef.current === "tab" || captureModeRef.current === "system") {
        whisperActiveRef.current = true;
        setIsListening(true);
      }
      setIsPaused(false);
    } else {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
      }
      whisperActiveRef.current = false;
      setIsPaused(true);
      setIsListening(false);
    }
  }, [isPaused]);

  useEffect(() => {
    return () => {
      stopCapture();
    };
  }, []);

  useEffect(() => {
    if (!isActive && isCapturing) {
      stopCapture();
    }
  }, [isActive]);

  useEffect(() => {
    if (isActive && !isCapturing) {
      startCapture();
    }
  }, [isActive]);

  if (!isActive && !isSavingRecording) return null;

  return (
    <div className="bg-white/[0.03] border border-white/10 rounded-xl overflow-hidden">
      <div className="px-5 py-3 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Mic className="w-4 h-4 text-cyan-400" />
          <span className="text-sm text-slate-300 font-medium">Local Audio Capture</span>
          {isCapturing && !isPaused && (
            <span className="flex items-center gap-1 text-xs text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              {captureModeRef.current === "mic" ? "Listening" : "Capturing Output"}
            </span>
          )}
          {isPaused && (
            <span className="text-xs text-amber-400">Paused</span>
          )}
        </div>
        {isCapturing && (
          <span className="text-xs text-slate-500">{segmentCount} segments captured</span>
        )}
      </div>

      <div className="p-4">
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-900/20 border border-red-500/20 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <p className="text-xs text-red-300">{error}</p>
          </div>
        )}

        {isSavingRecording && (
          <div className="mb-4 p-3 rounded-lg bg-cyan-900/20 border border-cyan-500/20 flex items-center gap-2">
            <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
            <p className="text-xs text-cyan-300">Saving recording...</p>
          </div>
        )}

        {recordingSaved && !isCapturing && (
          <div className="mb-4 p-3 rounded-lg bg-emerald-900/20 border border-emerald-500/20 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <p className="text-xs text-emerald-300">Recording saved — you can download it from the Event Recording section above after ending the session.</p>
          </div>
        )}

        {!isCapturing ? (
          <div className="space-y-4">
            <div>
              <label className="text-xs text-slate-500 block mb-2">Audio Source</label>
              <div className="flex gap-2">
                {[
                  { mode: "tab" as CaptureMode, label: "Tab / Window Audio", icon: Monitor, desc: "Captures and transcribes the call audio output (what participants are saying)" },
                  { mode: "mic" as CaptureMode, label: "Microphone", icon: Mic, desc: "Captures audio from your device microphone (speakerphone mode)" },
                ].map(({ mode, label, icon: Icon }) => (
                  <button
                    key={mode}
                    onClick={() => setCaptureMode(mode)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium border transition-all ${
                      captureMode === mode
                        ? "bg-cyan-500/20 border-cyan-500/60 text-cyan-300"
                        : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-slate-600 mt-2">
                {captureMode === "tab"
                  ? "Share the tab with the call — CuraLive captures the call's audio output and transcribes what participants are saying via Whisper AI. Transcription updates every ~15 seconds."
                  : "Uses your device microphone — put the call on speaker or use a speakerphone. Works with any audio source."}
              </p>
            </div>

            <Button
              onClick={startCapture}
              className="bg-cyan-600 hover:bg-cyan-500 gap-2 w-full"
            >
              <Radio className="w-4 h-4" />
              Start Local Audio Capture
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-slate-500">Audio Level</span>
                  {audioLevel > 5 ? (
                    <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <VolumeX className="w-3.5 h-3.5 text-slate-600" />
                  )}
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-100"
                    style={{
                      width: `${audioLevel}%`,
                      backgroundColor: audioLevel > 60 ? "#10b981" : audioLevel > 20 ? "#06b6d4" : "#64748b",
                    }}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={togglePause}
                  className={isPaused ? "text-amber-400 hover:text-amber-300" : "text-slate-400 hover:text-white"}
                >
                  {isPaused ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                  {isPaused ? "Resume" : "Pause"}
                </Button>
                <Button
                  size="sm"
                  onClick={stopCapture}
                  className="bg-red-600/20 hover:bg-red-600/40 text-red-300 border border-red-500/20 gap-1.5"
                >
                  <Square className="w-3.5 h-3.5" />
                  Stop
                </Button>
              </div>
            </div>

            {isListening && (
              <div className="flex items-center gap-2 text-xs text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>
                  {captureModeRef.current === "mic"
                    ? "Speech recognition active — transcribing microphone input in real-time"
                    : "Whisper AI active — transcribing call output audio every ~15 seconds"}
                </span>
              </div>
            )}

            {isTranscribing && (
              <div className="flex items-center gap-2 text-xs text-cyan-400">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Processing audio chunk with Whisper AI...</span>
              </div>
            )}

            {(chunksSent > 0 || lastChunkStatus) && (
              <div className="p-2 rounded-lg bg-white/[0.03] border border-white/5 space-y-1">
                <div className="flex items-center gap-3 text-[11px] text-slate-500">
                  <span>Chunks sent: <strong className="text-slate-300">{chunksSent}</strong></span>
                  {lastChunkSize > 0 && <span>Last size: <strong className="text-slate-300">{(lastChunkSize / 1024).toFixed(1)}KB</strong></span>}
                  {lastChunkStatus && <span>Status: <strong className={lastChunkStatus.includes("transcribed") ? "text-emerald-400" : lastChunkStatus.includes("fail") || lastChunkStatus.includes("error") ? "text-red-400" : "text-amber-400"}>{lastChunkStatus}</strong></span>}
                </div>
              </div>
            )}

            {captureModeRef.current === "mic" && interimRef.current && (
              <div className="p-2 rounded-lg bg-white/[0.02] border border-white/5">
                <span className="text-xs text-slate-600 italic">{interimRef.current}</span>
              </div>
            )}

            <div className="p-3 rounded-lg bg-cyan-900/10 border border-cyan-500/10">
              <p className="text-[11px] text-cyan-300/70">
                {captureModeRef.current === "tab"
                  ? "Capturing and transcribing the call's audio output. Whisper AI processes chunks every ~15 seconds. Keep the shared tab open. The transcript appears in the Live Transcript panel above."
                  : "Capturing audio from your microphone. Speak clearly or place your device near the audio source. The transcript appears in the Live Transcript panel above."}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
