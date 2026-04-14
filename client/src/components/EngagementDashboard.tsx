// @ts-nocheck
import React, { useState, useEffect } from "react";
import { useAblyChannel } from "@/hooks/useAblyChannel";
import { Types } from "ably";
import { Card } from "@/components/ui/card";
import { Activity, TrendingUp, Users, MessageSquare } from "lucide-react";

interface ParticipantEngagement {
  participantId: string;
  name: string;
  handRaises: number;
  qaResponses: number;
  pollVotes: number;
  sentimentScore: number;
  overallScore: number;
}

/**
 * Engagement Scoring Utility
 * 
 * Calculates engagement scores based on multiple metrics
 */
export const EngagementScorer = {
  /**
   * Calculate individual participant engagement score
   * 
   * Scoring breakdown:
   * - Hand raises: 10 points each (max 50)
   * - Q&A responses: 15 points each (max 45)
   * - Poll votes: 5 points each (max 20)
   * - Sentiment contribution: 0-20 points
   * - Total: 0-100
   */
  calculateParticipantScore(engagement: Omit<ParticipantEngagement, "overallScore">): number {
    const handRaiseScore = Math.min(engagement.handRaises * 10, 50);
    const qaScore = Math.min(engagement.qaResponses * 15, 45);
    const pollScore = Math.min(engagement.pollVotes * 5, 20);
    const sentimentScore = Math.max(0, Math.min(engagement.sentimentScore * 20, 20));

    return Math.round(handRaiseScore + qaScore + pollScore + sentimentScore);
  },

  /**
   * Calculate aggregate engagement metrics
   */
  calculateAggregateMetrics(participants: ParticipantEngagement[]) {
    if (participants.length === 0) {
      return {
        averageEngagement: 0,
        activeParticipants: 0,
        totalInteractions: 0,
        engagementTrend: "stable",
      };
    }

    const averageEngagement = Math.round(
      participants.reduce((sum, p) => sum + p.overallScore, 0) / participants.length
    );

    const activeParticipants = participants.filter((p) => p.overallScore > 20).length;

    const totalInteractions =
      participants.reduce((sum, p) => sum + p.handRaises + p.qaResponses + p.pollVotes, 0);

    const topScores = participants.slice(0, 3).map((p) => p.overallScore);
    const bottomScores = participants.slice(-3).map((p) => p.overallScore);
    const engagementTrend =
      topScores.reduce((a, b) => a + b, 0) / 3 >
      bottomScores.reduce((a, b) => a + b, 0) / 3
        ? "increasing"
        : "decreasing";

    return {
      averageEngagement,
      activeParticipants,
      totalInteractions,
      engagementTrend,
    };
  },
};

/**
 * EngagementDashboard Component
 * 
 * Real-time participant engagement tracking with scoring,
 * leaderboard, and aggregate metrics.
 */
export function EngagementDashboard({ conferenceId }: { conferenceId: number }) {
  const [participants, setParticipants] = useState<ParticipantEngagement[]>([]);

  // Subscribe to engagement updates
  useAblyChannel(
    `occ:engagement:${conferenceId}`,
    "engagement.updated",
    (message: Types.Message) => {
      const data = message.data;

      setParticipants((prev) => {
        const existing = prev.findIndex((p) => p.participantId === data.participantId);

        if (existing >= 0) {
          const updated = [...prev];
          updated[existing] = {
            ...updated[existing],
            ...data,
            overallScore: EngagementScorer.calculateParticipantScore({
              participantId: data.participantId,
              name: data.name,
              handRaises: data.handRaises,
              qaResponses: data.qaResponses,
              pollVotes: data.pollVotes,
              sentimentScore: data.sentimentScore,
            }),
          };
          return updated;
        }

        return [
          ...prev,
          {
            ...data,
            overallScore: EngagementScorer.calculateParticipantScore(data),
          },
        ];
      });
    },
    [conferenceId]
  );

  const metrics = EngagementScorer.calculateAggregateMetrics(participants);
  const sortedParticipants = [...participants].sort(
    (a, b) => b.overallScore - a.overallScore
  );

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 bg-green-500/10";
    if (score >= 60) return "text-blue-600 bg-blue-500/10";
    if (score >= 40) return "text-yellow-600 bg-yellow-500/10";
    return "text-red-600 bg-red-500/10";
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-blue-500";
    if (score >= 40) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div className="space-y-4">
      {/* Aggregate Metrics */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground mb-1">
                Avg Engagement
              </p>
              <p className="text-2xl font-bold">{metrics.averageEngagement}%</p>
            </div>
            <TrendingUp className="h-8 w-8 text-blue-500/20" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground mb-1">
                Active Participants
              </p>
              <p className="text-2xl font-bold">
                {metrics.activeParticipants}/{participants.length}
              </p>
            </div>
            <Users className="h-8 w-8 text-green-500/20" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground mb-1">
                Total Interactions
              </p>
              <p className="text-2xl font-bold">{metrics.totalInteractions}</p>
            </div>
            <MessageSquare className="h-8 w-8 text-purple-500/20" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground mb-1">
                Trend
              </p>
              <p className="text-2xl font-bold capitalize">
                {metrics.engagementTrend}
              </p>
            </div>
            <Activity className="h-8 w-8 text-amber-500/20" />
          </div>
        </Card>
      </div>

      {/* Leaderboard */}
      <Card className="p-4">
        <h3 className="font-semibold mb-4">Engagement Leaderboard</h3>

        {participants.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Waiting for participant data...
          </p>
        ) : (
          <div className="space-y-2">
            {sortedParticipants.slice(0, 10).map((participant, idx) => (
              <div
                key={participant.participantId}
                className="flex items-center justify-between p-3 bg-secondary rounded"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold">
                    #{idx + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{participant.name}</p>
                    <div className="flex gap-3 text-xs text-muted-foreground mt-1">
                      <span>🖐️ {participant.handRaises}</span>
                      <span>💬 {participant.qaResponses}</span>
                      <span>📊 {participant.pollVotes}</span>
                    </div>
                  </div>
                </div>

                {/* Score Bar */}
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className={`h-full ${getScoreBg(participant.overallScore)}`}
                      style={{ width: `${participant.overallScore}%` }}
                    />
                  </div>
                  <span
                    className={`text-sm font-bold px-2 py-1 rounded ${getScoreColor(participant.overallScore)}`}
                  >
                    {participant.overallScore}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Scoring Breakdown */}
      <Card className="p-4">
        <h3 className="font-semibold mb-3 text-sm">Scoring Breakdown</h3>
        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span>Hand Raises</span>
            <span className="text-muted-foreground">10 pts each (max 50)</span>
          </div>
          <div className="flex justify-between">
            <span>Q&A Responses</span>
            <span className="text-muted-foreground">15 pts each (max 45)</span>
          </div>
          <div className="flex justify-between">
            <span>Poll Votes</span>
            <span className="text-muted-foreground">5 pts each (max 20)</span>
          </div>
          <div className="flex justify-between">
            <span>Sentiment Contribution</span>
            <span className="text-muted-foreground">0-20 pts</span>
          </div>
          <div className="border-t border-border pt-2 mt-2 flex justify-between font-semibold">
            <span>Total Score</span>
            <span>0-100 pts</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
