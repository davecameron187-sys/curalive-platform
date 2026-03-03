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
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Bot, Play, Square, RefreshCw, Mic, AlertCircle, CheckCircle2, Clock } from "lucide-react";
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
  const [botName, setBotName] = useState("Chorus.AI");
  const [activeBotId, setActiveBotId] = useState<string | null>(null);

  const isConfigured = trpc.recall.isConfigured.useQuery();

  const deployBot = trpc.recall.deployBot.useMutation({
    onSuccess: (data) => {
      setActiveBotId(data.botId);
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
      refetchInterval: 5000, // poll every 5s
    }
  );

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
          <div className="ml-auto">
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
                placeholder="Chorus.AI"
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
          {/* Transcript preview */}
          {botStatus.data?.transcriptSegments && botStatus.data.transcriptSegments.length > 0 && (
            <div className="bg-background rounded-lg p-3 max-h-40 overflow-y-auto space-y-2">
              {botStatus.data.transcriptSegments.slice(-8).map((seg: { id: string; timeLabel: string; speaker: string; text: string }) => (
                <div key={seg.id} className="text-xs">
                  <span className="text-muted-foreground font-mono">[{seg.timeLabel}]</span>{" "}
                  <span className="text-primary font-semibold">{seg.speaker}:</span>{" "}
                  <span className="text-foreground">{seg.text}</span>
                </div>
              ))}
            </div>
          )}

          {botStatus.data?.transcriptSegments?.length === 0 && (
            <div className="bg-background rounded-lg p-3 text-center text-xs text-muted-foreground">
              <Mic className="w-4 h-4 mx-auto mb-1 opacity-40" />
              Waiting for speech…
            </div>
          )}

          {/* Stats row */}
          {!compact && botStatus.data && (
            <div className="flex gap-3 text-xs text-muted-foreground">
              <span>{botStatus.data.transcriptSegments?.length ?? 0} segments</span>
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
