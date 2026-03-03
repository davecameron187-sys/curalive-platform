/**
 * MuxStreamPanel — RTMP Stream Key Management UI
 *
 * Displayed in the Webcast Studio and OCC for operators to:
 *  1. Create a new Mux live stream for the current event
 *  2. Copy the RTMP URL + stream key for OBS/vMix
 *  3. Monitor stream status (idle / active / disconnected / disabled)
 *  4. Disable or delete the stream
 *
 * The HLS playback URL is also shown so operators can share it with attendees
 * or embed it in the Event Room player.
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Radio,
  Copy,
  Eye,
  EyeOff,
  RefreshCw,
  Trash2,
  Video,
  CheckCircle,
  AlertCircle,
  Loader2,
  Plus,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

interface MuxStreamPanelProps {
  eventId?: number;
  meetingId?: number;
  eventLabel?: string;
}

function StatusBadge({ status }: { status: string }) {
  if (status === "active") {
    return (
      <Badge className="bg-red-500/20 text-red-400 border-red-500/30 flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse inline-block" />
        LIVE
      </Badge>
    );
  }
  if (status === "idle") {
    return (
      <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
        Idle — Waiting for stream
      </Badge>
    );
  }
  if (status === "disconnected") {
    return (
      <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">
        Disconnected
      </Badge>
    );
  }
  if (status === "disabled") {
    return (
      <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30">
        Disabled
      </Badge>
    );
  }
  return <Badge variant="outline">{status}</Badge>;
}

function CopyField({ label, value, secret = false }: { label: string; value: string; secret?: boolean }) {
  const [visible, setVisible] = useState(!secret);

  const handleCopy = () => {
    navigator.clipboard.writeText(value).then(() => {
      toast.success(`${label} copied to clipboard`);
    });
  };

  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{label}</p>
      <div className="flex items-center gap-2 bg-muted/40 border border-border rounded-lg px-3 py-2">
        <code className="flex-1 text-xs font-mono text-foreground truncate">
          {visible ? value : "•".repeat(Math.min(value.length, 32))}
        </code>
        {secret && (
          <button
            onClick={() => setVisible((v) => !v)}
            className="text-muted-foreground hover:text-foreground transition-colors"
            title={visible ? "Hide" : "Show"}
          >
            {visible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
        )}
        <button
          onClick={handleCopy}
          className="text-muted-foreground hover:text-primary transition-colors"
          title="Copy"
        >
          <Copy className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

export default function MuxStreamPanel({ eventId, meetingId, eventLabel }: MuxStreamPanelProps) {
  const [creating, setCreating] = useState(false);
  const [newLabel, setNewLabel] = useState(eventLabel ?? "Live Stream");

  // Check if Mux is configured
  const { data: config } = trpc.mux.isConfigured.useQuery();

  // List existing streams
  const { data: streams, refetch: refetchStreams, isLoading } = trpc.mux.listStreams.useQuery(
    { eventId, meetingId },
    { refetchInterval: 15000 } // poll every 15s for status updates
  );

  const createStream = trpc.mux.createStream.useMutation({
    onSuccess: () => {
      toast.success("Stream created — paste the RTMP URL and stream key into OBS or vMix");
      setCreating(false);
      refetchStreams();
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const disableStream = trpc.mux.disableStream.useMutation({
    onSuccess: () => {
      toast.success("Stream disabled");
      refetchStreams();
    },
    onError: (err) => toast.error(err.message),
  });

  const enableStream = trpc.mux.enableStream.useMutation({
    onSuccess: () => {
      toast.success("Stream re-enabled");
      refetchStreams();
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteStream = trpc.mux.deleteStream.useMutation({
    onSuccess: () => {
      toast.success("Stream deleted");
      refetchStreams();
    },
    onError: (err) => toast.error(err.message),
  });

  if (!config?.configured) {
    return (
      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-5 space-y-2">
        <div className="flex items-center gap-2 text-amber-400">
          <AlertCircle className="w-4 h-4" />
          <span className="font-semibold text-sm">Mux Not Configured</span>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Add <code className="bg-muted px-1 rounded text-xs">MUX_TOKEN_ID</code> and{" "}
          <code className="bg-muted px-1 rounded text-xs">MUX_TOKEN_SECRET</code> to the platform secrets
          to enable RTMP ingest. Visit{" "}
          <a href="https://dashboard.mux.com" target="_blank" rel="noopener noreferrer" className="text-primary underline">
            dashboard.mux.com
          </a>{" "}
          to get your API credentials.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Video className="w-4 h-4 text-primary" />
          <span className="font-semibold text-sm">RTMP Streams</span>
          {streams && streams.length > 0 && (
            <Badge variant="outline" className="text-xs">{streams.length}</Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refetchStreams()}
            className="text-muted-foreground hover:text-foreground transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          {!creating && (
            <Button size="sm" variant="outline" onClick={() => setCreating(true)} className="h-7 text-xs gap-1">
              <Plus className="w-3 h-3" /> New Stream
            </Button>
          )}
        </div>
      </div>

      {/* Create form */}
      {creating && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
          <p className="text-xs font-semibold text-primary">Create New RTMP Stream</p>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Stream Label</label>
            <input
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="e.g. Q4 Earnings Call — Main Stream"
            />
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              className="h-7 text-xs"
              disabled={createStream.isPending || !newLabel.trim()}
              onClick={() =>
                createStream.mutate({
                  label: newLabel.trim(),
                  eventId,
                  meetingId,
                  recordingEnabled: true,
                  isPublic: true,
                })
              }
            >
              {createStream.isPending ? (
                <><Loader2 className="w-3 h-3 animate-spin mr-1" /> Creating…</>
              ) : (
                <><Radio className="w-3 h-3 mr-1" /> Create Stream</>
              )}
            </Button>
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setCreating(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Stream list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin mr-2" />
          <span className="text-sm">Loading streams…</span>
        </div>
      ) : streams && streams.length > 0 ? (
        <div className="space-y-4">
          {streams.map((stream) => (
            <div key={stream.muxStreamId} className="rounded-xl border border-border bg-card/40 p-4 space-y-3">
              {/* Stream header */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-sm">{stream.label ?? "Unnamed Stream"}</p>
                  <p className="text-xs text-muted-foreground font-mono mt-0.5">{stream.muxStreamId}</p>
                </div>
                <StatusBadge status={stream.status} />
              </div>

              {/* RTMP credentials */}
              <div className="space-y-2">
                <CopyField label="RTMP Server URL" value={stream.rtmpUrl ?? "rtmps://global-live.mux.com:443/app"} />
                <CopyField label="Stream Key" value={stream.streamKey} secret />
              </div>

              {/* OBS/vMix instructions */}
              <div className="rounded-lg bg-muted/30 border border-border p-3 text-xs text-muted-foreground leading-relaxed">
                <p className="font-semibold text-foreground mb-1">OBS Studio setup:</p>
                <p>Settings → Stream → Service: <strong>Custom</strong> → paste Server URL and Stream Key above → click Start Streaming.</p>
                <p className="mt-1 font-semibold text-foreground">vMix setup:</p>
                <p>Add Input → Stream → RTMP → paste Server URL and Stream Key → click Stream.</p>
              </div>

              {/* HLS playback */}
              {stream.hlsUrl && (
                <div className="space-y-2">
                  <CopyField label="HLS Playback URL (for attendees)" value={stream.hlsUrl} />
                  <a
                    href={`https://stream.mux.com/${stream.muxPlaybackId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    <ExternalLink className="w-3 h-3" /> Preview in Mux Player
                  </a>
                </div>
              )}

              {/* Status indicator */}
              {stream.status === "active" && (
                <div className="flex items-center gap-2 text-xs text-red-400">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Stream is live — encoder connected and sending video
                </div>
              )}
              {stream.status === "idle" && (
                <div className="flex items-center gap-2 text-xs text-amber-400">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Waiting for encoder — paste the RTMP URL and stream key into OBS/vMix and start streaming
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 pt-1 border-t border-border">
                {stream.status === "disabled" ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    disabled={enableStream.isPending}
                    onClick={() => enableStream.mutate({ muxStreamId: stream.muxStreamId })}
                  >
                    {enableStream.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : "Re-enable"}
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs text-amber-400 border-amber-500/30 hover:bg-amber-500/10"
                    disabled={disableStream.isPending}
                    onClick={() => disableStream.mutate({ muxStreamId: stream.muxStreamId })}
                  >
                    {disableStream.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : "Disable"}
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs text-red-400 hover:bg-red-500/10"
                  disabled={deleteStream.isPending}
                  onClick={() => {
                    if (confirm("Delete this stream permanently? This cannot be undone.")) {
                      deleteStream.mutate({ muxStreamId: stream.muxStreamId });
                    }
                  }}
                >
                  <Trash2 className="w-3 h-3 mr-1" /> Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <Video className="w-8 h-8 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">No streams yet</p>
          <p className="text-xs mt-1">Create a stream to get your RTMP URL and stream key for OBS or vMix.</p>
          <Button size="sm" className="mt-4 gap-1" onClick={() => setCreating(true)}>
            <Plus className="w-3 h-3" /> Create First Stream
          </Button>
        </div>
      )}
    </div>
  );
}
