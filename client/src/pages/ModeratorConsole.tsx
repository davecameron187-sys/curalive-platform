/**
 * Moderator Console — Real-Time Session Management
 * 
 * Task 1.5: Build React component with Ably subscriptions
 * - Subscribe to session state changes (idle/running/paused/ended)
 * - Subscribe to operator action events
 * - Display real-time session status and action history
 * - Provide controls to pause/resume/end session
 * - Show operator action history with pagination
 */

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Play, Pause, X, CheckCircle, XCircle, Flag, AlertCircle } from "lucide-react";
import Ably from "ably";

type SessionStatus = "idle" | "running" | "paused" | "ended";

interface SessionState {
  sessionId: string;
  eventId: string;
  operatorId: number;
  status: SessionStatus;
  startedAt: number | null;
  pausedAt: number | null;
  resumedAt: number | null;
  endedAt: number | null;
  totalPausedDuration: number;
  elapsedSeconds: number;
}

interface OperatorAction {
  id: number;
  actionType: string;
  targetId: string | null;
  targetType: string | null;
  metadata: any;
  createdAt: number;
}

interface StateTransitionEvent {
  sessionId: string;
  fromState: SessionStatus;
  toState: SessionStatus;
  timestamp: string;
  metadata: Record<string, any> | null;
}

interface ActionEvent {
  sessionId: string;
  actionType: string;
  timestamp: string;
  metadata: Record<string, any> | null;
}

