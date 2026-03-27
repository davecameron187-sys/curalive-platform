/**
 * Operator Console Dashboard — Session Management & Q&A Queue
 * 
 * Task 1.9: Build operator dashboard
 * - Session management controls
 * - Q&A queue with approval workflow
 * - Real-time metrics and alerts
 * - Compliance flag system
 */

import { useEffect, useState, useRef } from "react";
import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Play,
  Pause,
  RotateCcw,
  Square,
  CheckCircle,
  XCircle,
  AlertTriangle,
  TrendingUp,
  Users,
  MessageSquare,
  Clock,
  Loader2,
} from "lucide-react";
import Ably from "ably";

interface Question {
  id: string;
  askedBy: string;
  text: string;
  sentiment: "positive" | "neutral" | "negative";
  timestamp: string;
  status: "pending" | "approved" | "rejected";
}

interface SessionMetrics {
  totalQuestions: number;
  approvedQuestions: number;
  rejectedQuestions: number;
  sentimentScore: number;
  attendeeCount: number;
  engagementRate: number;
}

interface ComplianceFlag {
  id: string;
  type: string;
  severity: "low" | "medium" | "high";
  message: string;
  timestamp: string;
  resolved: boolean;
}

export default function OperatorDashboard() {
  const { sessionId } = useParams<{ sessionId: string }>();

  // State management
  const [sessionStatus, setSessionStatus] = useState<"idle" | "running" | "paused" | "ended">("idle");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [metrics, setMetrics] = useState<SessionMetrics>({
    totalQuestions: 0,
    approvedQuestions: 0,
    rejectedQuestions: 0,
    sentimentScore: 0,
    attendeeCount: 0,
    engagementRate: 0,
  });
  const [complianceFlags, setComplianceFlags] = useState<ComplianceFlag[]>([]);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [ablyConnected, setAblyConnected] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [operatorNote, setOperatorNote] = useState("");

  // Refs
  const ablyClientRef = useRef<Ably.Realtime | null>(null);
  const qaChannelRef = useRef<Ably.RealtimeChannel | null>(null);
  const metricsChannelRef = useRef<Ably.RealtimeChannel | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // tRPC queries
  const getSessionState = trpc.sessionStateMachine.getSessionState.useQuery(
    { sessionId: sessionId || "" },
    { enabled: !!sessionId }
  );

  // Session control mutations
  // const startSession = trpc.sessionStateMachine.startSession.useMutation();
  // const pauseSession = trpc.sessionStateMachine.pauseSession.useMutation();
  // const resumeSession = trpc.sessionStateMachine.resumeSession.useMutation();
  // const endSession = trpc.sessionStateMachine.endSession.useMutation();
  const approveQuestion = trpc.sessionStateMachine.createOperatorAction.useMutation();
  const rejectQuestion = trpc.sessionStateMachine.createOperatorAction.useMutation();

  // Initialize Ably
  useEffect(() => {
    const initAbly = async () => {
      try {
        const ablyClient = new Ably.Realtime({
          authUrl: "/api/ably-auth",
          autoConnect: true,
        });

        ablyClientRef.current = ablyClient;

        // Subscribe to Q&A updates
        const qaChannel = ablyClient.channels.get(`session:${sessionId}:qa`);
        qaChannelRef.current = qaChannel;

        qaChannel.subscribe("question.submitted", (message) => {
          const question = message.data as Question;
          setQuestions((prev) => [question, ...prev]);
        });

        qaChannel.subscribe("question.approved", (message) => {
          const questionId = message.data.questionId;
          setQuestions((prev) =>
            prev.map((q) =>
              q.id === questionId ? { ...q, status: "approved" } : q
            )
          );
        });

        qaChannel.subscribe("question.rejected", (message) => {
          const questionId = message.data.questionId;
          setQuestions((prev) =>
            prev.map((q) =>
              q.id === questionId ? { ...q, status: "rejected" } : q
            )
          );
        });

        // Subscribe to metrics updates
        const metricsChannel = ablyClient.channels.get(`session:${sessionId}:metrics`);
        metricsChannelRef.current = metricsChannel;

        metricsChannel.subscribe("metrics.updated", (message) => {
          setMetrics(message.data as SessionMetrics);
        });

        metricsChannel.subscribe("compliance.flag", (message) => {
          const flag = message.data as ComplianceFlag;
          setComplianceFlags((prev) => [flag, ...prev]);
        });

        setAblyConnected(ablyClient.connection.state === "connected");
        ablyClient.connection.on((stateChange) => {
          setAblyConnected(stateChange.current === "connected");
        });

        setIsLoading(false);
      } catch (err) {
        console.error("[OperatorDashboard] Ably initialization error:", err);
        setIsLoading(false);
      }
    };

    if (sessionId) {
      initAbly();
    }

    return () => {
      if (qaChannelRef.current) qaChannelRef.current.unsubscribe();
      if (metricsChannelRef.current) metricsChannelRef.current.unsubscribe();
      if (ablyClientRef.current) ablyClientRef.current.close();
    };
  }, [sessionId]);

  // Update session status
  useEffect(() => {
    if (getSessionState.data?.status) {
      setSessionStatus(getSessionState.data.status as any);
    }
  }, [getSessionState.data?.status]);

  // Timer
  useEffect(() => {
    if (sessionStatus === "running" && getSessionState.data?.startedAt) {
      timerRef.current = setInterval(() => {
        const now = Date.now();
        const elapsed = Math.floor(
          (now - getSessionState.data!.startedAt!) / 1000
        ) - (getSessionState.data!.totalPausedDuration || 0);
        setElapsedTime(elapsed);
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [sessionStatus, getSessionState.data?.startedAt]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const handleApproveQuestion = async (questionId: string) => {
    try {
      await approveQuestion.mutateAsync({
        sessionId: sessionId || "",
        actionType: "question_approved",
        targetId: questionId,
        targetType: "question",
        metadata: { operatorNote },
      });
      setOperatorNote("");
      setSelectedQuestion(null);
    } catch (err) {
      console.error("Error approving question:", err);
    }
  };

  const handleRejectQuestion = async (questionId: string) => {
    try {
      await rejectQuestion.mutateAsync({
        sessionId: sessionId || "",
        actionType: "question_rejected",
        targetId: questionId,
        targetType: "question",
        metadata: { operatorNote },
      });
      setOperatorNote("");
      setSelectedQuestion(null);
    } catch (err) {
      console.error("Error rejecting question:", err);
    }
  };

  const pendingQuestions = questions.filter((q) => q.status === "pending");
  const approvedCount = questions.filter((q) => q.status === "approved").length;
  const rejectedCount = questions.filter((q) => q.status === "rejected").length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-12 h-12 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold">Operator Dashboard</h1>
            {!ablyConnected && (
              <Badge variant="destructive" className="flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Offline
              </Badge>
            )}
          </div>

          {/* Session Controls */}
          <div className="flex items-center gap-2">
            <Button
              disabled={sessionStatus !== "idle"}
              className="flex items-center gap-2"
            >
              <Play className="w-4 h-4" />
              Start
            </Button>
            <Button
              disabled={sessionStatus !== "running"}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Pause className="w-4 h-4" />
              Pause
            </Button>
            <Button
              disabled={sessionStatus !== "paused"}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Resume
            </Button>
            <Button
              disabled={sessionStatus === "idle" || sessionStatus === "ended"}
              variant="destructive"
              className="flex items-center gap-2"
            >
              <Square className="w-4 h-4" />
              End
            </Button>

            <div className="ml-auto flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span className="font-mono font-bold">{formatTime(elapsedTime)}</span>
              </div>
              <Badge variant={sessionStatus === "running" ? "default" : "outline"}>
                {sessionStatus.toUpperCase()}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Q&A Queue */}
        <div className="lg:col-span-2 space-y-4">
          {/* Metrics Summary */}
          <div className="grid grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Q&A</p>
                  <p className="text-2xl font-bold">{metrics.totalQuestions}</p>
                </div>
                <MessageSquare className="w-8 h-8 text-blue-500 opacity-50" />
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Approved</p>
                  <p className="text-2xl font-bold text-green-500">{approvedCount}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500 opacity-50" />
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Rejected</p>
                  <p className="text-2xl font-bold text-red-500">{rejectedCount}</p>
                </div>
                <XCircle className="w-8 h-8 text-red-500 opacity-50" />
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Attendees</p>
                  <p className="text-2xl font-bold">{metrics.attendeeCount}</p>
                </div>
                <Users className="w-8 h-8 text-purple-500 opacity-50" />
              </div>
            </Card>
          </div>

          {/* Pending Questions */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Pending Questions ({pendingQuestions.length})</h2>
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {pendingQuestions.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No pending questions</p>
              ) : (
                pendingQuestions.map((q) => (
                  <div
                    key={q.id}
                    onClick={() => setSelectedQuestion(q)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedQuestion?.id === q.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold">{q.askedBy}</p>
                        <p className="text-xs text-muted-foreground">{q.timestamp}</p>
                      </div>
                      <Badge
                        variant={
                          q.sentiment === "positive"
                            ? "default"
                            : q.sentiment === "negative"
                            ? "destructive"
                            : "outline"
                        }
                      >
                        {q.sentiment}
                      </Badge>
                    </div>
                    <p className="text-sm leading-relaxed">{q.text}</p>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-4">
          {/* Question Details */}
          {selectedQuestion && (
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Question Details</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">From</p>
                  <p className="font-semibold">{selectedQuestion.askedBy}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Question</p>
                  <p className="text-sm leading-relaxed">{selectedQuestion.text}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Operator Note</p>
                  <Textarea
                    placeholder="Add a note before approving/rejecting..."
                    value={operatorNote}
                    onChange={(e) => setOperatorNote(e.target.value)}
                    className="min-h-24"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleApproveQuestion(selectedQuestion.id)}
                    className="flex-1 flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Approve
                  </Button>
                  <Button
                    onClick={() => handleRejectQuestion(selectedQuestion.id)}
                    variant="destructive"
                    className="flex-1 flex items-center justify-center gap-2"
                  >
                    <XCircle className="w-4 h-4" />
                    Reject
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Compliance Flags */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Compliance Flags ({complianceFlags.filter((f) => !f.resolved).length})
            </h3>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {complianceFlags.length === 0 ? (
                <p className="text-center text-muted-foreground text-sm py-4">No flags</p>
              ) : (
                complianceFlags
                  .filter((f) => !f.resolved)
                  .map((flag) => (
                    <div
                      key={flag.id}
                      className={`p-3 rounded-lg border-l-4 ${
                        flag.severity === "high"
                          ? "border-red-500 bg-red-900/10"
                          : flag.severity === "medium"
                          ? "border-yellow-500 bg-yellow-900/10"
                          : "border-blue-500 bg-blue-900/10"
                      }`}
                    >
                      <p className="text-xs font-semibold text-muted-foreground mb-1">
                        {flag.type}
                      </p>
                      <p className="text-sm">{flag.message}</p>
                    </div>
                  ))
              )}
            </div>
          </Card>

          {/* Sentiment Trend */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Sentiment Score
            </h3>
            <div className="text-center">
              <p className="text-4xl font-bold text-primary">{metrics.sentimentScore.toFixed(1)}</p>
              <p className="text-sm text-muted-foreground mt-2">Out of 10</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
