import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Mic, Square } from "lucide-react";

export interface RecallAiBotProps {
  conferenceId: string;
  onBotCreated?: (botId: string) => void;
  onBotStopped?: () => void;
}

export function RecallAiBot({
  conferenceId,
  onBotCreated,
  onBotStopped,
}: RecallAiBotProps) {
  const [botId, setBotId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [meetingUrl, setMeetingUrl] = useState("");
  const [botStatus, setBotStatus] = useState<
    "idle" | "connecting" | "connected" | "recording" | "stopped"
  >("idle");

  const handleStartTranscription = async () => {
    if (!meetingUrl) {
      alert("Please enter a meeting URL");
      return;
    }

    setIsLoading(true);
    try {
      // In production, this would call a tRPC procedure to create the bot
      // For now, simulate bot creation
      const newBotId = `bot_${conferenceId}_${Date.now()}`;
      setBotId(newBotId);
      setBotStatus("connecting");

      // Simulate connection
      setTimeout(() => {
        setBotStatus("connected");
        setTimeout(() => {
          setBotStatus("recording");
          onBotCreated?.(newBotId);
        }, 1000);
      }, 2000);
    } catch (error) {
      console.error("Error creating bot:", error);
      alert("Failed to create bot");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStopTranscription = async () => {
    if (!botId) return;

    setIsLoading(true);
    try {
      // In production, this would call a tRPC procedure to stop the bot
      setBotStatus("stopped");
      setBotId(null);
      setMeetingUrl("");
      onBotStopped?.();
    } catch (error) {
      console.error("Error stopping bot:", error);
      alert("Failed to stop bot");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = () => {
    switch (botStatus) {
      case "connecting":
        return "text-yellow-400";
      case "connected":
        return "text-blue-400";
      case "recording":
        return "text-red-400";
      case "stopped":
        return "text-gray-400";
      default:
        return "text-gray-400";
    }
  };

  const getStatusText = () => {
    switch (botStatus) {
      case "connecting":
        return "Connecting...";
      case "connected":
        return "Connected";
      case "recording":
        return "Recording";
      case "stopped":
        return "Stopped";
      default:
        return "Idle";
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Recall.ai Transcription</h3>
        <div className={`flex items-center gap-2 ${getStatusColor()}`}>
          <div className="w-2 h-2 rounded-full bg-current animate-pulse" />
          <span className="text-sm">{getStatusText()}</span>
        </div>
      </div>

      {!botId ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-300 mb-2">
              Meeting URL
            </label>
            <input
              type="text"
              value={meetingUrl}
              onChange={(e) => setMeetingUrl(e.target.value)}
              placeholder="https://zoom.us/j/123456789"
              className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              disabled={isLoading}
            />
          </div>

          <Button
            onClick={handleStartTranscription}
            disabled={isLoading || !meetingUrl}
            className="w-full bg-red-600 hover:bg-red-700 text-white"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Starting...
              </>
            ) : (
              <>
                <Mic className="w-4 h-4 mr-2" />
                Start Transcription
              </>
            )}
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-slate-800 rounded p-3">
            <p className="text-sm text-gray-300">
              <span className="font-semibold">Bot ID:</span> {botId}
            </p>
            <p className="text-sm text-gray-300 mt-1">
              <span className="font-semibold">Status:</span> {getStatusText()}
            </p>
          </div>

          <Button
            onClick={handleStopTranscription}
            disabled={isLoading}
            className="w-full bg-slate-700 hover:bg-slate-600 text-white"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Stopping...
              </>
            ) : (
              <>
                <Square className="w-4 h-4 mr-2" />
                Stop Transcription
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