export default function ModeratorConsole() {
  const { sessionId } = useParams<{ sessionId: string }>();
  
  // State management
  const [sessionState, setSessionState] = useState<SessionState | null>(null);
  const [actionHistory, setActionHistory] = useState<OperatorAction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [ablyConnected, setAblyConnected] = useState(false);
  const [actionHistoryPage, setActionHistoryPage] = useState(0);
  
  // Ably subscriptions
  const ablyClientRef = useRef<Ably.Realtime | null>(null);
  const stateChannelRef = useRef<Ably.RealtimeChannel | null>(null);
  const actionChannelRef = useRef<Ably.RealtimeChannel | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // tRPC queries and mutations
  const getSessionState = trpc.sessionStateMachine.getSessionState.useQuery(
    { sessionId: sessionId || "" },
    { enabled: !!sessionId }
  );

  const getActionHistory = trpc.sessionStateMachine.getSessionActionHistory.useQuery(
    { sessionId: sessionId || "", limit: 20, offset: actionHistoryPage * 20 },
    { enabled: !!sessionId }
  );

  const startSessionMutation = trpc.sessionStateMachine.startSession.useMutation();
  const pauseSessionMutation = trpc.sessionStateMachine.pauseSession.useMutation();
  const resumeSessionMutation = trpc.sessionStateMachine.resumeSession.useMutation();
  const endSessionMutation = trpc.sessionStateMachine.endSession.useMutation();
  const createActionMutation = trpc.sessionStateMachine.createOperatorAction.useMutation();

  // Initialize Ably client
  useEffect(() => {
    const initAbly = async () => {
      try {
        const ablyClient = new Ably.Realtime({
          authUrl: "/api/ably-auth",
          autoConnect: true,
        });

        ablyClientRef.current = ablyClient;

        // Subscribe to state changes
        const stateChannel = ablyClient.channels.get(`session:${sessionId}:state`);
        stateChannelRef.current = stateChannel;

        stateChannel.subscribe("state.changed", (message) => {
          const event = message.data as StateTransitionEvent;
          console.log("[ModeratorConsole] State transition:", event);
          
          // Refresh session state
          getSessionState.refetch();
        });

        // Subscribe to action events
        const actionChannel = ablyClient.channels.get(`session:${sessionId}:actions`);
        actionChannelRef.current = actionChannel;

        actionChannel.subscribe("action.created", (message) => {
          const event = message.data as ActionEvent;
          console.log("[ModeratorConsole] Action created:", event);
          
          // Refresh action history
          getActionHistory.refetch();
        });

        // Listen for connection state changes
        ablyClient.connection.on((stateChange) => {
          console.log("[Ably] Connection state:", stateChange.current);
          setAblyConnected(stateChange.current === "connected");
        });

        setAblyConnected(ablyClient.connection.state === "connected");
      } catch (err) {
        console.error("[ModeratorConsole] Ably initialization error:", err);
        setError("Failed to initialize real-time connection");
      }
    };

    if (sessionId) {
      initAbly();
    }

    return () => {
      // Cleanup Ably subscriptions
      if (stateChannelRef.current) {
        stateChannelRef.current.unsubscribe();
      }
      if (actionChannelRef.current) {
        actionChannelRef.current.unsubscribe();
      }
      if (ablyClientRef.current) {
        ablyClientRef.current.close();
      }
    };
  }, [sessionId]);

  // Update session state
  useEffect(() => {
    if (getSessionState.data) {
      setSessionState(getSessionState.data);
    }
  }, [getSessionState.data]);

  // Update action history
  useEffect(() => {
    if (getActionHistory.data) {
      setActionHistory(getActionHistory.data.actions as OperatorAction[]);
    }
  }, [getActionHistory.data]);

  // Timer for elapsed time
  useEffect(() => {
    if (sessionState?.status === "running" && sessionState?.startedAt) {
      timerRef.current = setInterval(() => {
        const now = Date.now();
        const elapsed = Math.floor((now - sessionState.startedAt!) / 1000) - sessionState.totalPausedDuration;
        setElapsedTime(elapsed);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [sessionState?.status, sessionState?.startedAt, sessionState?.totalPausedDuration]);

  // Format time display
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  // Get status badge color
  const getStatusColor = (status: SessionStatus) => {
    switch (status) {
      case "idle":
        return "bg-gray-500";
      case "running":
        return "bg-green-500";
      case "paused":
        return "bg-yellow-500";
      case "ended":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  // Handle session control buttons
  const handleStartSession = async () => {
    try {
      setIsLoading(true);
      await startSessionMutation.mutateAsync({
        sessionId: sessionId || "",
        eventId: sessionState?.eventId || "",
      });
      await getSessionState.refetch();
    } catch (err) {
      setError("Failed to start session");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePauseSession = async () => {
    try {
      setIsLoading(true);
      await pauseSessionMutation.mutateAsync({ sessionId: sessionId || "" });
      await getSessionState.refetch();
    } catch (err) {
      setError("Failed to pause session");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResumeSession = async () => {
    try {
      setIsLoading(true);
      await resumeSessionMutation.mutateAsync({ sessionId: sessionId || "" });
      await getSessionState.refetch();
    } catch (err) {
      setError("Failed to resume session");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEndSession = async () => {
    if (!confirm("Are you sure you want to end this session?")) return;

    try {
      setIsLoading(true);
      await endSessionMutation.mutateAsync({ sessionId: sessionId || "" });
      await getSessionState.refetch();
    } catch (err) {
      setError("Failed to end session");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle operator actions
  const handleOperatorAction = async (actionType: string, targetId?: string) => {
    try {
      await createActionMutation.mutateAsync({
        sessionId: sessionId || "",
        actionType: actionType as any,
        targetId,
        targetType: "question",
        metadata: { createdAt: new Date().toISOString() },
      });
      await getActionHistory.refetch();
    } catch (err) {
      setError(`Failed to record action: ${actionType}`);
      console.error(err);
    }
  };

  if (!sessionId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-lg font-semibold">Session ID not found</p>
        </div>
      </div>
    );
  }

  if (isLoading && !sessionState) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Moderator Console</h1>
          <p className="text-muted-foreground">Session: {sessionId}</p>
        </div>

        {/* Error Alert */}
        {error && (
          <Card className="mb-6 p-4 bg-red-50 border-red-200">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <p className="text-red-700">{error}</p>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-500 hover:text-red-700"
              >
                ✕
              </button>
            </div>
          </Card>
        )}

        {/* Connection Status */}
        <div className="mb-6 flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${ablyConnected ? "bg-green-500" : "bg-red-500"}`} />
          <span className="text-sm text-muted-foreground">
            {ablyConnected ? "Connected to real-time updates" : "Disconnected from real-time updates"}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Session Status Card */}
          <Card className="lg:col-span-2 p-6">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Session Status</h2>
                <Badge className={`${getStatusColor(sessionState?.status || "idle")} text-white`}>
                  {sessionState?.status.toUpperCase()}
                </Badge>
              </div>

              {/* Timer */}
              <div className="text-4xl font-mono font-bold mb-6 text-center">
                {formatTime(elapsedTime)}
              </div>

              {/* Control Buttons */}
              <div className="flex flex-wrap gap-3">
                {sessionState?.status === "idle" && (
                  <Button
                    onClick={handleStartSession}
                    disabled={isLoading}
                    className="flex items-center gap-2"
                  >
                    <Play className="w-4 h-4" />
                    Start Session
                  </Button>
                )}

                {sessionState?.status === "running" && (
                  <>
                    <Button
                      onClick={handlePauseSession}
                      disabled={isLoading}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <Pause className="w-4 h-4" />
                      Pause
                    </Button>
                    <Button
                      onClick={handleEndSession}
                      disabled={isLoading}
                      variant="destructive"
                      className="flex items-center gap-2"
                    >
                      <X className="w-4 h-4" />
                      End Session
                    </Button>
                  </>
                )}

                {sessionState?.status === "paused" && (
                  <>
                    <Button
                      onClick={handleResumeSession}
                      disabled={isLoading}
                      className="flex items-center gap-2"
                    >
                      <Play className="w-4 h-4" />
                      Resume
                    </Button>
                    <Button
                      onClick={handleEndSession}
                      disabled={isLoading}
                      variant="destructive"
                      className="flex items-center gap-2"
                    >
                      <X className="w-4 h-4" />
                      End Session
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            {sessionState?.status === "running" && (
              <div className="border-t pt-6">
                <h3 className="font-semibold mb-4">Quick Actions</h3>
                <div className="flex flex-wrap gap-3">
                  <Button
                    onClick={() => handleOperatorAction("question_approved")}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Approve Q&A
                  </Button>
                  <Button
                    onClick={() => handleOperatorAction("question_rejected")}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <XCircle className="w-4 h-4 text-red-500" />
                    Reject Q&A
                  </Button>
                  <Button
                    onClick={() => handleOperatorAction("compliance_flag_raised")}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Flag className="w-4 h-4 text-yellow-500" />
                    Raise Flag
                  </Button>
                  <Button
                    onClick={() => handleOperatorAction("key_moment_marked")}
                    variant="outline"
                    size="sm"
                  >
                    Mark Key Moment
                  </Button>
                </div>
              </div>
            )}
          </Card>

          {/* Session Info */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Session Info</h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-muted-foreground">Event ID</p>
                <p className="font-mono">{sessionState?.eventId}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Operator ID</p>
                <p className="font-mono">{sessionState?.operatorId}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Started</p>
                <p>
                  {sessionState?.startedAt
                    ? new Date(sessionState.startedAt).toLocaleTimeString()
                    : "Not started"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Paused Duration</p>
                <p>{formatTime(sessionState?.totalPausedDuration || 0)}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Action History */}
        <Card className="mt-6 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Action History</h2>
            <span className="text-sm text-muted-foreground">
              {getActionHistory.data?.total || 0} actions
            </span>
          </div>

          {actionHistory.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No actions recorded yet</p>
          ) : (
            <div className="space-y-2">
              {actionHistory.map((action) => (
                <div
                  key={action.id}
                  className="flex items-center justify-between p-3 bg-secondary rounded-lg"
                >
                  <div>
                    <p className="font-medium">{action.actionType}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(action.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                  {action.targetId && (
                    <span className="text-sm bg-primary/10 text-primary px-2 py-1 rounded">
                      {action.targetId}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {getActionHistory.data && getActionHistory.data.total > 20 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <Button
                onClick={() => setActionHistoryPage(Math.max(0, actionHistoryPage - 1))}
                disabled={actionHistoryPage === 0}
                variant="outline"
                size="sm"
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {actionHistoryPage + 1} of{" "}
                {Math.ceil(getActionHistory.data.total / 20)}
              </span>
              <Button
                onClick={() => setActionHistoryPage(actionHistoryPage + 1)}
                disabled={
                  (actionHistoryPage + 1) * 20 >= getActionHistory.data.total
                }
                variant="outline"
                size="sm"
              >
                Next
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
