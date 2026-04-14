// @ts-nocheck
import React, { useState, useCallback } from "react";
import { useAblyChannel } from "@/hooks/useAblyChannel";
import { Types } from "ably";
import { Card } from "@/components/ui/card";
import { Mic, MicOff, Hand, Signal, Users, Activity } from "lucide-react";

interface Participant {
  participantId: number;
  name: string;
  isSpeaking: boolean;
  requestToSpeak: boolean;
  connectionQuality: "excellent" | "good" | "fair" | "poor";
  state: "active" | "idle" | "disconnected";
  joinedAt: string;
}

/**
 * ParticipantStatusDashboard Component
 * 
 * Real-time participant status tracking with Ably integration.
 * Displays active participants, speaking status, hand-raised indicators, and connection quality.
 */
export function ParticipantStatusDashboard({ conferenceId }: { conferenceId: number }) {
  const [participants, setParticipants] = useState<Map<number, Participant>>(new Map());
  const [activeSpeaker, setActiveSpeaker] = useState<number | null>(null);
  const [handRaisedCount, setHandRaisedCount] = useState(0);

  // Subscribe to participant status updates
  useAblyChannel(
    `occ:participants:${conferenceId}`,
    "participant.updated",
    useCallback((message: Types.Message) => {
      const participantData = message.data;

      setParticipants((prev) => {
        const updated = new Map(prev);
        const existing = updated.get(participantData.participantId) || {};

        const participant: Participant = {
          participantId: participantData.participantId,
          name: participantData.name || `Participant ${participantData.participantId}`,
          isSpeaking: participantData.isSpeaking || false,
          requestToSpeak: participantData.requestToSpeak || false,
          connectionQuality: participantData.connectionQuality || "good",
          state: participantData.state || "active",
          joinedAt: existing.joinedAt || new Date().toISOString(),
        };

        updated.set(participantData.participantId, participant);

        // Track active speaker
        if (participant.isSpeaking) {
          setActiveSpeaker(participant.participantId);
        }

        // Track hand raised count
        const handRaised = Array.from(updated.values()).filter((p) => p.requestToSpeak).length;
        setHandRaisedCount(handRaised);

        return updated;
      });
    }, [conferenceId])
  );

  const getConnectionQualityColor = (quality: string) => {
    switch (quality) {
      case "excellent":
        return "text-green-500";
      case "good":
        return "text-blue-500";
      case "fair":
        return "text-yellow-500";
      case "poor":
        return "text-red-500";
      default:
        return "text-gray-500";
    }
  };

  const getConnectionQualityBg = (quality: string) => {
    switch (quality) {
      case "excellent":
        return "bg-green-500/10";
      case "good":
        return "bg-blue-500/10";
      case "fair":
        return "bg-yellow-500/10";
      case "poor":
        return "bg-red-500/10";
      default:
        return "bg-gray-500/10";
    }
  };

  const activeParticipants = Array.from(participants.values()).filter((p) => p.state === "active");
  const sortedParticipants = activeParticipants.sort((a, b) => {
    if (a.isSpeaking) return -1;
    if (b.isSpeaking) return 1;
    if (a.requestToSpeak) return -1;
    if (b.requestToSpeak) return 1;
    return 0;
  });

  return (
    <div className="space-y-4">
      {/* Header Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Total Participants</p>
              <p className="text-2xl font-bold">{participants.size}</p>
            </div>
            <Users className="h-8 w-8 text-blue-500/20" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Active</p>
              <p className="text-2xl font-bold">{activeParticipants.length}</p>
            </div>
            <Activity className="h-8 w-8 text-green-500/20" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Speaking</p>
              <p className="text-2xl font-bold">{activeParticipants.filter((p) => p.isSpeaking).length}</p>
            </div>
            <Mic className="h-8 w-8 text-red-500/20" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Hands Raised</p>
              <p className="text-2xl font-bold">{handRaisedCount}</p>
            </div>
            <Hand className="h-8 w-8 text-amber-500/20" />
          </div>
        </Card>
      </div>

      {/* Active Speaker Highlight */}
      {activeSpeaker !== null && (
        <Card className="p-4 border-primary/50 bg-primary/5">
          <div className="flex items-center gap-3">
            <div className="animate-pulse">
              <Mic className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Currently Speaking</p>
              <p className="font-semibold">
                {participants.get(activeSpeaker)?.name || `Participant ${activeSpeaker}`}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Participant List */}
      <Card className="p-4">
        <h3 className="font-semibold mb-4">Participants ({sortedParticipants.length})</h3>

        {sortedParticipants.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No active participants
          </p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {sortedParticipants.map((participant) => (
              <div
                key={participant.participantId}
                className={`p-3 rounded border transition-all ${
                  participant.isSpeaking
                    ? "border-red-500/50 bg-red-500/5"
                    : participant.requestToSpeak
                      ? "border-amber-500/50 bg-amber-500/5"
                      : "border-border"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    {/* Speaking/Muted Indicator */}
                    <div>
                      {participant.isSpeaking ? (
                        <Mic className="h-4 w-4 text-red-500 animate-pulse" />
                      ) : (
                        <MicOff className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>

                    {/* Participant Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{participant.name}</p>
                        {participant.requestToSpeak && (
                          <Hand className="h-3 w-3 text-amber-500" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {participant.state === "active" ? "Active" : "Idle"}
                      </p>
                    </div>
                  </div>

                  {/* Connection Quality */}
                  <div className="flex items-center gap-2">
                    <div
                      className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 ${getConnectionQualityBg(
                        participant.connectionQuality
                      )}`}
                    >
                      <Signal className={`h-3 w-3 ${getConnectionQualityColor(participant.connectionQuality)}`} />
                      <span className="capitalize">{participant.connectionQuality}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Hands Raised List */}
      {handRaisedCount > 0 && (
        <Card className="p-4 border-amber-500/30 bg-amber-500/5">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Hand className="h-4 w-4 text-amber-500" />
            Hands Raised ({handRaisedCount})
          </h3>
          <div className="space-y-2">
            {sortedParticipants
              .filter((p) => p.requestToSpeak)
              .map((participant) => (
                <div key={participant.participantId} className="p-2 bg-background rounded text-sm">
                  <p className="font-medium">{participant.name}</p>
                </div>
              ))}
          </div>
        </Card>
      )}
    </div>
  );
}
