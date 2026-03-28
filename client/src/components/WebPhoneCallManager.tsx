import React, { useState } from "react";
import { Mic, MicOff, X, Signal, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Participant {
  id: string;
  name: string;
  status: "speaking" | "muted" | "idle";
  quality: "excellent" | "good" | "fair" | "poor";
  isMuted: boolean;
}

interface WebPhoneCallManagerProps {
  sessionId: string;
}

export function WebPhoneCallManager({ sessionId }: WebPhoneCallManagerProps) {
  const [participants, setParticipants] = useState<Participant[]>([
    { id: "p1", name: "John Smith (CFO)", status: "speaking", quality: "excellent", isMuted: false },
    { id: "p2", name: "Jane Doe (CEO)", status: "idle", quality: "excellent", isMuted: false },
    { id: "p3", name: "Michael Chen (Analyst)", status: "muted", quality: "good", isMuted: true },
    { id: "p4", name: "Sarah Johnson (Investor)", status: "idle", quality: "good", isMuted: false },
    { id: "p5", name: "David Lee (Operator)", status: "idle", quality: "excellent", isMuted: true },
  ]);

  const handleMute = (id: string) => {
    setParticipants(prev =>
      prev.map(p =>
        p.id === id ? { ...p, isMuted: !p.isMuted, status: !p.isMuted ? "muted" : "idle" } : p
      )
    );
  };

  const handleRemove = (id: string) => {
    setParticipants(prev => prev.filter(p => p.id !== id));
  };

  const getQualityColor = (quality: string) => {
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "speaking":
        return <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs font-semibold rounded">Speaking</span>;
      case "muted":
        return <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs font-semibold rounded">Muted</span>;
      case "idle":
        return <span className="px-2 py-1 bg-gray-500/20 text-gray-400 text-xs font-semibold rounded">Idle</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 text-sm mb-4">
        <div className="bg-card border border-border rounded-lg p-3">
          <p className="text-muted-foreground text-xs">Latency</p>
          <p className="font-bold text-lg">45ms</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-3">
          <p className="text-muted-foreground text-xs">Quality</p>
          <p className="font-bold text-lg text-green-500">Excellent</p>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold">Participants ({participants.length})</h3>
        <div className="space-y-2 max-h-96 overflow-auto">
          {participants.map((participant) => (
            <div key={participant.id} className="flex items-center justify-between p-3 bg-card border border-border rounded-lg">
              <div className="flex-1">
                <p className="font-medium text-sm">{participant.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  {getStatusBadge(participant.status)}
                  <span className={`text-xs font-semibold ${getQualityColor(participant.quality)}`}>
                    <Signal className="w-3 h-3 inline mr-1" />
                    {participant.quality}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 w-8 p-0"
                  onClick={() => handleMute(participant.id)}
                >
                  {participant.isMuted ? (
                    <MicOff className="w-4 h-4 text-red-500" />
                  ) : (
                    <Mic className="w-4 h-4 text-green-500" />
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 w-8 p-0 text-red-500 hover:bg-red-500/10"
                  onClick={() => handleRemove(participant.id)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
