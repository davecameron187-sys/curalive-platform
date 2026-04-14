/**
 * Webphone — Browser-based softphone component for the CuraLive Operator Console.
 *
 * Features:
 *   - Dial pad (0–9, *, #) with DTMF tone support via Web Audio API
 *   - Call controls: Call, Hang Up, Mute, Hold
 *   - Caller ID selection dropdown (fetches purchased + verified Twilio numbers)
 *   - Human-readable Twilio error messages
 *   - Incoming call UI (ring notification, accept/reject)
 *   - Dual-carrier indicator: Twilio (primary) + Telnyx (fallback)
 *   - Automatic failover: if primary token fails, silently switches to fallback
 *   - Call duration timer
 *   - Enhanced recent calls list with call history panel
 *   - Minimise/expand toggle for use alongside OCC panels
 *   - Pre-fill dial pad from external prop (e.g. clicking a participant phone number)
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { Device as TwilioDevice } from "@twilio/voice-sdk";
import type { Call as TwilioCall } from "@twilio/voice-sdk";
import {
  Phone, PhoneOff, Mic, MicOff, PhoneCall, PhoneIncoming, PhoneForwarded,
  ChevronDown, ChevronUp, Clock, Signal, AlertTriangle, CheckCircle,
  XCircle, RotateCcw, Hash, History, ChevronRight, Volume2, Play, Square,
  ArrowRightLeft, Voicemail, FileText, Search, Loader2
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type CallState = "idle" | "connecting" | "ringing" | "in_call" | "ending" | "incoming";
type Carrier = "twilio" | "telnyx";
type ViewMode = "dialer" | "history" | "voicemails" | "transcripts";

interface WebphoneProps {
  /** Pre-fill the dial pad with this number (e.g. from a participant row) */
  prefillNumber?: string;
  /** Optional conference ID to associate sessions with */
  conferenceId?: number;
  /** Whether the panel starts minimised */
  defaultMinimised?: boolean;
  /** Callback when a call starts */
  onCallStart?: (number: string, carrier: Carrier) => void;
  /** Callback when a call ends */
  onCallEnd?: (durationSecs: number) => void;
}

// ─── Twilio error code → user-friendly message map (client-side) ─────────────

const TWILIO_ERROR_MAP: Record<number, string> = {
  13224: "Invalid phone number format. Use E.164 format (e.g. +27821234567).",
  13225: "Caller ID is not a verified Twilio number.",
  13227: "Destination number is not reachable.",
  13228: "Call rejected by the destination carrier.",
  13230: "Destination number is busy. Try again later.",
  13231: "Call timed out — no answer.",
  13233: "International calling is not enabled on this account.",
  13235: "Destination country is not supported.",
  20101: "Access token is invalid or expired. Refresh the page.",
  20103: "Access token has expired. Refresh the page.",
  31002: "Connection declined by Twilio.",
  31003: "Connection timed out. Check your internet.",
  31005: "WebSocket connection failed. Check firewall settings.",
  31009: "Transport error — unstable internet connection.",
  31201: "Authentication failed. Credentials may be invalid.",
  31204: "Voice SDK could not register. Check TwiML App SID.",
  31205: "JWT token expired during the call. Refresh and retry.",
  31208: "Media connection failed. Check microphone and firewall.",
  31401: "Insufficient funds in Twilio account.",
  31480: "No answer from the dialled number.",
  31486: "The dialled number is busy.",
  31603: "Call rejected by the remote party.",
};

function friendlyError(err: unknown): string {
  if (!err) return "An unknown error occurred.";
  const e = err as { code?: number; message?: string };
  if (e.code && TWILIO_ERROR_MAP[e.code]) return TWILIO_ERROR_MAP[e.code];
  return e.message || "An unknown error occurred.";
}

// ─── DTMF tone frequencies ────────────────────────────────────────────────────

const DTMF_FREQS: Record<string, [number, number]> = {
  "1": [697, 1209], "2": [697, 1336], "3": [697, 1477],
  "4": [770, 1209], "5": [770, 1336], "6": [770, 1477],
  "7": [852, 1209], "8": [852, 1336], "9": [852, 1477],
  "*": [941, 1209], "0": [941, 1336], "#": [941, 1477],
};

function playDTMF(key: string) {
  try {
    const ctx = new AudioContext();
    const [f1, f2] = DTMF_FREQS[key] ?? [697, 1209];
    [f1, f2].forEach(freq => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    });
  } catch {
    // AudioContext not available — silently ignore
  }
}

// ─── Ring tone generator ──────────────────────────────────────────────────────

function useRingTone() {
  const ctxRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const start = useCallback(() => {
    try {
      const ctx = new AudioContext();
      ctxRef.current = ctx;
      const playRing = () => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 440;
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
        osc.start();
        osc.stop(ctx.currentTime + 0.5);
      };
      playRing();
      intervalRef.current = setInterval(playRing, 2000);
    } catch { /* ignore */ }
  }, []);

  const stop = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    ctxRef.current?.close();
    ctxRef.current = null;
  }, []);

  return { start, stop };
}

