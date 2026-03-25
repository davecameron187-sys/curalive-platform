/**
 * RollingSummaryPanel — displays the live rolling AI summary.
 *
 * Used in: WebcastStudio (AI tab), Presenter teleprompter, AttendeeEventRoom.
 * Receives rollingSummary from AblyContext (updated every 10 transcript segments).
 * Operators can also manually trigger a refresh via the tRPC mutation.
 */

import { useState } from "react";
import { useAbly } from "@/contexts/AblyContext";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Sparkles, RefreshCw, Clock } from "lucide-react";

interface RollingSummaryPanelProps {
  eventTitle?: string;
  botId?: number;
  /** Compact mode for the Presenter teleprompter (smaller font, no refresh button) */
  compact?: boolean;
  className?: string;
}

export default function RollingSummaryPanel({
  eventTitle = "Live Event",
  botId,
  compact = false,
  className = "",
}: RollingSummaryPanelProps) {
  const { rollingSummary, transcript } = useAbly();
  const [localSummary, setLocalSummary] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<number | null>(null);

  const generateMutation = trpc.ai.generateRollingSummary.useMutation({
    onSuccess: (data) => {
      setLocalSummary(data.text);
      setLastRefreshed(Date.now());
      toast.success("AI summary refreshed");
    },
    onError: () => {
      toast.error("Failed to generate summary");
    },
  });

  const handleRefresh = () => {
    generateMutation.mutate({
      segments: transcript.map((s) => ({ speaker: s.speaker, text: s.text })),
      eventTitle,
      botId,
    });
  };

  // Prefer the live Ably-pushed summary, fall back to manually triggered one
  const displayText =
    rollingSummary?.text || localSummary || null;

  const displayTime = rollingSummary?.timestamp || lastRefreshed;

  if (compact) {
    return (
      <div className={`bg-primary/10 border border-primary/20 rounded-lg p-3 ${className}`}>
        <div className="flex items-center gap-1.5 mb-1.5">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-semibold text-primary uppercase tracking-wider">AI Summary</span>
        </div>
        {displayText ? (
          <p className="text-sm text-foreground leading-relaxed">{displayText}</p>
        ) : (
          <p className="text-xs text-muted-foreground italic">
            Summary will appear after the first few minutes of the event.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className={`bg-card border border-border rounded-xl p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <div>
            <div className="text-sm font-semibold">Rolling AI Summary</div>
            <div className="text-xs text-muted-foreground">
              {displayTime
                ? `Updated ${new Date(displayTime).toLocaleTimeString()}`
                : "Updates every ~10 segments"}
            </div>
          </div>
        </div>
        <button
          onClick={handleRefresh}
          disabled={generateMutation.isPending || transcript.length === 0}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground border border-border rounded-lg px-2.5 py-1.5 hover:bg-secondary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`w-3 h-3 ${generateMutation.isPending ? "animate-spin" : ""}`} />
          {generateMutation.isPending ? "Generating..." : "Refresh"}
        </button>
      </div>

      {displayText ? (
        <p className="text-sm text-foreground leading-relaxed">{displayText}</p>
      ) : (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
          <Clock className="w-4 h-4 shrink-0" />
          <span>
            {transcript.length === 0
              ? "Waiting for transcript to begin..."
              : "Summary will appear after a few more segments are captured."}
          </span>
        </div>
      )}

      {rollingSummary && (
        <div className="mt-2 pt-2 border-t border-border/50 text-xs text-muted-foreground">
          Based on {rollingSummary.segmentCount} transcript segments
        </div>
      )}
    </div>
  );
}
