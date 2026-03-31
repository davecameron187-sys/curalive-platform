// @ts-nocheck
/**
 * BroadcastControl — Self-contained Audio/Video Webcast Management Console
 *
 * 3 Broadcast Modes:
 *   1. Audio Webcast — Audio + slides (192 kbps, <100ms latency)
 *   2. Video Webcast — Full video stream (1-5 Mbps, adaptive quality)
 *   3. Video-Only   — For roadshows/demos (adaptive bitrate)
 *
 * Features:
 *   - Start/Stop buttons
 *   - Shareable URLs (copy to clipboard)
 *   - Real-time metrics (viewers, bitrate, latency, duration)
 *   - Configuration toggles (auto-record, allow chat)
 *   - Quality selector (480p, 720p, 1080p for video)
 *   - Status indicators (Ready/Live/Stopped)
 *   - Operator guidance boxes
 *
 * Design: Dark navy/teal (#0f1419, #1D9E75)
 * Layout: Full-screen per mode (not side-by-side)
 * Responsive: Mobile-friendly
 * Update Frequency: Metrics every 2 seconds
 * Animations: Pulse animation when live
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Radio, Mic, Video, Play, Square, Copy,
  Users, Activity, Clock, Gauge, Loader2,
  CheckCircle2, AlertTriangle, Settings,
  ExternalLink, BarChart3, RefreshCw,
  Info, Zap, Globe, Monitor, ChevronDown,
  Eye, Wifi, HardDrive,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

type BroadcastMode = "audio" | "video" | "video_only";
type BroadcastStatus = "ready" | "live" | "stopped" | "error";
type Quality = "480p" | "720p" | "1080p";

interface BroadcastData {
  id: number;
  title: string;
  mode: BroadcastMode;
  status: BroadcastStatus;
  quality: Quality | null;
  bitrate: number | null;
  latency: number | null;
  viewerCount: number | null;
  peakViewers: number | null;
  duration: number | null;
  shareUrl: string | null;
  autoRecord: boolean;
  allowChat: boolean;
  startedAt: Date | string | null;
  stoppedAt: Date | string | null;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const MODE_CONFIG: Record<BroadcastMode, {
  label: string;
  description: string;
  icon: React.ElementType;
  color: string;
  borderColor: string;
  bgColor: string;
  defaultBitrate: number;
  maxLatency: number;
  guidance: string;
}> = {
  audio: {
    label: "Audio Webcast",
    description: "Audio + slides — ideal for earnings calls and investor briefings",
    icon: Mic,
    color: "text-emerald-400",
    borderColor: "border-emerald-500/30",
    bgColor: "bg-emerald-500/10",
    defaultBitrate: 192,
    maxLatency: 100,
    guidance: "Audio webcast streams high-quality audio at 192 kbps with sub-100ms latency. Pair with slide presentation for maximum impact. Recommended for earnings calls, board briefings, and analyst presentations.",
  },
  video: {
    label: "Video Webcast",
    description: "Full video stream — adaptive quality from 480p to 1080p",
    icon: Video,
    color: "text-blue-400",
    borderColor: "border-blue-500/30",
    bgColor: "bg-blue-500/10",
    defaultBitrate: 2500,
    maxLatency: 200,
    guidance: "Video webcast delivers full HD video with adaptive bitrate (1-5 Mbps). Quality adjusts automatically based on viewer bandwidth. Recommended for investor days, product launches, and corporate events.",
  },
  video_only: {
    label: "Video-Only",
    description: "Roadshow/demo mode — adaptive bitrate, no slides",
    icon: Monitor,
    color: "text-violet-400",
    borderColor: "border-violet-500/30",
    bgColor: "bg-violet-500/10",
    defaultBitrate: 3000,
    maxLatency: 150,
    guidance: "Video-only mode optimises for maximum video quality with adaptive bitrate. No slide deck overlay — ideal for roadshows, product demos, and CEO town halls where visual presence is key.",
  },
};

const STATUS_CONFIG: Record<BroadcastStatus, {
  label: string;
  color: string;
  dotClass: string;
  icon: React.ElementType;
}> = {
  ready: {
    label: "Ready",
    color: "text-amber-400 bg-amber-400/10 border-amber-400/20",
    dotClass: "bg-amber-400",
    icon: CheckCircle2,
  },
  live: {
    label: "LIVE",
    color: "text-red-400 bg-red-400/10 border-red-400/20",
    dotClass: "bg-red-400 animate-pulse",
    icon: Radio,
  },
  stopped: {
    label: "Stopped",
    color: "text-slate-400 bg-slate-400/10 border-slate-400/20",
    dotClass: "bg-slate-400",
    icon: Square,
  },
  error: {
    label: "Error",
    color: "text-red-500 bg-red-500/10 border-red-500/20",
    dotClass: "bg-red-500",
    icon: AlertTriangle,
  },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function formatBitrate(kbps: number | null): string {
  if (!kbps) return "—";
  if (kbps >= 1000) return `${(kbps / 1000).toFixed(1)} Mbps`;
  return `${kbps} kbps`;
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function MetricCard({ icon: Icon, label, value, subValue, color = "text-slate-300" }: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  subValue?: string;
  color?: string;
}) {
  return (
    <div className="bg-[#0f1419]/60 border border-white/[0.06] rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 ${color}`} />
        <span className="text-xs text-slate-500 uppercase tracking-wider font-medium">{label}</span>
      </div>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      {subValue && <div className="text-xs text-slate-600 mt-1">{subValue}</div>}
    </div>
  );
}

function CopyableUrl({ url, label }: { url: string; label: string }) {
  const handleCopy = () => {
    navigator.clipboard.writeText(url).then(() => {
      toast.success(`${label} copied to clipboard`);
    });
  };

  return (
    <div className="flex items-center gap-2 bg-[#0f1419]/60 border border-white/[0.06] rounded-lg px-3 py-2">
      <Globe className="w-3.5 h-3.5 text-teal-400 shrink-0" />
      <code className="flex-1 text-xs font-mono text-slate-300 truncate">{url}</code>
      <button
        onClick={handleCopy}
        className="text-slate-500 hover:text-teal-400 transition-colors shrink-0"
        title="Copy to clipboard"
      >
        <Copy className="w-3.5 h-3.5" />
      </button>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-slate-500 hover:text-teal-400 transition-colors shrink-0"
        title="Open in new tab"
      >
        <ExternalLink className="w-3.5 h-3.5" />
      </a>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function BroadcastControl() {
  // ── State ──────────────────────────────────────────────────────────────────
  const [selectedMode, setSelectedMode] = useState<BroadcastMode | null>(null);
  const [activeBroadcastId, setActiveBroadcastId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [quality, setQuality] = useState<Quality>("720p");
  const [autoRecord, setAutoRecord] = useState(true);
  const [allowChat, setAllowChat] = useState(true);
  const [showConfig, setShowConfig] = useState(false);
  const [liveDuration, setLiveDuration] = useState(0);
  const durationRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── tRPC Queries & Mutations ───────────────────────────────────────────────
  const broadcastList = trpc.broadcastControl.list.useQuery(undefined, {
    refetchInterval: 5000,
  });

  const broadcastStatus = trpc.broadcastControl.getStatus.useQuery(
    { broadcastId: activeBroadcastId! },
    {
      enabled: activeBroadcastId != null,
      refetchInterval: 2000, // Every 2 seconds as per spec
    }
  );

  const createBroadcast = trpc.broadcastControl.create.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      setActiveBroadcastId(data.broadcastId);
      broadcastList.refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const startBroadcast = trpc.broadcastControl.start.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      broadcastStatus.refetch();
      broadcastList.refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const stopBroadcast = trpc.broadcastControl.stop.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      if (durationRef.current) clearInterval(durationRef.current);
      broadcastStatus.refetch();
      broadcastList.refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  // ── Live duration timer ────────────────────────────────────────────────────
  const currentBroadcast = broadcastStatus.data;

  useEffect(() => {
    if (currentBroadcast?.status === "live" && currentBroadcast.startedAt) {
      const startTime = new Date(currentBroadcast.startedAt).getTime();
      const tick = () => setLiveDuration(Math.round((Date.now() - startTime) / 1000));
      tick();
      durationRef.current = setInterval(tick, 1000);
      return () => { if (durationRef.current) clearInterval(durationRef.current); };
    } else {
      setLiveDuration(currentBroadcast?.duration ?? 0);
    }
  }, [currentBroadcast?.status, currentBroadcast?.startedAt]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleCreate = useCallback(() => {
    if (!selectedMode || !title.trim()) {
      toast.error("Please enter a broadcast title");
      return;
    }
    createBroadcast.mutate({
      title: title.trim(),
      mode: selectedMode,
      quality,
      autoRecord,
      allowChat,
    });
  }, [selectedMode, title, quality, autoRecord, allowChat]);

  const handleStart = useCallback(() => {
    if (!activeBroadcastId) return;
    startBroadcast.mutate({ broadcastId: activeBroadcastId });
  }, [activeBroadcastId]);

  const handleStop = useCallback(() => {
    if (!activeBroadcastId) return;
    stopBroadcast.mutate({ broadcastId: activeBroadcastId });
  }, [activeBroadcastId]);

  // ── Render: Mode Selection ─────────────────────────────────────────────────
  if (!selectedMode && !activeBroadcastId) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <Radio className="w-5 h-5 text-teal-400" />
              Broadcast Control
            </h2>
            <p className="text-sm text-slate-500 mt-1">Select a broadcast mode to begin</p>
          </div>
        </div>

        {/* Mode Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(Object.entries(MODE_CONFIG) as [BroadcastMode, typeof MODE_CONFIG[BroadcastMode]][]).map(
            ([mode, config]) => {
              const Icon = config.icon;
              return (
                <button
                  key={mode}
                  onClick={() => setSelectedMode(mode)}
                  className={`text-left p-6 rounded-xl border transition-all hover:scale-[1.02] ${config.borderColor} ${config.bgColor} hover:bg-opacity-20`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`p-2 rounded-lg ${config.bgColor}`}>
                      <Icon className={`w-5 h-5 ${config.color}`} />
                    </div>
                    <h3 className={`text-lg font-semibold ${config.color}`}>{config.label}</h3>
                  </div>
                  <p className="text-sm text-slate-400 leading-relaxed">{config.description}</p>
                  <div className="flex items-center gap-4 mt-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Gauge className="w-3 h-3" />
                      {formatBitrate(config.defaultBitrate)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Zap className="w-3 h-3" />
                      {"<"}{config.maxLatency}ms
                    </span>
                  </div>
                </button>
              );
            }
          )}
        </div>

        {/* Recent Broadcasts */}
        {broadcastList.data && broadcastList.data.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Recent Broadcasts</h3>
            <div className="space-y-2">
              {broadcastList.data.slice(0, 5).map((b) => {
                const sc = STATUS_CONFIG[b.status as BroadcastStatus] ?? STATUS_CONFIG.ready;
                const mc = MODE_CONFIG[b.mode as BroadcastMode] ?? MODE_CONFIG.audio;
                return (
                  <button
                    key={b.id}
                    onClick={() => {
                      setActiveBroadcastId(b.id);
                      setSelectedMode(b.mode as BroadcastMode);
                    }}
                    className="w-full text-left flex items-center justify-between p-3 rounded-lg border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <mc.icon className={`w-4 h-4 ${mc.color}`} />
                      <div>
                        <div className="text-sm font-medium text-slate-200">{b.title}</div>
                        <div className="text-xs text-slate-500">{mc.label}</div>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full border flex items-center gap-1 ${sc.color}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${sc.dotClass}`} />
                      {sc.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Render: Active Broadcast Console ───────────────────────────────────────
  const mode = selectedMode ?? "audio";
  const modeConfig = MODE_CONFIG[mode];
  const ModeIcon = modeConfig.icon;
  const status: BroadcastStatus = (currentBroadcast?.status as BroadcastStatus) ?? "ready";
  const statusConfig = STATUS_CONFIG[status];
  const StatusIcon = statusConfig.icon;
  const isLive = status === "live";
  const isReady = status === "ready";
  const isStopped = status === "stopped";

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setSelectedMode(null);
              setActiveBroadcastId(null);
              setTitle("");
              setShowConfig(false);
              if (durationRef.current) clearInterval(durationRef.current);
            }}
            className="text-slate-500 hover:text-slate-300 transition-colors text-sm"
          >
            &larr; Back
          </button>
          <div className={`p-2 rounded-lg ${modeConfig.bgColor}`}>
            <ModeIcon className={`w-5 h-5 ${modeConfig.color}`} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-100">{modeConfig.label}</h2>
            <p className="text-sm text-slate-500">{currentBroadcast?.title ?? "New Broadcast"}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Status Badge */}
          <span className={`text-sm px-3 py-1 rounded-full border flex items-center gap-2 font-semibold ${statusConfig.color}`}>
            <div className={`w-2 h-2 rounded-full ${statusConfig.dotClass}`} />
            {statusConfig.label}
          </span>
        </div>
      </div>

      {/* ── Create Form (if no active broadcast) ────────────────────────────── */}
      {!activeBroadcastId && (
        <div className={`rounded-xl border p-6 space-y-4 ${modeConfig.borderColor} ${modeConfig.bgColor}`}>
          <h3 className="text-sm font-semibold text-slate-200">Create New {modeConfig.label}</h3>

          {/* Title */}
          <div>
            <label className="text-xs text-slate-500 uppercase tracking-wider font-medium block mb-1">Broadcast Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Q4 2026 Earnings Call"
              className="w-full bg-[#0f1419] border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-teal-500/50"
            />
          </div>

          {/* Quality Selector (video modes only) */}
          {mode !== "audio" && (
            <div>
              <label className="text-xs text-slate-500 uppercase tracking-wider font-medium block mb-1">Quality</label>
              <div className="flex gap-2">
                {(["480p", "720p", "1080p"] as Quality[]).map((q) => (
                  <button
                    key={q}
                    onClick={() => setQuality(q)}
                    className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      quality === q
                        ? "bg-teal-500/20 text-teal-400 border border-teal-500/40"
                        : "bg-white/[0.03] text-slate-400 border border-white/10 hover:bg-white/[0.06]"
                    }`}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Config Toggles */}
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            <Settings className="w-3.5 h-3.5" />
            Configuration
            <ChevronDown className={`w-3 h-3 transition-transform ${showConfig ? "rotate-180" : ""}`} />
          </button>

          {showConfig && (
            <div className="space-y-3 pl-5 border-l border-white/10">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoRecord}
                  onChange={(e) => setAutoRecord(e.target.checked)}
                  className="w-4 h-4 rounded border-white/20 bg-[#0f1419] text-teal-500 focus:ring-teal-500/50"
                />
                <span className="text-sm text-slate-300">Auto-record broadcast</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowChat}
                  onChange={(e) => setAllowChat(e.target.checked)}
                  className="w-4 h-4 rounded border-white/20 bg-[#0f1419] text-teal-500 focus:ring-teal-500/50"
                />
                <span className="text-sm text-slate-300">Allow viewer chat</span>
              </label>
            </div>
          )}

          {/* Create Button */}
          <Button
            onClick={handleCreate}
            disabled={createBroadcast.isPending || !title.trim()}
            className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2.5"
          >
            {createBroadcast.isPending ? (
              <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Creating...</>
            ) : (
              <><Radio className="w-4 h-4 mr-2" /> Create Broadcast</>
            )}
          </Button>

          {/* Operator Guidance */}
          <div className="rounded-lg bg-[#0f1419]/60 border border-white/[0.06] p-4">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-teal-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-teal-400 mb-1">Operator Guidance</p>
                <p className="text-xs text-slate-400 leading-relaxed">{modeConfig.guidance}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Live Console (active broadcast) ─────────────────────────────────── */}
      {activeBroadcastId && currentBroadcast && (
        <>
          {/* Control Buttons */}
          <div className="flex items-center gap-3 flex-wrap">
            {isReady && (
              <Button
                onClick={handleStart}
                disabled={startBroadcast.isPending}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-2.5"
              >
                {startBroadcast.isPending ? (
                  <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Starting...</>
                ) : (
                  <><Play className="w-4 h-4 mr-2" /> Go Live</>
                )}
              </Button>
            )}
            {isLive && (
              <Button
                onClick={handleStop}
                disabled={stopBroadcast.isPending}
                className="bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-2.5"
              >
                {stopBroadcast.isPending ? (
                  <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Stopping...</>
                ) : (
                  <><Square className="w-4 h-4 mr-2" /> Stop Broadcast</>
                )}
              </Button>
            )}
            {isStopped && (
              <Button
                onClick={() => {
                  setActiveBroadcastId(null);
                  setSelectedMode(null);
                  setTitle("");
                }}
                className="bg-slate-600 hover:bg-slate-700 text-white font-semibold px-6 py-2.5"
              >
                <Radio className="w-4 h-4 mr-2" /> New Broadcast
              </Button>
            )}
            <button
              onClick={() => broadcastStatus.refetch()}
              className="text-slate-500 hover:text-slate-300 transition-colors p-2"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {/* Live Pulse Banner */}
          {isLive && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4 flex items-center gap-4">
              <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
              <div className="flex-1">
                <p className="text-sm font-bold text-red-400">BROADCAST IS LIVE</p>
                <p className="text-xs text-slate-400">
                  Duration: {formatDuration(liveDuration)} | Viewers: {currentBroadcast.viewerCount ?? 0}
                </p>
              </div>
              <div className="text-2xl font-mono font-bold text-red-400">
                {formatDuration(liveDuration)}
              </div>
            </div>
          )}

          {/* Shareable URL */}
          {currentBroadcast.shareUrl && (
            <div className="space-y-2">
              <label className="text-xs text-slate-500 uppercase tracking-wider font-medium">Shareable URL</label>
              <CopyableUrl url={currentBroadcast.shareUrl} label="Share URL" />
            </div>
          )}

          {/* Real-time Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <MetricCard
              icon={Users}
              label="Viewers"
              value={currentBroadcast.viewerCount ?? 0}
              subValue={`Peak: ${currentBroadcast.peakViewers ?? 0}`}
              color="text-teal-400"
            />
            <MetricCard
              icon={Activity}
              label="Bitrate"
              value={formatBitrate(currentBroadcast.bitrate)}
              subValue={mode === "audio" ? "Target: 192 kbps" : `Quality: ${currentBroadcast.quality ?? quality}`}
              color="text-blue-400"
            />
            <MetricCard
              icon={Zap}
              label="Latency"
              value={currentBroadcast.latency ? `${currentBroadcast.latency}ms` : "—"}
              subValue={`Max: ${modeConfig.maxLatency}ms`}
              color={
                currentBroadcast.latency && currentBroadcast.latency > modeConfig.maxLatency
                  ? "text-red-400"
                  : "text-emerald-400"
              }
            />
            <MetricCard
              icon={Clock}
              label="Duration"
              value={formatDuration(liveDuration)}
              color="text-violet-400"
            />
          </div>

          {/* Configuration Summary */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
            <h3 className="text-xs text-slate-500 uppercase tracking-wider font-medium mb-3">Configuration</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-slate-500 text-xs">Mode</span>
                <p className={`font-medium ${modeConfig.color}`}>{modeConfig.label}</p>
              </div>
              {mode !== "audio" && (
                <div>
                  <span className="text-slate-500 text-xs">Quality</span>
                  <p className="font-medium text-slate-200">{currentBroadcast.quality ?? quality}</p>
                </div>
              )}
              <div>
                <span className="text-slate-500 text-xs">Auto-Record</span>
                <p className="font-medium text-slate-200">{currentBroadcast.autoRecord ? "On" : "Off"}</p>
              </div>
              <div>
                <span className="text-slate-500 text-xs">Chat</span>
                <p className="font-medium text-slate-200">{currentBroadcast.allowChat ? "Enabled" : "Disabled"}</p>
              </div>
            </div>
          </div>

          {/* Operator Guidance */}
          <div className="rounded-xl border border-teal-500/20 bg-teal-500/5 p-4">
            <div className="flex items-start gap-3">
              <Info className="w-4 h-4 text-teal-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-teal-400 mb-1">Operator Guidance</p>
                <p className="text-xs text-slate-400 leading-relaxed">{modeConfig.guidance}</p>
                {isReady && (
                  <p className="text-xs text-teal-400/80 mt-2">
                    Click "Go Live" when ready to start broadcasting. The shareable URL will be generated automatically.
                  </p>
                )}
                {isLive && (
                  <p className="text-xs text-red-400/80 mt-2">
                    Broadcast is active. Metrics update every 2 seconds. Click "Stop Broadcast" to end the session.
                  </p>
                )}
                {isStopped && (
                  <p className="text-xs text-slate-400/80 mt-2">
                    Broadcast has ended. {currentBroadcast.autoRecord ? "Recording has been archived automatically." : ""} Click "New Broadcast" to start another session.
                  </p>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Loading state when broadcast is selected but data not yet loaded */}
      {activeBroadcastId && !currentBroadcast && broadcastStatus.isLoading && (
        <div className="flex items-center justify-center py-12 text-slate-500">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          <span className="text-sm">Loading broadcast...</span>
        </div>
      )}
    </div>
  );
}
