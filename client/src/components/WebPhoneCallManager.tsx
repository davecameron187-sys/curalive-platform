/**
 * WebPhone Call Manager Component
 * Displays active WebPhone calls, participants, and call quality metrics
 * Provides controls for call routing and participant management
 */

import React, { useState, useEffect } from "react";
import { Phone, PhoneOff, Volume2, Mic, MicOff, Users, Signal, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export interface WebPhoneParticipant {
  id: string;
  name: string;
  phoneNumber?: string;
  joinedAt: Date;
  isMuted: boolean;
  audioLevel: number; // 0-100
  connectionQuality: "excellent" | "good" | "fair" | "poor";
}

export interface WebPhoneCall {
  id: string;
  sessionId: string;
  startedAt: Date;
  duration: number; // seconds
  participants: WebPhoneParticipant[];
  isActive: boolean;
  callQuality: "excellent" | "good" | "fair" | "poor";
  averageLatency: number; // ms
}

export interface WebPhoneCallManagerProps {
  sessionId: string;
  call?: WebPhoneCall;
  callData?: any; // Real call data from backend
  isLoading?: boolean;
  onEndCall?: () => void;
  onMuteParticipant?: (participantId: string) => void;
  onAdmitParticipant?: (participantId: string) => void;
  onRemoveParticipant?: (participantId: string) => void;
}

const ConnectionQualityBadge: React.FC<{ quality: string }> = ({ quality }) => {
  const colors: Record<string, string> = {
    excellent: "bg-green-500/20 text-green-700 border-green-200",
    good: "bg-blue-500/20 text-blue-700 border-blue-200",
    fair: "bg-yellow-500/20 text-yellow-700 border-yellow-200",
    poor: "bg-red-500/20 text-red-700 border-red-200",
  };

  const icons: Record<string, React.ReactNode> = {
    excellent: <CheckCircle className="w-3 h-3" />,
    good: <Signal className="w-3 h-3" />,
    fair: <AlertCircle className="w-3 h-3" />,
    poor: <AlertCircle className="w-3 h-3" />,
  };

  return (
    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border ${colors[quality] || colors.fair}`}>
      {icons[quality]}
      {quality.charAt(0).toUpperCase() + quality.slice(1)}
    </div>
  );
};

const ParticipantCard: React.FC<{
  participant: WebPhoneParticipant;
  onMute?: () => void;
  onRemove?: () => void;
}> = ({ participant, onMute, onRemove }) => {
  return (
    <div className="bg-card border border-border rounded-lg p-3 space-y-2">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="font-medium text-sm">{participant.name}</p>
          {participant.phoneNumber && (
            <p className="text-xs text-muted-foreground">{participant.phoneNumber}</p>
          )}
        </div>
        <ConnectionQualityBadge quality={participant.connectionQuality} />
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Audio Level</span>
          <span className="font-mono">{participant.audioLevel}%</span>
        </div>
        <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-primary h-full transition-all"
            style={{ width: `${participant.audioLevel}%` }}
          />
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <Button
          size="sm"
          variant="outline"
          className="flex-1"
          onClick={onMute}
        >
          {participant.isMuted ? (
            <>
              <MicOff className="w-3 h-3 mr-1" /> Unmute
            </>
          ) : (
            <>
              <Mic className="w-3 h-3 mr-1" /> Mute
            </>
          )}
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="flex-1 text-red-600 hover:text-red-700"
          onClick={onRemove}
        >
          <PhoneOff className="w-3 h-3 mr-1" /> Remove
        </Button>
      </div>
    </div>
  );
};

export const WebPhoneCallManager: React.FC<WebPhoneCallManagerProps> = ({
  sessionId,
  call,
  callData,
  isLoading,
  onEndCall,
  onMuteParticipant,
  onAdmitParticipant,
  onRemoveParticipant,
}) => {
  // Use real call data if available, otherwise use call prop
  const activeCall = callData || call;
  const [elapsedTime, setElapsedTime] = useState(0);

  // Update elapsed time every second
  useEffect(() => {
    if (!call?.isActive) return;

    const interval = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [call?.isActive]);

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  if (!activeCall) {
    return (
      <Card className="p-6 text-center">
        <Phone className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
        <p className="text-muted-foreground">No active WebPhone call</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Call Header */}
      <Card className="p-4 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
            <span className="font-semibold">WebPhone Call Active</span>
          </div>
          <div className="text-right">
            <div className="text-2xl font-mono font-bold">
              {formatDuration(call.duration + elapsedTime)}
            </div>
            <p className="text-xs text-muted-foreground">
              {call.participants.length} participant{call.participants.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">Call Quality</p>
            <ConnectionQualityBadge quality={call.callQuality} />
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">Latency</p>
            <p className="font-mono text-sm font-semibold">{call.averageLatency}ms</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">Participants</p>
            <div className="flex items-center justify-center gap-1">
              <Users className="w-4 h-4" />
              <span className="font-semibold">{call.participants.length}</span>
            </div>
          </div>
        </div>

        <Button
          variant="destructive"
          className="w-full"
          onClick={onEndCall}
          disabled={isLoading}
        >
          <PhoneOff className="w-4 h-4 mr-2" />
          End Call
        </Button>
      </Card>

      {/* Participants Section */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-4 h-4" />
          <h3 className="font-semibold">Participants</h3>
          <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded">
            {call.participants.length}
          </span>
        </div>

        {call.participants.length === 0 ? (
          <Card className="p-6 text-center">
            <p className="text-muted-foreground">No participants in this call</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {call.participants.map((participant) => (
              <ParticipantCard
                key={participant.id}
                participant={participant}
                onMute={() => onMuteParticipant?.(participant.id)}
                onRemove={() => onRemoveParticipant?.(participant.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Call Statistics */}
      <Card className="p-4 space-y-3">
        <h4 className="font-semibold text-sm">Call Statistics</h4>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-muted-foreground text-xs mb-1">Average Audio Level</p>
            <p className="font-semibold">
              {call.participants.length > 0
                ? Math.round(
                    call.participants.reduce((sum, p) => sum + p.audioLevel, 0) /
                      call.participants.length
                  )
                : 0}
              %
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs mb-1">Muted Participants</p>
            <p className="font-semibold">
              {call.participants.filter((p) => p.isMuted).length}/{call.participants.length}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs mb-1">Excellent Quality</p>
            <p className="font-semibold">
              {call.participants.filter((p) => p.connectionQuality === "excellent").length}/
              {call.participants.length}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs mb-1">Network Latency</p>
            <p className="font-semibold">{call.averageLatency}ms</p>
          </div>
        </div>
      </Card>

      {/* Auto-Admit Info */}
      <Card className="p-3 bg-blue-500/10 border-blue-200">
        <div className="flex gap-2">
          <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-blue-900">Auto-Admit Enabled</p>
            <p className="text-xs text-blue-700 mt-1">
              Participants can join directly without operator approval
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default WebPhoneCallManager;
