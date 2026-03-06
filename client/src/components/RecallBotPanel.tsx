/**
 * RecallBotPanel — Recall.ai Bot Control Panel
 *
 * Used in EventRoom (Moderator view) and WebcastStudio to:
 *   - Deploy a Recall.ai bot to a Zoom / Teams / Webex meeting
 *   - Monitor bot status in real time
 *   - Stop the bot
 *   - Show a live transcript feed from the bot
 *
 * Props:
 *   eventId   — numeric DB event ID (for webcast events)
 *   meetingId — numeric DB meeting ID (for roadshow meetings)
 *   compact   — if true, renders a collapsed card suitable for sidebars
 */
import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Bot, Play, Square, RefreshCw, Mic, AlertCircle, CheckCircle2, Clock, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface RecallBotPanelProps {
  eventId?: number;
  meetingId?: number;
  compact?: boolean;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  created:                  { label: "Created",       color: "bg-slate-500",  icon: <Clock className="w-3 h-3" /> },
  joining:                  { label: "Joining…",      color: "bg-amber-500",  icon: <RefreshCw className="w-3 h-3 animate-spin" /> },
  in_call_not_recording:    { label: "In Call",        color: "bg-emerald-500", icon: <Mic className="w-3 h-3" /> },
  in_call_recording:        { label: "Recording",     color: "bg-red-500",    icon: <Mic className="w-3 h-3" /> },
  done:                     { label: "Done",           color: "bg-slate-400",  icon: <CheckCircle2 className="w-3 h-3" /> },
  call_ended:               { label: "Call Ended",    color: "bg-slate-400",  icon: <CheckCircle2 className="w-3 h-3" /> },
  fatal:                    { label: "Failed",         color: "bg-red-600",    icon: <AlertCircle className="w-3 h-3" /> },
  waiting_for_host:         { label: "Waiting…",      color: "bg-amber-500",  icon: <Clock className="w-3 h-3" /> },
  waiting_for_admission:    { label: "Waiting…",      color: "bg-amber-500",  icon: <Clock className="w-3 h-3" /> },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, color: "bg-slate-500", icon: <Clock className="w-3 h-3" /> };
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold text-white px-2 py-0.5 rounded-full ${cfg.color}`}>
      {cfg.icon} {cfg.label}
    </span>
  );
}

export default function RecallBotPanel({ eventId, meetingId, compact = false }: RecallBotPanelProps) {
  const [meetingUrl, setMeetingUrl] = useState("");
  const [botName, setBotName] = useState("CuraLive");
  const [activeBotId, setActiveBotId] = useState<string | null>(null);
  const [ablyChannel, setAblyChannel] = useState<string | null>(null);
  // Real-time transcript segments received via Ably (supplements the polled data)
  const [realtimeSegments, setRealtimeSegments] = useState<Array<{ id: string; speaker: string; text: string; timeLabel: string; timestamp: number }>>([]);
  const ablyClientRef = useRef<any>(null);

  // Ably token request for real-time subscription
  const ablyConfig = trpc.ably.tokenRequest.useQuery(
    { clientId: `recall-panel-${eventId ?? meetingId ?? "x"}` },
    { enabled: Boolean(ablyChannel), retry: false, staleTime: Infinity }
  );

  // Subscribe to the bot's dedicated Ably channel for real-time transcript segments
  useEffect(() => {
    if (!ablyChannel || !ablyConfig.data || ablyConfig.data.mode !== "ably" || !ablyConfig.data.tokenRequest) return;
    let client: any;
    (async () => {
      try {
        const Ably = await import("ably");
        client = new (Ably.default as any).Realtime({
          authCallback: (_data: unknown, callback: (err: string | null, token: unknown) => void) => {
            callback(null, ablyConfig.data!.tokenRequest);
          },
        });
        const ch = client.channels.get(ablyChannel);
        ch.subscribe((msg: any) => {
          try {
            const parsed = JSON.parse(msg.data);
            if (parsed.type === "transcript.segment" && parsed.data) {
              setRealtimeSegments((prev) => {
                // Deduplicate by segment id
                if (prev.find((s) => s.id === parsed.data.id)) return prev;
                return [...prev, parsed.data];
              });
            } else if (parsed.type === "bot.status") {
              // Trigger a status refetch when we get a status change event
              botStatus.refetch();
            }
          } catch {}
        });
        ablyClientRef.current = client;
      } catch (err) {
        console.warn("[RecallBotPanel] Ably connection failed:", err);
      }
    })();
    return () => {
      client?.close();
      ablyClientRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ablyChannel, ablyConfig.data]);

  // Clean up Ably when bot is stopped
  useEffect(() => {
    if (!activeBotId) {
      ablyClientRef.current?.close();
      ablyClientRef.current = null;
      setRealtimeSegments([]);
      setAblyChannel(null);
    }
  }, [activeBotId]);

  const isConfigured = trpc.recall.isConfigured.useQuery();

  const deployBot = trpc.recall.deployBot.useMutation({
    onSuccess: (data) => {
      setActiveBotId(data.botId);
      setAblyChannel(data.ablyChannel); // subscribe to real-time transcript channel
      toast.success("Bot deployed", { description: data.message });
    },
    onError: (err) => {
      toast.error("Deploy failed", { description: err.message });
    },
  });

  const stopBot = trpc.recall.stopBot.useMutation({
    onSuccess: () => {
      toast.success("Bot stopped", { description: "The bot has left the meeting." });
      setActiveBotId(null);
    },
    onError: (err) => {
      toast.error("Stop failed", { description: err.message });
    },
  });

  const botStatus = trpc.recall.getBotStatus.useQuery(
    { recallBotId: activeBotId! },
    {
      enabled: Boolean(activeBotId),
      // Reduce polling to 15s when Ably is connected (real-time handles transcript updates)
      // Keep 5s polling as fallback when Ably is not available
      refetchInterval: ablyChannel && ablyConfig.data?.mode === "ably" ? 15000 : 5000,
    }
  );

  // Merge polled transcript segments with real-time Ably segments (deduplicated)
  // getBotStatus returns `segments` (parsed from transcriptJson)
  const allSegments = (() => {
    const polled: Array<{ id: string; speaker: string; text: string; timeLabel: string; timestamp: number }> =
      (botStatus.data as any)?.segments ?? [];
    const merged = [...polled];
    for (const seg of realtimeSegments) {
      if (!merged.find((s) => s.id === seg.id)) merged.push(seg);
    }
    return merged.sort((a, b) => (a.timestamp ?? 0) - (b.timestamp ?? 0));
  })();

  const isAblyLive = Boolean(ablyChannel && ablyConfig.data?.mode === "ably");

  const handleDeploy = () => {
    if (!meetingUrl.trim()) {
      toast.error("Meeting URL required", { description: "Paste a Zoom, Teams, or Webex meeting link." });
      return;
    }
    deployBot.mutate({
      meetingUrl: meetingUrl.trim(),
      botName,
      eventId,
      meetingId,
      enableRecording: false,
      webhookBaseUrl: window.location.origin,
    });
  };

  const handleStop = () => {
    if (!activeBotId) return;
    stopBot.mutate({ recallBotId: activeBotId });
  };

  const isActive = activeBotId && botStatus.data &&
    !["done", "call_ended", "fatal"].includes(botStatus.data.status);

  if (!isConfigured.data?.configured) {
    return (
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 text-sm">
        <div className="flex items-center gap-2 text-amber-400 font-semibold mb-1">
          <AlertCircle className="w-4 h-4" /> Recall.ai Not Configured
        </div>
        <p className="text-muted-foreground text-xs">
          Add your RECALL_AI_API_KEY to enable live meeting transcription.
        </p>
      </div>
    );
  }

  return (
    <div className={`bg-card border border-border rounded-xl ${compact ? "p-4" : "p-5"}`}>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Bot className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-sm">Recall.ai Bot</h3>
          <p className="text-xs text-muted-foreground">Live meeting transcription</p>
        </div>
        {activeBotId && botStatus.data && (
          <div className="ml-auto flex items-center gap-2">
            {isAblyLive && (
              <span className="flex items-center gap-1 text-xs text-emerald-400 font-semibold">
                <Zap className="w-3 h-3" /> Live
              </span>
            )}
            <StatusBadge status={botStatus.data.status} />
          </div>
        )}
      </div>

      {!activeBotId ? (
        /* Deploy form */
        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Meeting URL</label>
            <Input
              placeholder="https://zoom.us/j/... or Teams / Webex link"
              value={meetingUrl}
              onChange={(e) => setMeetingUrl(e.target.value)}
              className="text-sm h-9"
            />
          </div>
          {!compact && (
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Bot Display Name</label>
              <Input
                value={botName}
                onChange={(e) => setBotName(e.target.value)}
                className="text-sm h-9"
                placeholder="CuraLive"
              />
            </div>
          )}
          <Button
            onClick={handleDeploy}
            disabled={deployBot.isPending}
            className="w-full h-9 text-sm gap-2"
          >
            <Play className="w-3.5 h-3.5" />
            {deployBot.isPending ? "Deploying…" : "Deploy Bot"}
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            Bot will join the meeting within 30–60 seconds
          </p>
        </div>
      ) : (
        /* Active bot status */
        <div className="space-y-3">
          {/* Transcript preview — uses merged polled + real-time Ably segments */}
          {allSegments.length > 0 && (
            <div className="bg-background rounded-lg p-3 max-h-40 overflow-y-auto space-y-2">
              {allSegments.slice(-8).map((seg) => (
                <div key={seg.id} className="text-xs">
                  <span className="text-muted-foreground font-mono">[{seg.timeLabel}]</span>{" "}
                  <span className="text-primary font-semibold">{seg.speaker}:</span>{" "}
                  <span className="text-foreground">{seg.text}</span>
                </div>
              ))}
            </div>
          )}

          {allSegments.length === 0 && (
            <div className="bg-background rounded-lg p-3 text-center text-xs text-muted-foreground">
              <Mic className="w-4 h-4 mx-auto mb-1 opacity-40" />
              Waiting for speech…
            </div>
          )}

          {/* Stats row */}
          {!compact && botStatus.data && (
            <div className="flex gap-3 text-xs text-muted-foreground">
              <span>{allSegments.length} segments</span>
              {botStatus.data.recordingUrl && (
                <a href={botStatus.data.recordingUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  View Recording
                </a>
              )}
            </div>
          )}

          {/* Controls */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => botStatus.refetch()}
              className="flex-1 gap-1 text-xs"
            >
              <RefreshCw className="w-3 h-3" /> Refresh
            </Button>
            {isActive && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleStop}
                disabled={stopBot.isPending}
                className="flex-1 gap-1 text-xs"
              >
                <Square className="w-3 h-3" />
                {stopBot.isPending ? "Stopping…" : "Stop Bot"}
              </Button>
            )}
          </div>

          <button
            onClick={() => setActiveBotId(null)}
            className="text-xs text-muted-foreground hover:text-foreground w-full text-center"
          >
            Deploy another bot
          </button>
        </div>
      )}
    </div>
  );
}
