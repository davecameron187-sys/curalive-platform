import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Play, Pause, RotateCcw, Clock } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface LiveRollingSummaryPanelProps {
  conferenceId: number;
  isLive: boolean;
}

export function LiveRollingSummaryPanel({ conferenceId, isLive }: LiveRollingSummaryPanelProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(isLive);

  // Queries
  const { data: latestSummary, refetch: refetchLatest } = trpc.liveRollingSummary.getLatest.useQuery(
    { conferenceId },
    { enabled: !!conferenceId, refetchInterval: autoRefresh ? 10000 : false }
  );

  const { data: history } = trpc.liveRollingSummary.getHistory.useQuery(
    { conferenceId, limit: 10 },
    { enabled: !!conferenceId }
  );

  // Mutations
  const startMutation = trpc.liveRollingSummary.start.useMutation({
    onSuccess: () => {
      setAutoRefresh(true);
      refetchLatest();
    },
  });

  const stopMutation = trpc.liveRollingSummary.stop.useMutation({
    onSuccess: () => {
      setAutoRefresh(false);
    },
  });

  const generateNowMutation = trpc.liveRollingSummary.generateNow.useMutation({
    onSuccess: () => {
      refetchLatest();
    },
  });

  useEffect(() => {
    if (isLive && !autoRefresh) {
      setAutoRefresh(true);
      startMutation.mutate({ conferenceId });
    }
  }, [isLive]);

  const handleStart = () => {
    startMutation.mutate({ conferenceId });
  };

  const handleStop = () => {
    stopMutation.mutate({ conferenceId });
  };

  const handleGenerateNow = () => {
    setIsGenerating(true);
    generateNowMutation.mutate(
      { conferenceId },
      {
        onSettled: () => setIsGenerating(false),
      }
    );
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Live Rolling Summary
            </CardTitle>
            <CardDescription>Auto-generated 60-second summaries during the event</CardDescription>
          </div>
          <div className="flex gap-2">
            {!autoRefresh ? (
              <Button onClick={handleStart} size="sm" variant="default">
                <Play className="w-4 h-4 mr-1" />
                Start
              </Button>
            ) : (
              <Button onClick={handleStop} size="sm" variant="destructive">
                <Pause className="w-4 h-4 mr-1" />
                Stop
              </Button>
            )}
            <Button onClick={handleGenerateNow} size="sm" variant="outline" disabled={isGenerating}>
              <RotateCcw className="w-4 h-4 mr-1" />
              Generate Now
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Current Summary */}
        {latestSummary ? (
          <div className="space-y-2">
            <div className="text-sm font-semibold text-muted-foreground">Latest Summary</div>
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
              <p className="text-sm leading-relaxed text-foreground">{latestSummary.summary}</p>
              <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                <span>
                  {latestSummary.segmentCount} segments • {formatTime(latestSummary.windowStartTime)} -{" "}
                  {formatTime(latestSummary.windowEndTime)}
                </span>
                <span>{new Date(latestSummary.generatedAt).toLocaleTimeString()}</span>
              </div>
            </div>
          </div>
        ) : (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>No summaries generated yet. Start the live rolling summary to begin.</AlertDescription>
          </Alert>
        )}

        {/* Summary History */}
        {history && history.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-semibold text-muted-foreground">Recent Summaries</div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {history.slice(1).map((summary, idx) => (
                <div key={idx} className="p-3 bg-secondary/30 border border-secondary/50 rounded text-xs">
                  <p className="text-foreground line-clamp-2 mb-1">{summary.summary}</p>
                  <div className="flex justify-between text-muted-foreground text-xs">
                    <span>{summary.segmentCount} segments</span>
                    <span>{new Date(summary.generatedAt).toLocaleTimeString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Status */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>
            <strong>Status:</strong> {autoRefresh ? "🟢 Active (auto-generating every 60s)" : "⚫ Inactive"}
          </p>
          <p>
            <strong>Total Generated:</strong> {history?.length || 0} summaries
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
