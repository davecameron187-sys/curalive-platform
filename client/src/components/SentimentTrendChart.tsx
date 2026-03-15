import React, { useState, useCallback, useEffect } from "react";
import { useAblyChannel } from "@/hooks/useAblyChannel";
import { Types } from "ably";
import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface SentimentDataPoint {
  timestamp: number;
  score: number;
  trend: "positive" | "neutral" | "negative";
}

/**
 * SentimentTrendChart Component
 * 
 * Displays real-time sentiment analysis with sparkline trend visualization.
 * Subscribes to sentiment updates and maintains a rolling window of historical data.
 */
export function SentimentTrendChart({ conferenceId }: { conferenceId: number }) {
  const [sentimentData, setSentimentData] = useState<SentimentDataPoint[]>([]);
  const [currentScore, setCurrentScore] = useState<number | null>(null);
  const [currentTrend, setCurrentTrend] = useState<"positive" | "neutral" | "negative">("neutral");
  const [keywords, setKeywords] = useState<string[]>([]);
  const [averageScore, setAverageScore] = useState<number>(0);
  const [trendDirection, setTrendDirection] = useState<"up" | "down" | "stable">("stable");

  // Subscribe to real-time sentiment updates
  useAblyChannel(
    `occ:sentiment:${conferenceId}`,
    "sentiment.updated",
    useCallback((message: Types.Message) => {
      const sentimentUpdate = message.data;

      // Add new data point
      setSentimentData((prev) => {
        const newData = [
          ...prev,
          {
            timestamp: Date.now(),
            score: sentimentUpdate.score,
            trend: sentimentUpdate.trend,
          },
        ];

        // Keep only last 60 data points (rolling window)
        return newData.slice(-60);
      });

      setCurrentScore(sentimentUpdate.score);
      setCurrentTrend(sentimentUpdate.trend);
      setKeywords(sentimentUpdate.keywords || []);

      // Calculate trend direction
      if (prev && prev.length > 0) {
        const previousScore = prev[prev.length - 1].score;
        if (sentimentUpdate.score > previousScore) {
          setTrendDirection("up");
        } else if (sentimentUpdate.score < previousScore) {
          setTrendDirection("down");
        } else {
          setTrendDirection("stable");
        }
      }
    }, [])
  );

  // Calculate average score whenever data changes
  useEffect(() => {
    if (sentimentData.length > 0) {
      const avg =
        sentimentData.reduce((sum, d) => sum + d.score, 0) / sentimentData.length;
      setAverageScore(Math.round(avg));
    }
  }, [sentimentData]);

  // Generate SVG sparkline
  const generateSparkline = () => {
    if (sentimentData.length < 2) return null;

    const width = 200;
    const height = 60;
    const padding = 5;
    const graphWidth = width - padding * 2;
    const graphHeight = height - padding * 2;

    const minScore = 0;
    const maxScore = 100;
    const scoreRange = maxScore - minScore;

    const points = sentimentData.map((d, i) => {
      const x = padding + (i / (sentimentData.length - 1)) * graphWidth;
      const y = padding + graphHeight - ((d.score - minScore) / scoreRange) * graphHeight;
      return `${x},${y}`;
    });

    return (
      <svg width={width} height={height} className="w-full h-auto">
        {/* Grid lines */}
        <line x1={padding} y1={padding + graphHeight / 2} x2={width - padding} y2={padding + graphHeight / 2} stroke="rgba(148,163,184,0.1)" strokeWidth="1" />

        {/* Sentiment line */}
        <polyline
          points={points.join(" ")}
          fill="none"
          stroke={
            currentTrend === "positive"
              ? "#22c55e"
              : currentTrend === "negative"
                ? "#ef4444"
                : "#eab308"
          }
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        />

        {/* Area under curve */}
        <polygon
          points={`${padding},${padding + graphHeight} ${points.join(" ")} ${width - padding},${padding + graphHeight}`}
          fill={
            currentTrend === "positive"
              ? "rgba(34,197,94,0.1)"
              : currentTrend === "negative"
                ? "rgba(239,68,68,0.1)"
                : "rgba(234,179,8,0.1)"
          }
        />

        {/* Current point indicator */}
        {points.length > 0 && (
          <circle
            cx={points[points.length - 1].split(",")[0]}
            cy={points[points.length - 1].split(",")[1]}
            r="3"
            fill={
              currentTrend === "positive"
                ? "#22c55e"
                : currentTrend === "negative"
                  ? "#ef4444"
                  : "#eab308"
            }
          />
        )}
      </svg>
    );
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg">Live Sentiment Analysis</h3>
          <div className="flex items-center gap-2">
            {trendDirection === "up" && (
              <TrendingUp className="h-5 w-5 text-green-500" />
            )}
            {trendDirection === "down" && (
              <TrendingDown className="h-5 w-5 text-red-500" />
            )}
            {trendDirection === "stable" && (
              <Minus className="h-5 w-5 text-yellow-500" />
            )}
          </div>
        </div>

        {/* Current Score */}
        {currentScore !== null && (
          <div className="grid grid-cols-3 gap-4">
            <div className="p-3 bg-background rounded border border-border">
              <p className="text-xs text-muted-foreground mb-1">Current Score</p>
              <p className="text-2xl font-bold">{currentScore}%</p>
            </div>
            <div className="p-3 bg-background rounded border border-border">
              <p className="text-xs text-muted-foreground mb-1">Average Score</p>
              <p className="text-2xl font-bold">{averageScore}%</p>
            </div>
            <div className="p-3 bg-background rounded border border-border">
              <p className="text-xs text-muted-foreground mb-1">Sentiment</p>
              <p
                className={`text-lg font-bold capitalize ${
                  currentTrend === "positive"
                    ? "text-green-500"
                    : currentTrend === "negative"
                      ? "text-red-500"
                      : "text-yellow-500"
                }`}
              >
                {currentTrend}
              </p>
            </div>
          </div>
        )}

        {/* Sparkline Chart */}
        <div className="p-4 bg-background rounded border border-border">
          <p className="text-xs text-muted-foreground mb-2">Trend (Last {sentimentData.length} updates)</p>
          {generateSparkline() ? (
            generateSparkline()
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              Waiting for sentiment data...
            </p>
          )}
        </div>

        {/* Keywords */}
        {keywords.length > 0 && (
          <div className="p-4 bg-background rounded border border-border">
            <p className="text-xs text-muted-foreground mb-2">Key Topics</p>
            <div className="flex flex-wrap gap-2">
              {keywords.map((keyword, idx) => (
                <span
                  key={idx}
                  className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full"
                >
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Score Gauge */}
        {currentScore !== null && (
          <div className="p-4 bg-background rounded border border-border">
            <p className="text-xs text-muted-foreground mb-2">Sentiment Gauge</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-3 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white/20 transition-all"
                  style={{ width: `${100 - currentScore}%` }}
                />
              </div>
              <span className="text-sm font-medium">{currentScore}%</span>
            </div>
          </div>
        )}

        {/* Data Points */}
        <div className="text-xs text-muted-foreground text-center">
          {sentimentData.length > 0 && (
            <p>
              Tracking {sentimentData.length} sentiment updates
              {sentimentData.length === 60 && " (rolling window)"}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}
