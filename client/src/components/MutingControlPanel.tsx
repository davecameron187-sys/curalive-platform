/**
 * Muting Control Panel Component
 * Allows operators to view speaker violations and manage muting
 */

import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertCircle, Volume2, VolumeX, Settings } from "lucide-react";

interface MutingControlPanelProps {
  eventId: string;
}

export function MutingControlPanel({ eventId }: MutingControlPanelProps) {
  const [selectedSpeaker, setSelectedSpeaker] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  // Fetch speaker violations
  const { data: violations, isLoading: violationsLoading } =
    trpc.aiAmPhase2.getSpeakerViolations.useQuery({ eventId });

  // Fetch muting statistics
  const { data: stats } = trpc.aiAmPhase2.getMutingStats.useQuery({ eventId });

  // Fetch muting configuration
  const { data: config } = trpc.aiAmPhase2.getMutingConfig.useQuery({ eventId });

  // Mutations
  const applyMuteMutation = trpc.aiAmPhase2.applyMute.useMutation();
  const removeMuteMutation = trpc.aiAmPhase2.removeMute.useMutation();

  const handleApplyMute = async (
    speakerId: string,
    speakerName: string,
    muteType: "soft" | "hard"
  ) => {
    try {
      await applyMuteMutation.mutateAsync({
        eventId,
        speakerId,
        speakerName,
        muteType,
      });
      // Refresh violations
      violations && setSelectedSpeaker(null);
    } catch (error) {
      console.error("Failed to apply mute:", error);
    }
  };

  const handleRemoveMute = async (speakerId: string, speakerName: string) => {
    try {
      await removeMuteMutation.mutateAsync({
        eventId,
        speakerId,
        speakerName,
      });
      // Refresh violations
      violations && setSelectedSpeaker(null);
    } catch (error) {
      console.error("Failed to remove mute:", error);
    }
  };

  if (violationsLoading) {
    return <div className="p-4">Loading muting controls...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Header with Statistics */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Total Speakers</div>
          <div className="text-2xl font-bold">{stats?.totalSpeakers || 0}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">With Violations</div>
          <div className="text-2xl font-bold text-yellow-500">
            {stats?.speakersWithViolations || 0}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Soft Muted</div>
          <div className="text-2xl font-bold text-orange-500">
            {stats?.softMutedCount || 0}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Hard Muted</div>
          <div className="text-2xl font-bold text-red-500">
            {stats?.hardMutedCount || 0}
          </div>
        </Card>
      </div>

      {/* Configuration Button */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Speaker Violations</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowSettings(!showSettings)}
          className="gap-2"
        >
          <Settings className="w-4 h-4" />
          Settings
        </Button>
      </div>

      {/* Muting Configuration */}
      {showSettings && config && (
        <Card className="p-4 bg-muted/50">
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Muting Enabled:</span>
              <span className="font-semibold">{config.enabled ? "Yes" : "No"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Soft Mute Threshold:</span>
              <span className="font-semibold">{config.softMuteThreshold} violations</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Hard Mute Threshold:</span>
              <span className="font-semibold">{config.hardMuteThreshold} violations</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Mute Duration:</span>
              <span className="font-semibold">{config.muteDuration}s</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Auto-Unmute After:</span>
              <span className="font-semibold">{config.autoUnmuteAfter}m</span>
            </div>
          </div>
        </Card>
      )}

      {/* Speaker Violations List */}
      <div className="space-y-2">
        {violations && violations.length > 0 ? (
          violations.map((speaker) => (
            <Card
              key={speaker.speakerId}
              className={`p-4 cursor-pointer transition-colors ${
                selectedSpeaker === speaker.speakerId
                  ? "border-primary bg-primary/5"
                  : "hover:bg-muted/50"
              }`}
              onClick={() =>
                setSelectedSpeaker(
                  selectedSpeaker === speaker.speakerId ? null : speaker.speakerId
                )
              }
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="font-semibold flex items-center gap-2">
                    {speaker.speakerName}
                    {speaker.violationCount >= (config?.hardMuteThreshold || 5) && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-500/10 text-red-600 text-xs font-medium">
                        <VolumeX className="w-3 h-3" />
                        Hard Muted
                      </span>
                    )}
                    {speaker.violationCount >= (config?.softMuteThreshold || 2) &&
                      speaker.violationCount < (config?.hardMuteThreshold || 5) && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-orange-500/10 text-orange-600 text-xs font-medium">
                          <AlertCircle className="w-3 h-3" />
                          Soft Muted
                        </span>
                      )}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {speaker.violationCount} violation
                    {speaker.violationCount !== 1 ? "s" : ""} in last 30 minutes
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Last violation:{" "}
                    {new Date(speaker.lastViolationTime).toLocaleTimeString()}
                  </div>
                </div>

                {/* Muting Controls */}
                {selectedSpeaker === speaker.speakerId && (
                  <div className="flex gap-2 ml-4">
                    {!speaker.isMuted && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleApplyMute(
                              speaker.speakerId,
                              speaker.speakerName,
                              "soft"
                            );
                          }}
                          disabled={applyMuteMutation.isPending}
                          className="gap-1"
                        >
                          <AlertCircle className="w-3 h-3" />
                          Soft Mute
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleApplyMute(
                              speaker.speakerId,
                              speaker.speakerName,
                              "hard"
                            );
                          }}
                          disabled={applyMuteMutation.isPending}
                          className="gap-1"
                        >
                          <VolumeX className="w-3 h-3" />
                          Hard Mute
                        </Button>
                      </>
                    )}
                    {speaker.isMuted && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveMute(
                            speaker.speakerId,
                            speaker.speakerName
                          );
                        }}
                        disabled={removeMuteMutation.isPending}
                        className="gap-1"
                      >
                        <Volume2 className="w-3 h-3" />
                        Unmute
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </Card>
          ))
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No violations detected
          </div>
        )}
      </div>
    </div>
  );
}

export default MutingControlPanel;
