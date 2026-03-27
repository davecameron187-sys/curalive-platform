/**
 * Presenter Teleprompter — Live Transcript & Q&A Display
 * 
 * Task 1.8: Build teleprompter UI for speakers
 * - Display live transcript with auto-scroll
 * - Show approved Q&A questions
 * - Provide speaker notes and cues
 * - Large text for easy reading
 */

import { useEffect, useState, useRef } from "react";
import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Maximize2, Minimize2, Volume2, Clock, Users, AlertCircle } from "lucide-react";
import Ably from "ably";

interface TranscriptSegment {
  timestamp: string;
  speaker: string;
  text: string;
  sentiment?: "positive" | "neutral" | "negative";
}

interface ApprovedQuestion {
  id: string;
  askedBy: string;
  text: string;
  approvedAt: string;
  priority: "high" | "normal" | "low";
}

interface SpeakerCue {
  type: "time_warning" | "next_question" | "compliance_alert" | "engagement_low";
  message: string;
  timestamp: string;
}

export default function PresenterTeleprompter() {
  const { sessionId } = useParams<{ sessionId: string }>();

  // State management
  const [transcript, setTranscript] = useState<TranscriptSegment[]>([]);
  const [approvedQuestions, setApprovedQuestions] = useState<ApprovedQuestion[]>([]);
  const [speakerCues, setSpeakerCues] = useState<SpeakerCue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fontSize, setFontSize] = useState(24);
  const [darkMode, setDarkMode] = useState(true);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [attendeeCount, setAttendeeCount] = useState(0);
  const [ablyConnected, setAblyConnected] = useState(false);

  // Refs
  const ablyClientRef = useRef<Ably.Realtime | null>(null);
  const transcriptChannelRef = useRef<Ably.RealtimeChannel | null>(null);
  const qaChannelRef = useRef<Ably.RealtimeChannel | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // tRPC queries
  const getSessionState = trpc.sessionStateMachine.getSessionState.useQuery(
    { sessionId: sessionId || "" },
    { enabled: !!sessionId }
  );

  // Mock approved questions - will be replaced with actual tRPC query
  // const getApprovedQuestions = trpc.qa.getApprovedQuestions.useQuery(
  //   { sessionId: sessionId || "" },
  //   { enabled: !!sessionId }
  // );

  // Initialize Ably
  useEffect(() => {
    const initAbly = async () => {
      try {
        const ablyClient = new Ably.Realtime({
          authUrl: "/api/ably-auth",
          autoConnect: true,
        });

        ablyClientRef.current = ablyClient;

        // Subscribe to transcript updates
        const transcriptChannel = ablyClient.channels.get(`session:${sessionId}:transcript`);
        transcriptChannelRef.current = transcriptChannel;

        transcriptChannel.subscribe("segment.added", (message) => {
          const segment = message.data as TranscriptSegment;
          setTranscript((prev) => [...prev, segment]);
        });

        // Subscribe to Q&A updates
        const qaChannel = ablyClient.channels.get(`session:${sessionId}:qa`);
        qaChannelRef.current = qaChannel;

        qaChannel.subscribe("question.approved", (message) => {
          const question = message.data as ApprovedQuestion;
          setApprovedQuestions((prev) => [...prev, question]);
        });

        qaChannel.subscribe("cue.added", (message) => {
          const cue = message.data as SpeakerCue;
          setSpeakerCues((prev) => [...prev, cue]);
          // Auto-remove cue after 5 seconds
          setTimeout(() => {
            setSpeakerCues((prev) => prev.filter((c) => c.timestamp !== cue.timestamp));
          }, 5000);
        });

        setAblyConnected(ablyClient.connection.state === "connected");
        ablyClient.connection.on((stateChange) => {
          setAblyConnected(stateChange.current === "connected");
        });
      } catch (err) {
        console.error("[PresenterTeleprompter] Ably initialization error:", err);
      }
    };

    if (sessionId) {
      initAbly();
    }

    return () => {
      if (transcriptChannelRef.current) transcriptChannelRef.current.unsubscribe();
      if (qaChannelRef.current) qaChannelRef.current.unsubscribe();
      if (ablyClientRef.current) ablyClientRef.current.close();
    };
  }, [sessionId]);

  // Auto-scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript]);

  // Update approved questions (placeholder)
  // useEffect(() => {
  //   if (getApprovedQuestions.data) {
  //     setApprovedQuestions(getApprovedQuestions.data);
  //   }
  // }, [getApprovedQuestions.data]);

  // Timer
  useEffect(() => {
    if (getSessionState.data?.status === "running" && getSessionState.data?.startedAt) {
      timerRef.current = setInterval(() => {
        const now = Date.now();
        const elapsed = Math.floor(
          (now - getSessionState.data!.startedAt!) / 1000
        ) - getSessionState.data!.totalPausedDuration;
        setElapsedTime(elapsed);
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [getSessionState.data?.status, getSessionState.data?.startedAt]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const getSentimentColor = (sentiment?: string) => {
    switch (sentiment) {
      case "positive":
        return "text-green-400";
      case "negative":
        return "text-red-400";
      default:
        return "text-gray-300";
    }
  };

  if (!sessionId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <AlertCircle className="w-12 h-12 text-red-500 mr-4" />
        <p className="text-lg">Session ID not found</p>
      </div>
    );
  }

  if (isLoading && !transcript.length) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-12 h-12 animate-spin" />
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen transition-colors ${
        darkMode ? "bg-black text-white" : "bg-white text-black"
      }`}
    >
      {/* Header Controls */}
      <div className={`sticky top-0 z-50 p-4 border-b ${darkMode ? "border-gray-800" : "border-gray-200"}`}>
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              <span className="text-2xl font-mono font-bold">{formatTime(elapsedTime)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              <span>{attendeeCount} attending</span>
            </div>
            {!ablyConnected && (
              <Badge variant="destructive" className="flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Offline
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Button
                onClick={() => setFontSize(Math.max(16, fontSize - 2))}
                variant="outline"
                size="sm"
              >
                A-
              </Button>
              <span className="w-12 text-center">{fontSize}px</span>
              <Button
                onClick={() => setFontSize(Math.min(48, fontSize + 2))}
                variant="outline"
                size="sm"
              >
                A+
              </Button>
            </div>

            <Button
              onClick={() => setDarkMode(!darkMode)}
              variant="outline"
              size="sm"
            >
              {darkMode ? "☀️" : "🌙"}
            </Button>

            <Button
              onClick={() => setIsFullscreen(!isFullscreen)}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              {isFullscreen ? (
                <>
                  <Minimize2 className="w-4 h-4" />
                  Exit Fullscreen
                </>
              ) : (
                <>
                  <Maximize2 className="w-4 h-4" />
                  Fullscreen
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Speaker Cues */}
      {speakerCues.length > 0 && (
        <div className="fixed top-20 right-4 z-40 space-y-2 max-w-sm">
          {speakerCues.map((cue) => (
            <Card
              key={cue.timestamp}
              className={`p-4 border-l-4 ${
                cue.type === "compliance_alert"
                  ? "border-red-500 bg-red-900/20"
                  : cue.type === "time_warning"
                  ? "border-yellow-500 bg-yellow-900/20"
                  : "border-blue-500 bg-blue-900/20"
              }`}
            >
              <p className="font-semibold">{cue.message}</p>
            </Card>
          ))}
        </div>
      )}

      <div className="max-w-6xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Transcript */}
        <div className="lg:col-span-2">
          <Card className={`p-8 min-h-[600px] ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>
            <div
              className="space-y-4 overflow-y-auto max-h-[600px]"
              style={{ fontSize: `${fontSize}px`, lineHeight: "1.8" }}
            >
              {transcript.length === 0 ? (
                <p className="text-center text-gray-500">Waiting for transcript...</p>
              ) : (
                transcript.map((segment, idx) => (
                  <div key={idx} className="mb-6">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-bold text-primary">{segment.speaker}</span>
                      <span className={`text-sm ${getSentimentColor(segment.sentiment)}`}>
                        {segment.sentiment?.toUpperCase()}
                      </span>
                      <span className="text-xs text-gray-500">{segment.timestamp}</span>
                    </div>
                    <p className="leading-relaxed">{segment.text}</p>
                  </div>
                ))
              )}
              <div ref={transcriptEndRef} />
            </div>
          </Card>
        </div>

        {/* Q&A Panel */}
        <div className="lg:col-span-1 space-y-4">
          {/* Session Info */}
          <Card className="p-4">
            <h3 className="font-semibold mb-3">Session Info</h3>
            <div className="space-y-2 text-sm">
              <div>
                <p className="text-gray-500">Status</p>
                <p className="font-mono">{getSessionState.data?.status}</p>
              </div>
              <div>
                <p className="text-gray-500">Session ID</p>
                <p className="font-mono text-xs">{sessionId}</p>
              </div>
            </div>
          </Card>

          {/* Approved Questions */}
          <Card className="p-4">
            <h3 className="font-semibold mb-3">Approved Q&A ({approvedQuestions.length})</h3>
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {approvedQuestions.length === 0 ? (
                <p className="text-center text-gray-500 text-sm">No approved questions yet</p>
              ) : (
                approvedQuestions.map((q) => (
                  <div
                    key={q.id}
                    className={`p-3 rounded-lg border-l-4 ${
                      q.priority === "high"
                        ? "border-red-500 bg-red-900/10"
                        : q.priority === "normal"
                        ? "border-blue-500 bg-blue-900/10"
                        : "border-gray-500 bg-gray-900/10"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <p className="text-xs text-gray-500">From: {q.askedBy}</p>
                      <Badge variant="outline">
                        {q.priority}
                      </Badge>
                    </div>
                    <p className="text-sm leading-relaxed">{q.text}</p>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Speaker Notes */}
          <Card className="p-4">
            <h3 className="font-semibold mb-3">Speaker Notes</h3>
            <div className="space-y-2 text-sm text-gray-500">
              <p>• Speak clearly and maintain eye contact</p>
              <p>• Pause between questions for clarity</p>
              <p>• Check approved Q&A regularly</p>
              <p>• Watch for compliance alerts</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
