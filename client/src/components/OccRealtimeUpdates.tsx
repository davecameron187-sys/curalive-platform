// @ts-nocheck
import React, { useState, useCallback } from "react";
import { useAblyChannel } from "@/hooks/useAblyChannel";
import { Types } from "ably";
import { toast } from "sonner";

/**
 * OccRealtimeUpdates Component
 * 
 * Displays real-time updates for OCC (Operator Call Centre) including:
 * - Participant status changes
 * - Q&A approvals
 * - Sentiment analysis updates
 */
export function OccRealtimeUpdates({ conferenceId }: { conferenceId: number }) {
  const [participants, setParticipants] = useState<any[]>([]);
  const [qaApprovals, setQaApprovals] = useState<any[]>([]);
  const [sentimentScore, setSentimentScore] = useState<number | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);

  // Subscribe to participant status updates
  useAblyChannel(
    `occ:participants:${conferenceId}`,
    "participant.updated",
    useCallback((message: Types.Message) => {
      const participantData = message.data;
      setParticipants((prev) => {
        const existing = prev.find((p) => p.participantId === participantData.participantId);
        if (existing) {
          return prev.map((p) =>
            p.participantId === participantData.participantId ? participantData : p
          );
        }
        return [...prev, participantData];
      });

      if (participantData.isSpeaking) {
        toast.info(`${participantData.participantId} is now speaking`);
      }
    }, [conferenceId])
  );

  // Subscribe to Q&A approvals
  useAblyChannel(
    `occ:qa:${conferenceId}`,
    "qa.approved",
    useCallback((message: Types.Message) => {
      const qaData = message.data;
      setQaApprovals((prev) => [...prev, qaData]);
      toast.success(`Q&A approved: ${qaData.question}`);
    }, [conferenceId])
  );

  // Subscribe to sentiment updates
  useAblyChannel(
    `occ:sentiment:${conferenceId}`,
    "sentiment.updated",
    useCallback((message: Types.Message) => {
      const sentimentData = message.data;
      setSentimentScore(sentimentData.score);
      toast.info(`Sentiment: ${sentimentData.trend} (${sentimentData.score}%)`);
    }, [conferenceId])
  );

  // Subscribe to general OCC notifications
  useAblyChannel(
    `occ:notifications:${conferenceId}`,
    null, // Subscribe to all events
    useCallback((message: Types.Message) => {
      const notification = {
        type: message.name,
        data: message.data,
        timestamp: new Date().toISOString(),
      };
      setNotifications((prev) => [...prev, notification].slice(-10)); // Keep last 10
    }, [conferenceId])
  );

  return (
    <div className="space-y-4">
      {/* Sentiment Score */}
      {sentimentScore !== null && (
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="font-semibold mb-2">Live Sentiment</h3>
          <div className="flex items-center gap-4">
            <div className="text-3xl font-bold">{sentimentScore}%</div>
            <div className="flex-1 bg-background rounded-full h-2">
              <div
                className="bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 h-2 rounded-full transition-all"
                style={{ width: `${sentimentScore}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Active Participants */}
      {participants.length > 0 && (
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="font-semibold mb-2">Active Participants ({participants.length})</h3>
          <div className="space-y-2">
            {participants.slice(-5).map((p, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 bg-background rounded">
                <span className="text-sm">{p.participantId}</span>
                <div className="flex gap-2">
                  {p.isSpeaking && (
                    <span className="px-2 py-1 bg-red-500/20 text-red-500 text-xs rounded">
                      Speaking
                    </span>
                  )}
                  {p.requestToSpeak && (
                    <span className="px-2 py-1 bg-yellow-500/20 text-yellow-500 text-xs rounded">
                      Hand Raised
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground">{p.state}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Q&A Approvals */}
      {qaApprovals.length > 0 && (
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="font-semibold mb-2">Approved Q&A ({qaApprovals.length})</h3>
          <div className="space-y-2">
            {qaApprovals.slice(-5).map((qa, idx) => (
              <div key={idx} className="p-2 bg-background rounded text-sm">
                <p className="font-medium">{qa.question}</p>
                <p className="text-xs text-muted-foreground">Approved by {qa.approvedBy}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Notifications */}
      {notifications.length > 0 && (
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="font-semibold mb-2">Recent Activity</h3>
          <div className="space-y-1 text-xs">
            {notifications.slice(-5).map((notif, idx) => (
              <div key={idx} className="text-muted-foreground">
                <span className="font-medium">{notif.type}:</span> {JSON.stringify(notif.data).substring(0, 50)}...
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