// ─── Carrier status dot ───────────────────────────────────────────────────────

function CarrierDot({ status, label, active }: { status: string; label: string; active: boolean }) {
  const colour =
    status === "healthy" ? "bg-emerald-400" :
    status === "degraded" ? "bg-amber-400" : "bg-red-500";
  return (
    <div className={cn("flex items-center gap-1.5 text-xs", active ? "text-foreground" : "text-muted-foreground")}>
      <span className={cn("w-2 h-2 rounded-full", colour, active && "ring-1 ring-white/40")} />
      <span className="font-mono">{label}</span>
      {active && <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 border-primary/40 text-primary">ACTIVE</Badge>}
    </div>
  );
}

// ─── Main Webphone component ──────────────────────────────────────────────────

export default function Webphone({
  prefillNumber = "",
  conferenceId,
  defaultMinimised = false,
  onCallStart,
  onCallEnd,
}: WebphoneProps) {
  // UI state
  const [minimised, setMinimised] = useState(defaultMinimised);
  const [viewMode, setViewMode] = useState<ViewMode>("dialer");
  const [dialValue, setDialValue] = useState(prefillNumber);
  const [callState, setCallState] = useState<CallState>("idle");
  const [muted, setMuted] = useState(false);
  const [onHold, setOnHold] = useState(false);
  const [activeCarrier, setActiveCarrier] = useState<Carrier>("twilio");
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [selectedCallerId, setSelectedCallerId] = useState<string>("");
  const [incomingFrom, setIncomingFrom] = useState<string>("");

  // Transfer state
  const [showTransferInput, setShowTransferInput] = useState(false);
  const [transferTarget, setTransferTarget] = useState("");
  const [transferType, setTransferType] = useState<"blind" | "warm">("blind");

  // Transcripts search
  const [searchQuery, setSearchQuery] = useState("");

  // Call timer
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Twilio device ref
  const twilioDeviceRef = useRef<unknown>(null);
  const twilioCallRef = useRef<unknown>(null);

  // Ring tone
  const ringTone = useRingTone();

  // tRPC
  const { data: accountStatus } = trpc.webphone.getAccountStatus.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
  const { data: carrierStatus, refetch: refetchCarrierStatus } = trpc.webphone.getCarrierStatus.useQuery(undefined, {
    refetchInterval: 30_000,
  });
  const { data: callerIdData } = trpc.webphone.getCallerIds.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
  const { data: sessionHistory, refetch: refetchHistory } = trpc.webphone.getSessionHistory.useQuery({ limit: 20 });
  const getTokenQuery = trpc.webphone.getToken.useQuery(
    { preferredCarrier: "auto" },
    { enabled: false }
  );
  const logSessionMutation = trpc.webphone.logSession.useMutation();
  const endSessionMutation = trpc.webphone.endSession.useMutation();
  const setCarrierStatusMutation = trpc.webphone.setCarrierStatus.useMutation({
    onSuccess: () => refetchCarrierStatus(),
  });
  const blindTransferMutation = trpc.webphone.blindTransfer.useMutation();
  const warmTransferMutation = trpc.webphone.warmTransfer.useMutation();
  const transcribeRecordingMutation = trpc.webphone.transcribeRecording.useMutation();
  const { data: voicemails, refetch: refetchVoicemails } = trpc.webphone.getVoicemails.useQuery(
    { limit: 20 },
    { enabled: viewMode === "voicemails" }
  );
  const { data: transcriptResults } = trpc.webphone.searchTranscriptions.useQuery(
    { query: searchQuery, limit: 20 },
    { enabled: viewMode === "transcripts" && searchQuery.length >= 2 }
  );

  // Set default caller ID when data loads
  useEffect(() => {
    if (callerIdData?.defaultCallerId && !selectedCallerId) {
      setSelectedCallerId(callerIdData.defaultCallerId);
    }
  }, [callerIdData, selectedCallerId]);

  // Sync prefill number
  useEffect(() => {
    if (prefillNumber) setDialValue(prefillNumber);
  }, [prefillNumber]);

  // Timer
  useEffect(() => {
    if (callState === "in_call") {
      timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      if (callState === "idle") setElapsed(0);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [callState]);

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // ─── Dial pad press ──────────────────────────────────────────────────────────

  const handleKey = useCallback((key: string) => {
    playDTMF(key);
    if (callState === "in_call" && twilioCallRef.current) {
      try {
        (twilioCallRef.current as { sendDigits: (d: string) => void }).sendDigits(key);
      } catch { /* ignore */ }
    } else {
      setDialValue(v => v + key);
    }
  }, [callState]);

  const handleBackspace = () => setDialValue(v => v.slice(0, -1));

  // ─── E.164 normalization ─────────────────────────────────────────────────────
  const normalizeToE164 = (raw: string): string => {
    const stripped = raw.trim().replace(/[\s\-().]/g, "");
    if (stripped.startsWith("+")) return stripped;
    if (stripped.startsWith("00")) return "+" + stripped.slice(2);
    if (stripped.startsWith("0") && stripped.length === 10) return "+27" + stripped.slice(1);
    return stripped;
  };

  // ─── Initiate call ───────────────────────────────────────────────────────────

  const handleCall = async () => {
    if (!dialValue.trim()) {
      toast.error("Enter a number", { description: "Please enter a phone number to dial." });
      return;
    }
    if (callState !== "idle") return;

    setCallState("connecting");

    try {
      const tokenData = await getTokenQuery.refetch();
      if (!tokenData.data) throw new Error("Could not obtain carrier credentials");

      const data = tokenData.data;

      if (data.failoverUsed) {
        toast("Carrier failover active", { description: "Primary carrier unavailable — using backup carrier." });
      }

      const normalizedNumber = normalizeToE164(dialValue);

      if (data.carrier === "twilio") {
        await initTwilioCall(data as { token: string; carrier: "twilio" }, normalizedNumber);
      } else {
        await initTelnyxCall(data as { sipUser: string; sipPassword: string; sipDomain: string; carrier: "telnyx" }, normalizedNumber);
      }

      setActiveCarrier(data.carrier);

      const logResult = await logSessionMutation.mutateAsync({
        carrier: data.carrier,
        direction: "outbound",
        remoteNumber: normalizedNumber,
        conferenceId,
      });
      setSessionId(logResult.id);
      onCallStart?.(normalizedNumber, data.carrier);

    } catch (err: unknown) {
      setCallState("idle");
      const msg = friendlyError(err);
      toast.error("Call failed", { description: msg });
    }
  };

  // ─── Twilio call init ────────────────────────────────────────────────────────

  const initTwilioCall = async (data: { token: string }, number: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const device = new TwilioDevice(data.token, { logLevel: 1, codecPreferences: ["opus", "pcmu"] as any });
    twilioDeviceRef.current = device;

    device.on("error", (err: unknown) => {
      console.error("[Webphone/Twilio] Device error:", err);
      setCallState("idle");
      const errMsg = friendlyError(err);
      toast.error("Call error", { description: errMsg });
    });

    // Register for incoming calls
    device.on("incoming", (call: TwilioCall) => {
      const from = call.parameters?.From || "Unknown";
      setIncomingFrom(from);
      setCallState("incoming");
      twilioCallRef.current = call;
      ringTone.start();

      call.on("cancel", () => {
        ringTone.stop();
        setCallState("idle");
        setIncomingFrom("");
        toast("Missed call", { description: `From ${from}` });
      });

      call.on("disconnect", () => handleCallEnded("completed"));
    });

    // Must register the device before placing a call
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(
        () => reject(new Error("Device registration timed out — check TwiML App SID and API credentials")),
        12000
      );
      device.on("registered", () => {
        clearTimeout(timeout);
        resolve();
      });
      device.on("registrationFailed", (err: unknown) => {
        clearTimeout(timeout);
        const msg = friendlyError(err);
        reject(new Error(msg));
      });
      device.register();
    });

    // Place outbound call with selected caller ID
    const connectParams: Record<string, string> = { To: number };
    if (selectedCallerId) {
      connectParams.CallerId = selectedCallerId;
    }
    const call: TwilioCall = await device.connect({ params: connectParams });
    twilioCallRef.current = call;

    call.on("ringing", () => setCallState("ringing"));
    call.on("accept", () => setCallState("in_call"));
    call.on("disconnect", () => handleCallEnded("completed"));
    call.on("cancel", () => handleCallEnded("no_answer"));
    call.on("reject", () => handleCallEnded("no_answer"));

    setCallState("ringing");
  };

  // ─── Accept incoming call ────────────────────────────────────────────────────

  const handleAcceptIncoming = () => {
    ringTone.stop();
    const call = twilioCallRef.current as { accept?: () => void } | null;
    call?.accept?.();
    setCallState("in_call");

    // Log inbound session
    logSessionMutation.mutateAsync({
      carrier: "twilio",
      direction: "inbound",
      remoteNumber: incomingFrom,
      conferenceId,
    }).then(result => setSessionId(result.id));
  };

  const handleRejectIncoming = () => {
    ringTone.stop();
    const call = twilioCallRef.current as { reject?: () => void } | null;
    call?.reject?.();
    setCallState("idle");
    setIncomingFrom("");
  };

  // ─── Telnyx call init ────────────────────────────────────────────────────────

  const initTelnyxCall = async (data: { sipUser: string; sipPassword: string; sipDomain: string }, number: string) => {
    if (!(window as unknown as Record<string, unknown>).TelnyxRTC) {
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "https://unpkg.com/@telnyx/webrtc@2.21.6/lib/bundle.js";
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Failed to load Telnyx SDK"));
        document.head.appendChild(script);
      });
    }

    const TelnyxRTC = (window as unknown as Record<string, unknown>).TelnyxRTC as {
      new(opts: object): {
        connect: () => void;
        newCall: (opts: object) => unknown;
        on: (event: string, cb: (...args: unknown[]) => void) => void;
        disconnect: () => void;
      };
    };

    const client = new TelnyxRTC({
      login: data.sipUser,
      password: data.sipPassword,
    });

    client.on("telnyx.ready", () => {
      const call = client.newCall({ destinationNumber: number, callerNumber: selectedCallerId || "+27000000000" });
      twilioCallRef.current = call;
      setCallState("ringing");
    });

    client.on("telnyx.notification", (notification: unknown) => {
      const n = notification as { call?: { state?: string } };
      if (n?.call?.state === "active") setCallState("in_call");
      if (n?.call?.state === "hangup") handleCallEnded("completed");
    });

    client.on("telnyx.error", () => {
      setCallState("idle");
      toast.error("Telnyx error", { description: "WebRTC connection failed." });
    });

    twilioDeviceRef.current = client;
    client.connect();
    setCallState("connecting");
  };

  // ─── End call ────────────────────────────────────────────────────────────────

  const handleHangUp = () => {
    setCallState("ending");
    try {
      const call = twilioCallRef.current as { disconnect?: () => void } | null;
      call?.disconnect?.();
    } catch { /* ignore */ }
    handleCallEnded("completed");
  };

  const handleCallEnded = useCallback(async (status: "completed" | "failed" | "no_answer") => {
    const duration = elapsed;
    setCallState("idle");
    setMuted(false);
    setOnHold(false);
    setIncomingFrom("");
    ringTone.stop();

    // Destroy device
    try {
      const device = twilioDeviceRef.current as { destroy?: () => void; disconnect?: () => void } | null;
      device?.destroy?.();
      device?.disconnect?.();
    } catch { /* ignore */ }
    twilioDeviceRef.current = null;
    twilioCallRef.current = null;

    // Update session
    if (sessionId) {
      await endSessionMutation.mutateAsync({ sessionId, status, durationSecs: duration });
      setSessionId(null);
    }

    refetchHistory();
    onCallEnd?.(duration);
  }, [elapsed, sessionId, endSessionMutation, refetchHistory, onCallEnd, ringTone]);

  // ─── Mute / Hold ─────────────────────────────────────────────────────────────

  const toggleMute = () => {
    try {
      const call = twilioCallRef.current as { mute?: (m: boolean) => void } | null;
      call?.mute?.(!muted);
    } catch { /* ignore */ }
    setMuted(m => !m);
  };

  const toggleHold = () => {
    setOnHold(h => !h);
    toast(onHold ? "Resumed" : "On Hold", { description: onHold ? "Call resumed." : "Caller placed on hold." });
  };

  // ─── Transfer handlers ──────────────────────────────────────────────────────

  const handleTransfer = async () => {
    if (!transferTarget.trim()) {
      toast.error("Enter transfer target");
      return;
    }
    const call = twilioCallRef.current as { parameters?: { CallSid?: string } } | null;
    const callSid = call?.parameters?.CallSid;
    if (!callSid) {
      toast.error("No active call to transfer");
      return;
    }

    const target = normalizeToE164(transferTarget);

    if (transferType === "blind") {
      const result = await blindTransferMutation.mutateAsync({
        callSid,
        transferTo: target,
        sessionId: sessionId ?? undefined,
      });
      if (result.success) {
        toast.success("Call transferred", { description: result.message });
        setShowTransferInput(false);
        setTransferTarget("");
      } else {
        toast.error("Transfer failed", { description: result.error });
      }
    } else {
      const result = await warmTransferMutation.mutateAsync({
        callSid,
        transferTo: target,
        sessionId: sessionId ?? undefined,
      });
      if (result.success) {
        toast.success("Warm transfer initiated", { description: result.message });
        setShowTransferInput(false);
        setTransferTarget("");
      } else {
        toast.error("Transfer failed", { description: result.error });
      }
    }
  };

  const handleTranscribe = async (sid: number) => {
    const result = await transcribeRecordingMutation.mutateAsync({ sessionId: sid });
    if (result.success) {
      toast.success("Transcription complete", { description: `Language: ${result.language}` });
      refetchHistory();
      refetchVoicemails();
    } else {
      toast.error("Transcription failed", { description: result.error });
    }
  };

  // ─── Carrier status helpers ───────────────────────────────────────────────────

  const twilioHealth = carrierStatus?.find(c => c.carrier === "twilio");
  const telnyxHealth = carrierStatus?.find(c => c.carrier === "telnyx");

  // ─── Render ───────────────────────────────────────────────────────────────────

  const dialPadKeys = [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
    ["*", "0", "#"],
  ];

  const callStateLabel: Record<CallState, string> = {
    idle: "Ready",
    connecting: "Connecting\u2026",
    ringing: "Ringing\u2026",
    in_call: formatDuration(elapsed),
    ending: "Ending\u2026",
    incoming: "Incoming\u2026",
  };

  const callStateColour: Record<CallState, string> = {
    idle: "text-muted-foreground",
    connecting: "text-amber-400",
    ringing: "text-amber-400 animate-pulse",
    in_call: "text-emerald-400",
    ending: "text-red-400",
    incoming: "text-blue-400 animate-pulse",
  };

  return (
    <div className={cn(
      "bg-[#0f1117] border border-[#2a2d3a] rounded-xl shadow-2xl flex flex-col overflow-hidden transition-all duration-200",
      minimised ? "w-64" : "w-80"
    )}>
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#2a2d3a] bg-[#13161f]">
        <div className="flex items-center gap-2">
          <PhoneCall className="w-4 h-4 text-primary" />
          <span className="text-xs font-semibold text-foreground tracking-wide">Webphone</span>
          <span className={cn("text-[10px] font-mono", callStateColour[callState])}>
            {callStateLabel[callState]}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {!minimised && (
            <>
              <button
                onClick={() => setViewMode(v => v === "dialer" ? "history" : "dialer")}
                className={cn("text-muted-foreground hover:text-foreground transition-colors p-0.5 rounded",
                  viewMode === "history" && "text-primary")}
                title="Call History"
              >
                <History className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode(v => v === "voicemails" ? "dialer" : "voicemails")}
                className={cn("text-muted-foreground hover:text-foreground transition-colors p-0.5 rounded",
                  viewMode === "voicemails" && "text-primary")}
                title="Voicemails"
              >
                <Voicemail className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode(v => v === "transcripts" ? "dialer" : "transcripts")}
                className={cn("text-muted-foreground hover:text-foreground transition-colors p-0.5 rounded",
                  viewMode === "transcripts" && "text-primary")}
                title="Transcripts"
              >
                <FileText className="w-3.5 h-3.5" />
              </button>
            </>
          )}
          <button onClick={() => setMinimised(m => !m)} className="text-muted-foreground hover:text-foreground transition-colors">
            {minimised ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {!minimised && (
        <>
          {/* ── Incoming call banner ── */}
          {callState === "incoming" && (
            <div className="px-3 py-3 bg-blue-500/10 border-b border-blue-500/20">
              <div className="flex items-center gap-2 mb-2">
                <PhoneIncoming className="w-4 h-4 text-blue-400 animate-pulse" />
                <div>
                  <p className="text-xs font-semibold text-blue-300">Incoming Call</p>
                  <p className="text-[11px] font-mono text-blue-200">{incomingFrom || "Unknown"}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleAcceptIncoming}
                  size="sm"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white h-8 text-xs"
                >
                  <Phone className="w-3 h-3 mr-1" /> Accept
                </Button>
                <Button
                  onClick={handleRejectIncoming}
                  size="sm"
                  className="flex-1 bg-red-600 hover:bg-red-500 text-white h-8 text-xs"
                >
                  <PhoneOff className="w-3 h-3 mr-1" /> Reject
                </Button>
              </div>
            </div>
          )}

          {/* ── Twilio Trial warning banner ── */}
          {accountStatus?.isTrial && twilioHealth?.status !== "down" && (
            <div className="flex items-start gap-2 px-3 py-2 bg-amber-500/10 border-b border-amber-500/20">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
              <div className="text-[10px] text-amber-300 leading-relaxed">
                <span className="font-semibold">Twilio Trial Account</span> — outbound calls limited to verified numbers only.{" "}
                <a
                  href="https://console.twilio.com/us1/billing/manage-billing/billing-overview"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline text-amber-400 hover:text-amber-300"
                >
                  Upgrade to unlock full PSTN access
                </a>
              </div>
            </div>
          )}

          {/* ── Carrier status bar ── */}
          <div className="flex items-center justify-between px-3 py-1.5 bg-[#0c0e14] border-b border-[#2a2d3a]">
            <CarrierDot
              label="Twilio"
              status={twilioHealth?.status ?? "healthy"}
              active={activeCarrier === "twilio" && callState !== "idle"}
            />
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Signal className="w-3 h-3" />
              <span>Dual-Carrier</span>
            </div>
            <CarrierDot
              label="Telnyx"
              status={telnyxHealth?.status ?? "healthy"}
              active={activeCarrier === "telnyx" && callState !== "idle"}
            />
          </div>

          {viewMode === "voicemails" ? (
            /* ── Voicemails View ── */
            <div className="flex flex-col max-h-[400px]">
              <div className="px-3 py-2 border-b border-[#2a2d3a] flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Voicemail className="w-3.5 h-3.5 text-violet-400" />
                  <p className="text-xs font-semibold text-foreground">Voicemails</p>
                </div>
                <button onClick={() => setViewMode("dialer")} className="text-[10px] text-primary hover:text-primary/80">Back</button>
              </div>
              <div className="overflow-y-auto px-3 py-2 space-y-2">
                {(!voicemails || voicemails.length === 0) ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Voicemail className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-xs">No voicemails yet</p>
                  </div>
                ) : (
                  voicemails.map((vm: any) => (
                    <div key={vm.id} className="bg-[#1a1d27] rounded-lg p-2.5">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-mono text-foreground">{vm.remoteNumber ?? "Unknown"}</span>
                        <span className="text-[9px] text-muted-foreground">
                          {vm.startedAt ? new Date(vm.startedAt).toLocaleString() : ""}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] text-muted-foreground">{vm.voicemailDuration ?? 0}s</span>
                        {vm.voicemailUrl && <RecordingPlayButton sessionId={vm.id} />}
                        <button
                          onClick={() => handleTranscribe(vm.id)}
                          disabled={vm.transcriptionStatus === "completed" || transcribeRecordingMutation.isPending}
                          className={cn("text-[10px] px-1.5 py-0.5 rounded transition-colors",
                            vm.transcriptionStatus === "completed"
                              ? "text-emerald-400 bg-emerald-500/10"
                              : "text-violet-400 hover:bg-violet-500/10"
                          )}
                        >
                          {transcribeRecordingMutation.isPending ? (
                            <Loader2 className="w-3 h-3 animate-spin inline" />
                          ) : vm.transcriptionStatus === "completed" ? (
                            <><CheckCircle className="w-3 h-3 inline mr-0.5" />Done</>
                          ) : (
                            <><FileText className="w-3 h-3 inline mr-0.5" />Transcribe</>
                          )}
                        </button>
                      </div>
                      {vm.transcription && (
                        <p className="text-[10px] text-muted-foreground leading-relaxed bg-[#0c0e14] rounded p-2 mt-1">
                          {vm.transcription}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : viewMode === "transcripts" ? (
            /* ── Transcripts Search View ── */
            <div className="flex flex-col max-h-[400px]">
              <div className="px-3 py-2 border-b border-[#2a2d3a] flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-blue-400" />
                  <p className="text-xs font-semibold text-foreground">Transcripts</p>
                </div>
                <button onClick={() => setViewMode("dialer")} className="text-[10px] text-primary hover:text-primary/80">Back</button>
              </div>
              <div className="px-3 pt-2">
                <div className="flex items-center gap-1.5 bg-[#0c0e14] border border-[#2a2d3a] rounded-lg px-2 py-1.5">
                  <Search className="w-3 h-3 text-muted-foreground shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search transcriptions..."
                    className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground/50 outline-none"
                  />
                </div>
              </div>
              <div className="overflow-y-auto px-3 py-2 space-y-2">
                {searchQuery.length < 2 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Search className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-xs">Type at least 2 characters to search</p>
                  </div>
                ) : !transcriptResults || transcriptResults.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-xs">No transcripts found for "{searchQuery}"</p>
                  </div>
                ) : (
                  transcriptResults.map((t: any) => (
                    <div key={t.id} className="bg-[#1a1d27] rounded-lg p-2.5">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-mono text-foreground">{t.remoteNumber ?? "Unknown"}</span>
                        <span className="text-[9px] text-muted-foreground">
                          {t.startedAt ? new Date(t.startedAt).toLocaleString() : ""}
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground leading-relaxed bg-[#0c0e14] rounded p-2">
                        {t.transcription}
                      </p>
                      {t.remoteNumber && (
                        <button
                          onClick={() => { setDialValue(t.remoteNumber); setViewMode("dialer"); }}
                          className="text-[10px] text-primary hover:text-primary/80 mt-1 flex items-center gap-0.5"
                        >
                          <Phone className="w-3 h-3" /> Call back
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : viewMode === "dialer" ? (
            <>
              {/* ── Caller ID selector ── */}
              {callerIdData && callerIdData.callerIds.length > 0 && callState === "idle" && (
                <div className="px-3 pt-2">
                  <label className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-1 block">
                    Caller ID
                  </label>
                  <select
                    value={selectedCallerId}
                    onChange={e => setSelectedCallerId(e.target.value)}
                    className="w-full bg-[#0c0e14] border border-[#2a2d3a] rounded-lg px-2 py-1.5 text-xs font-mono text-foreground outline-none focus:border-primary/40"
                  >
                    {callerIdData.callerIds.map(c => (
                      <option key={c.number} value={c.number}>
                        {c.number} {c.label !== c.number ? `(${c.label})` : ""} [{c.type}]
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* ── Display ── */}
              <div className="px-3 pt-2 pb-1">
                <div className="flex items-center gap-1 bg-[#0c0e14] border border-[#2a2d3a] rounded-lg px-3 py-2">
                  <input
                    type="tel"
                    value={dialValue}
                    onChange={e => setDialValue(e.target.value)}
                    placeholder="+27 XX XXX XXXX"
                    disabled={callState !== "idle"}
                    className="flex-1 bg-transparent text-sm font-mono text-foreground placeholder:text-muted-foreground/50 outline-none"
                  />
                  {dialValue && callState === "idle" && (
                    <button onClick={handleBackspace} className="text-muted-foreground hover:text-foreground">
                      <Hash className="w-3.5 h-3.5 rotate-45" />
                    </button>
                  )}
                </div>
              </div>

              {/* ── Dial pad ── */}
              <div className="px-3 py-2 grid grid-cols-3 gap-1.5">
                {dialPadKeys.flat().map(key => (
                  <button
                    key={key}
                    onClick={() => handleKey(key)}
                    className="h-10 rounded-lg bg-[#1a1d27] hover:bg-[#22263a] active:bg-[#2a2d3a] text-foreground font-mono text-sm font-semibold transition-colors border border-[#2a2d3a] hover:border-primary/30"
                  >
                    {key}
                  </button>
                ))}
              </div>

              {/* ── Call controls ── */}
              <div className="px-3 pb-3 flex items-center gap-2">
                {callState === "idle" ? (
                  <Button
                    onClick={handleCall}
                    disabled={!dialValue.trim()}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white h-10"
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    Call
                  </Button>
                ) : callState === "incoming" ? null : (
                  <>
                    <Button
                      onClick={toggleMute}
                      variant="outline"
                      size="icon"
                      className={cn("h-10 w-10 border-[#2a2d3a]", muted && "bg-amber-500/20 border-amber-500/40 text-amber-400")}
                      disabled={callState !== "in_call"}
                    >
                      {muted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    </Button>
                    <Button
                      onClick={toggleHold}
                      variant="outline"
                      size="icon"
                      className={cn("h-10 w-10 border-[#2a2d3a]", onHold && "bg-blue-500/20 border-blue-500/40 text-blue-400")}
                      disabled={callState !== "in_call"}
                    >
                      <Clock className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={() => setShowTransferInput(t => !t)}
                      variant="outline"
                      size="icon"
                      className={cn("h-10 w-10 border-[#2a2d3a]", showTransferInput && "bg-violet-500/20 border-violet-500/40 text-violet-400")}
                      disabled={callState !== "in_call"}
                      title="Transfer call"
                    >
                      <ArrowRightLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={handleHangUp}
                      className="flex-1 bg-red-600 hover:bg-red-500 text-white h-10"
                    >
                      <PhoneOff className="w-4 h-4 mr-2" />
                      Hang Up
                    </Button>
                  </>
                )}
              </div>

              {/* ── Transfer input panel ── */}
              {showTransferInput && callState === "in_call" && (
                <div className="px-3 pb-2 border-t border-[#2a2d3a] pt-2">
                  <div className="flex items-center gap-2 mb-2">
                    <ArrowRightLeft className="w-3.5 h-3.5 text-violet-400" />
                    <span className="text-[10px] text-violet-300 font-semibold uppercase tracking-wider">Transfer Call</span>
                  </div>
                  <div className="flex gap-1 mb-2">
                    <button
                      onClick={() => setTransferType("blind")}
                      className={cn("flex-1 text-[10px] py-1 rounded border transition-colors",
                        transferType === "blind"
                          ? "bg-violet-500/20 border-violet-500/40 text-violet-300"
                          : "border-[#2a2d3a] text-muted-foreground hover:text-foreground"
                      )}
                    >
                      Blind
                    </button>
                    <button
                      onClick={() => setTransferType("warm")}
                      className={cn("flex-1 text-[10px] py-1 rounded border transition-colors",
                        transferType === "warm"
                          ? "bg-violet-500/20 border-violet-500/40 text-violet-300"
                          : "border-[#2a2d3a] text-muted-foreground hover:text-foreground"
                      )}
                    >
                      Warm
                    </button>
                  </div>
                  <div className="flex gap-1.5">
                    <input
                      type="tel"
                      value={transferTarget}
                      onChange={e => setTransferTarget(e.target.value)}
                      placeholder="+27... or operator-2"
                      className="flex-1 bg-[#0c0e14] border border-[#2a2d3a] rounded-lg px-2 py-1.5 text-xs font-mono text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-violet-500/40"
                    />
                    <Button
                      onClick={handleTransfer}
                      size="sm"
                      className="bg-violet-600 hover:bg-violet-500 text-white h-8 text-xs px-3"
                      disabled={!transferTarget.trim() || blindTransferMutation.isPending || warmTransferMutation.isPending}
                    >
                      {(blindTransferMutation.isPending || warmTransferMutation.isPending)
                        ? <Loader2 className="w-3 h-3 animate-spin" />
                        : "Go"
                      }
                    </Button>
                  </div>
                  <p className="text-[9px] text-muted-foreground mt-1">
                    {transferType === "blind" ? "Caller connects directly to the target." : "Conference: you can announce before dropping off."}
                  </p>
                </div>
              )}

              {/* ── Carrier override controls ── */}
              <div className="px-3 pb-2 flex items-center gap-1.5 border-t border-[#2a2d3a] pt-2">
                <span className="text-[10px] text-muted-foreground flex-1">Carrier override:</span>
                {(["twilio", "telnyx"] as Carrier[]).map(c => {
                  const health = c === "twilio" ? twilioHealth : telnyxHealth;
                  const isDown = health?.status === "down";
                  return (
                    <button
                      key={c}
                      onClick={() => setCarrierStatusMutation.mutate({ carrier: c, status: isDown ? "healthy" : "down" })}
                      title={isDown ? `Restore ${c}` : `Mark ${c} down`}
                      className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {isDown
                        ? <><RotateCcw className="w-3 h-3 text-emerald-400" /><span className="text-emerald-400">{c}</span></>
                        : <><XCircle className="w-3 h-3" /><span>{c}</span></>
                      }
                    </button>
                  );
                })}
              </div>

              {/* ── Quick recent calls (last 3) ── */}
              {sessionHistory && sessionHistory.length > 0 && (
                <div className="border-t border-[#2a2d3a] px-3 py-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Recent</p>
                    <button
                      onClick={() => setViewMode("history")}
                      className="text-[10px] text-primary hover:text-primary/80 flex items-center gap-0.5"
                    >
                      View all <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="space-y-1">
                    {sessionHistory.slice(0, 3).map(s => (
                      <div
                        key={s.id}
                        className="flex items-center justify-between text-[11px] cursor-pointer hover:text-foreground text-muted-foreground"
                        onClick={() => callState === "idle" && setDialValue(s.remoteNumber ?? "")}
                      >
                        <div className="flex items-center gap-1.5">
                          {s.direction === "inbound"
                            ? <PhoneIncoming className="w-3 h-3 text-blue-400 shrink-0" />
                            : s.status === "completed"
                              ? <PhoneForwarded className="w-3 h-3 text-emerald-400 shrink-0" />
                              : <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
                          }
                          <span className="font-mono truncate max-w-[120px]">{s.remoteNumber ?? "Unknown"}</span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 border-[#2a2d3a]">
                            {s.carrier}
                          </Badge>
                          {s.durationSecs != null && (
                            <span className="font-mono text-[10px]">{formatDuration(s.durationSecs)}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            /* ── Full Call History View ── */
            <div className="flex flex-col max-h-[400px]">
              <div className="px-3 py-2 border-b border-[#2a2d3a] flex items-center justify-between">
                <p className="text-xs font-semibold text-foreground">Call History</p>
                <button onClick={() => setViewMode("dialer")} className="text-[10px] text-primary hover:text-primary/80">Back</button>
              </div>
              <div className="overflow-y-auto px-3 py-2 space-y-1.5">
                {(!sessionHistory || sessionHistory.length === 0) ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Volume2 className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-xs">No call history yet</p>
                  </div>
                ) : (
                  sessionHistory.map(s => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-[#1a1d27] cursor-pointer transition-colors"
                      onClick={() => {
                        if (callState === "idle" && s.remoteNumber) {
                          setDialValue(s.remoteNumber);
                          setViewMode("dialer");
                        }
                      }}
                    >
                      <div className="flex items-center gap-2">
                        {s.direction === "inbound"
                          ? <PhoneIncoming className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                          : s.status === "completed"
                            ? <PhoneForwarded className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            : s.status === "failed"
                              ? <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                              : <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        }
                        <div>
                          <p className="text-[11px] font-mono text-foreground">{s.remoteNumber ?? "Unknown"}</p>
                          <p className="text-[9px] text-muted-foreground">
                            {s.direction === "inbound" ? "Inbound" : "Outbound"} · {s.carrier}
                            {s.startedAt ? ` · ${new Date(s.startedAt).toLocaleTimeString()}` : ""}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Recording playback button */}
                        {s.status === "completed" && (
                          <RecordingPlayButton sessionId={s.id} />
                        )}
                        <div className="text-right">
                          <Badge
                            variant="outline"
                            className={cn("text-[9px] px-1 py-0 h-4",
                              s.status === "completed" ? "border-emerald-500/30 text-emerald-400" :
                              s.status === "failed" ? "border-red-500/30 text-red-400" :
                              "border-amber-500/30 text-amber-400"
                            )}
                          >
                            {s.status}
                          </Badge>
                          {s.durationSecs != null && (
                            <p className="text-[10px] font-mono text-muted-foreground mt-0.5">{formatDuration(s.durationSecs)}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Recording Playback Button ─────────────────────────────────────────────────

function RecordingPlayButton({ sessionId }: { sessionId: number }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const utils = trpc.useUtils();

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation(); // prevent row click (redial)

    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      return;
    }

    // Fetch recording URL
    try {
      const result = await utils.webphone.getRecording.fetch({ sessionId });
      if (!result?.recordingUrl) {
        toast.info("No recording available for this call.");
        return;
      }

      const audio = new Audio(result.recordingUrl);
      audioRef.current = audio;
      audio.onended = () => setIsPlaying(false);
      audio.onerror = () => {
        toast.error("Failed to play recording.");
        setIsPlaying(false);
      };
      audio.play();
      setIsPlaying(true);
    } catch {
      toast.error("Failed to load recording.");
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  return (
    <button
      onClick={handleClick}
      className={cn(
        "p-1 rounded transition-colors",
        isPlaying
          ? "text-primary bg-primary/10"
          : "text-muted-foreground hover:text-foreground hover:bg-[#1a1d27]"
      )}
      title={isPlaying ? "Stop playback" : "Play recording"}
    >
      {isPlaying ? <Square className="w-3 h-3" /> : <Play className="w-3 h-3" />}
    </button>
  );
}
