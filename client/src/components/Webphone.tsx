/**
 * Webphone — Browser-based softphone component for the Chorus.AI Operator Console.
 *
 * Features:
 *   - Dial pad (0–9, *, #) with DTMF tone support via Web Audio API
 *   - Call controls: Call, Hang Up, Mute, Hold
 *   - Dual-carrier indicator: Twilio (primary) + Telnyx (fallback)
 *   - Automatic failover: if primary token fails, silently switches to fallback
 *   - Call duration timer
 *   - Recent calls list (last 10 sessions)
 *   - Minimise/expand toggle for use alongside OCC panels
 *   - Pre-fill dial pad from external prop (e.g. clicking a participant phone number)
 *
 * Integration:
 *   - Twilio Voice JS SDK loaded dynamically from CDN
 *   - Telnyx WebRTC SDK loaded dynamically from CDN
 *   - Both SDKs are loaded only when needed to keep initial bundle small
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { Phone, PhoneOff, Mic, MicOff, PhoneCall, ChevronDown, ChevronUp, Clock, Signal, AlertTriangle, CheckCircle, XCircle, RotateCcw, Hash } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type CallState = "idle" | "connecting" | "ringing" | "in_call" | "ending";
type Carrier = "twilio" | "telnyx";

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
    // AudioContext not available (e.g. SSR) — silently ignore
  }
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
  const [dialValue, setDialValue] = useState(prefillNumber);
  const [callState, setCallState] = useState<CallState>("idle");
  const [muted, setMuted] = useState(false);
  const [onHold, setOnHold] = useState(false);
  const [activeCarrier, setActiveCarrier] = useState<Carrier>("twilio");
  const [sessionId, setSessionId] = useState<number | null>(null);

  // Call timer
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Twilio device ref
  const twilioDeviceRef = useRef<unknown>(null);
  const twilioCallRef = useRef<unknown>(null);

  // tRPC
  const { data: accountStatus } = trpc.webphone.getAccountStatus.useQuery(undefined, {
    staleTime: 5 * 60 * 1000, // cache for 5 minutes — account type rarely changes
    retry: false,
  });
  const { data: carrierStatus, refetch: refetchCarrierStatus } = trpc.webphone.getCarrierStatus.useQuery(undefined, {
    refetchInterval: 30_000, // poll every 30s
  });
  const { data: sessionHistory, refetch: refetchHistory } = trpc.webphone.getSessionHistory.useQuery({ limit: 10 });
  const getTokenQuery = trpc.webphone.getToken.useQuery(
    { preferredCarrier: "auto" },
    { enabled: false } // only fetch on demand
  );
  const logSessionMutation = trpc.webphone.logSession.useMutation();
  const endSessionMutation = trpc.webphone.endSession.useMutation();
  const setCarrierStatusMutation = trpc.webphone.setCarrierStatus.useMutation({
    onSuccess: () => refetchCarrierStatus(),
  });

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
      // Send DTMF to active call
      try {
        (twilioCallRef.current as { sendDigits: (d: string) => void }).sendDigits(key);
      } catch { /* ignore */ }
    } else {
      setDialValue(v => v + key);
    }
  }, [callState]);

  const handleBackspace = () => setDialValue(v => v.slice(0, -1));

  // ─── Initiate call ───────────────────────────────────────────────────────────

  const handleCall = async () => {
    if (!dialValue.trim()) {
      toast.error("Enter a number", { description: "Please enter a phone number to dial." });
      return;
    }
    if (callState !== "idle") return;

    setCallState("connecting");

    try {
      // Fetch token from server (auto-selects carrier with failover)
      const tokenData = await getTokenQuery.refetch();
      if (!tokenData.data) throw new Error("Could not obtain carrier credentials");

      const data = tokenData.data;

      if (data.failoverUsed) {
        toast("Carrier failover active", { description: "Primary carrier unavailable — using backup carrier." });
      }

      if (data.carrier === "twilio") {
        await initTwilioCall(data as { token: string; carrier: "twilio" }, dialValue.trim());
      } else {
        await initTelnyxCall(data as { sipUser: string; sipPassword: string; sipDomain: string; carrier: "telnyx" }, dialValue.trim());
      }

      setActiveCarrier(data.carrier);

      // Log session
      const logResult = await logSessionMutation.mutateAsync({
        carrier: data.carrier,
        direction: "outbound",
        remoteNumber: dialValue.trim(),
        conferenceId,
      });
      setSessionId(logResult.id);
      onCallStart?.(dialValue.trim(), data.carrier);

    } catch (err: unknown) {
      setCallState("idle");
      const msg = err instanceof Error ? err.message : "Call failed";
      toast.error("Call failed", { description: msg });
    }
  };

  // ─── Twilio call init ────────────────────────────────────────────────────────

  const initTwilioCall = async (data: { token: string }, number: string) => {
    // Dynamically load Twilio Voice JS SDK (@twilio/voice-sdk v2.18.0 via unpkg)
    if (!(window as unknown as Record<string, unknown>).Twilio) {
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "https://unpkg.com/@twilio/voice-sdk@2.18.0/dist/twilio.min.js";
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Failed to load Twilio SDK — check network or CSP settings"));
        document.head.appendChild(script);
      });
    }

    const TwilioSDK = (window as unknown as Record<string, { Device: unknown }>).Twilio;
    const Device = TwilioSDK.Device as {
      new(token: string, opts: object): {
        connect: (opts: object) => unknown;
        on: (event: string, cb: (...args: unknown[]) => void) => void;
        destroy: () => void;
      };
    };

    const device = new Device(data.token, { logLevel: 1, codecPreferences: ["opus", "pcmu"] });
    twilioDeviceRef.current = device;

    device.on("error", (err: unknown) => {
      console.error("[Webphone/Twilio] Error:", err);
      setCallState("idle");
      toast.error("Call error", { description: "Twilio reported an error." });
    });

    const call = device.connect({ params: { To: number } });
    twilioCallRef.current = call;

    const callObj = call as {
      on: (event: string, cb: (...args: unknown[]) => void) => void;
    };

    callObj.on("ringing", () => setCallState("ringing"));
    callObj.on("accept", () => setCallState("in_call"));
    callObj.on("disconnect", () => handleCallEnded("completed"));
    callObj.on("cancel", () => handleCallEnded("no_answer"));
    callObj.on("reject", () => handleCallEnded("no_answer"));

    setCallState("ringing");
  };

  // ─── Telnyx call init ────────────────────────────────────────────────────────

  const initTelnyxCall = async (data: { sipUser: string; sipPassword: string; sipDomain: string }, number: string) => {
    // Dynamically load Telnyx WebRTC SDK
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
      const call = client.newCall({ destinationNumber: number, callerNumber: "+27000000000" });
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
  }, [elapsed, sessionId, endSessionMutation, refetchHistory, onCallEnd]);

  // ─── Mute / Hold ─────────────────────────────────────────────────────────────

  const toggleMute = () => {
    try {
      const call = twilioCallRef.current as { mute?: (m: boolean) => void } | null;
      call?.mute?.(!muted);
    } catch { /* ignore */ }
    setMuted(m => !m);
  };

  const toggleHold = () => {
    // Hold is simulated via mute for now; full hold requires TwiML update
    setOnHold(h => !h);
    toast(onHold ? "Resumed" : "On Hold", { description: onHold ? "Call resumed." : "Caller placed on hold." });
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
    connecting: "Connecting…",
    ringing: "Ringing…",
    in_call: formatDuration(elapsed),
    ending: "Ending…",
  };

  const callStateColour: Record<CallState, string> = {
    idle: "text-muted-foreground",
    connecting: "text-amber-400",
    ringing: "text-amber-400 animate-pulse",
    in_call: "text-emerald-400",
    ending: "text-red-400",
  };

  return (
    <div className={cn(
      "bg-[#0f1117] border border-[#2a2d3a] rounded-xl shadow-2xl flex flex-col overflow-hidden transition-all duration-200",
      minimised ? "w-64" : "w-72"
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
        <button onClick={() => setMinimised(m => !m)} className="text-muted-foreground hover:text-foreground transition-colors">
          {minimised ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </button>
      </div>

      {!minimised && (
        <>
          {/* ── Twilio Trial warning banner — only shown when account is actually on Trial ── */}
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

          {/* ── Display ── */}
          <div className="px-3 pt-3 pb-1">
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
            ) : (
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
                  onClick={handleHangUp}
                  className="flex-1 bg-red-600 hover:bg-red-500 text-white h-10"
                >
                  <PhoneOff className="w-4 h-4 mr-2" />
                  Hang Up
                </Button>
              </>
            )}
          </div>

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

          {/* ── Recent calls ── */}
          {sessionHistory && sessionHistory.length > 0 && (
            <div className="border-t border-[#2a2d3a] px-3 py-2 max-h-36 overflow-y-auto">
              <p className="text-[10px] text-muted-foreground mb-1.5 font-semibold uppercase tracking-wider">Recent Calls</p>
              <div className="space-y-1">
                {sessionHistory.slice(0, 5).map(s => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between text-[11px] cursor-pointer hover:text-foreground text-muted-foreground"
                    onClick={() => callState === "idle" && setDialValue(s.remoteNumber ?? "")}
                  >
                    <div className="flex items-center gap-1.5">
                      {s.status === "completed"
                        ? <CheckCircle className="w-3 h-3 text-emerald-400 shrink-0" />
                        : <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
                      }
                      <span className="font-mono truncate max-w-[110px]">{s.remoteNumber ?? "Unknown"}</span>
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
      )}
    </div>
  );
}
