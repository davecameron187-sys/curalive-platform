/**
 * CuraLive Operator Console — Enhanced Version
 * Phase 1: Lock Core Operator Console with Viasocket Sync
 *
 * Core Modules:
 * - Transcript Panel: Real-time transcription feed
 * - Intelligence Panel: Sentiment, compliance, risk, engagement signals
 * - Session Controls: Start/pause/resume/end state machine
 * - Live Q&A Tab: Question moderation and speaker workflow
 * - Operator Notes: Timestamped action logging with Viasocket sync
 * - Archive Handoff: Post-event transcript, report, downloads
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Play,
  Pause,
  RotateCcw,
  Square,
  MessageSquare,
  TrendingUp,
  AlertCircle,
  Users,
  Clock,
  CheckCircle,
  Loader2,
  Download,
  FileText,
  Settings,
  MoreVertical,
  Send,
  ThumbsUp,
  X,
  AlertTriangle,
  Eye,
  EyeOff,
  Zap,
} from "lucide-react";

interface SessionState {
  status: "idle" | "running" | "paused" | "ended";
  startTime: number | null;
  pausedTime: number | null;
  endTime: number | null;
}

interface TranscriptSegment {
  id: string;
  speaker: string;
  text: string;
  timestamp: number;
  confidence?: number;
}

interface IntelligenceSignals {
  sentiment: number; // 0-1
  complianceRisk: number; // 0-1
  engagementScore: number; // 0-1
  questionsCount: number;
  upvotesTotal: number;
  lastUpdate: number;
}

interface OperatorNote {
  id: string;
  timestamp: number;
  text: string;
  action?: string;
  synced?: boolean;
}

interface Question {
  id: number;
  questionText: string;
  submitterName: string | null;
  status: string;
  upvotes: number | null;
  complianceRiskScore: number | null;
  triageScore: number | null;
  priorityScore: number | null;
  isAnswered: boolean;
  questionCategory: string | null;
}

export default function OperatorConsoleEnhanced() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { user } = useAuth();

  // Session state
  const [sessionState, setSessionState] = useState<SessionState>({
    status: "idle",
    startTime: null,
    pausedTime: null,
    endTime: null,
  });

  // UI state
  const [activeTab, setActiveTab] = useState<"transcript" | "qa" | "notes" | "archive">("transcript");
  const [elapsedTime, setElapsedTime] = useState(0);
  const [transcript, setTranscript] = useState<TranscriptSegment[]>([]);
  const [intelligence, setIntelligence] = useState<IntelligenceSignals>({
    sentiment: 0.65,
    complianceRisk: 0.2,
    engagementScore: 0.75,
    questionsCount: 0,
    upvotesTotal: 0,
    lastUpdate: Date.now(),
  });
  const [operatorNotes, setOperatorNotes] = useState<OperatorNote[]>([]);
  const [noteText, setNoteText] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [showArchivePanel, setShowArchivePanel] = useState(false);
  const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "synced" | "error">("idle");
  const [showSyncIndicator, setShowSyncIndicator] = useState(false);

  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch questions
  const { data: questionsData, isLoading: questionsLoading } =
    trpc.liveQa.getQuestions.useQuery(
      { sessionId: sessionId || "" },
      { enabled: !!sessionId, refetchInterval: 1000 }
    );

  // Mutations
  const approveQuestionMutation = trpc.liveQa.approveQuestion.useMutation();
  const rejectQuestionMutation = trpc.liveQa.rejectQuestion.useMutation();
  const syncSessionEventMutation = trpc.viasocketSync.syncSessionEvent.useMutation();
  const syncQuestionActionMutation = trpc.viasocketSync.syncQuestionAction.useMutation();
  const syncOperatorNoteMutation = trpc.viasocketSync.syncOperatorNote.useMutation();

  // Auto-scroll transcript to bottom
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript]);

  // Update questions
  useEffect(() => {
    if (questionsData) {
      setQuestions(questionsData);

      // Update intelligence signals
      const totalUpvotes = questionsData.reduce((sum, q) => sum + (q.upvotes || 0), 0);
      setIntelligence((prev) => ({
        ...prev,
        questionsCount: questionsData.length,
        upvotesTotal: totalUpvotes,
        lastUpdate: Date.now(),
      }));
    }
  }, [questionsData]);

  // Timer for elapsed time
  useEffect(() => {
    if (sessionState.status === "running") {
      timerRef.current = setInterval(() => {
        if (sessionState.startTime) {
          const now = Date.now();
          const elapsed = Math.floor((now - sessionState.startTime) / 1000);
          setElapsedTime(elapsed);
        }
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [sessionState.status, sessionState.startTime]);

  // Show sync indicator temporarily
  useEffect(() => {
    if (syncStatus !== "idle") {
      setShowSyncIndicator(true);
      const timer = setTimeout(() => {
        if (syncStatus === "synced") {
          setShowSyncIndicator(false);
        }
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [syncStatus]);

  // Session control handlers with Viasocket sync
  const handleStartSession = useCallback(async () => {
    const now = Date.now();
    setSessionState({
      status: "running",
      startTime: now,
      pausedTime: null,
      endTime: null,
    });
    await addOperatorNote("Session started", "start");

    // Sync to Viasocket
    try {
      setSyncStatus("syncing");
      await syncSessionEventMutation.mutateAsync({
        eventType: "session.started",
        sessionId: sessionId || "",
        eventId: `evt_${Date.now()}`,
          operatorId: (user?.id?.toString() || "") as string,
      });
      setSyncStatus("synced");
    } catch (error) {
      console.error("Failed to sync session start:", error);
      setSyncStatus("error");
    }
  }, [sessionId, user?.id, syncSessionEventMutation]);

  const handlePauseSession = useCallback(async () => {
    setSessionState((prev) => ({
      ...prev,
      status: "paused",
      pausedTime: Date.now(),
    }));
    await addOperatorNote("Session paused", "pause");

    // Sync to Viasocket
    try {
      setSyncStatus("syncing");
      await syncSessionEventMutation.mutateAsync({
        eventType: "session.paused",
        sessionId: sessionId || "",
        eventId: `evt_${Date.now()}`,
        operatorId: (user?.id?.toString() || "") as string,
      });
      setSyncStatus("synced");
    } catch (error) {
      console.error("Failed to sync session pause:", error);
      setSyncStatus("error");
    }
  }, [sessionId, user?.id, syncSessionEventMutation]);

  const handleResumeSession = useCallback(async () => {
    if (sessionState.pausedTime && sessionState.startTime) {
      const pauseDuration = sessionState.pausedTime - sessionState.startTime;
      setSessionState((prev) => ({
        ...prev,
        status: "running",
        startTime: Date.now() - pauseDuration,
        pausedTime: null,
      }));
      await addOperatorNote("Session resumed", "resume");

      // Sync to Viasocket
      try {
        setSyncStatus("syncing");
        await syncSessionEventMutation.mutateAsync({
          eventType: "session.resumed",
          sessionId: sessionId || "",
          eventId: `evt_${Date.now()}`,
          operatorId: (user?.id?.toString() || "") as string,
        });
        setSyncStatus("synced");
      } catch (error) {
        console.error("Failed to sync session resume:", error);
        setSyncStatus("error");
      }
    }
  }, [sessionState.pausedTime, sessionState.startTime, sessionId, user?.id, syncSessionEventMutation]);

  const handleEndSession = useCallback(async () => {
    setSessionState((prev) => ({
      ...prev,
      status: "ended",
      endTime: Date.now(),
    }));
    await addOperatorNote("Session ended", "end");
    setShowArchivePanel(true);

    // Sync to Viasocket
    try {
      setSyncStatus("syncing");
      await syncSessionEventMutation.mutateAsync({
        eventType: "session.ended",
        sessionId: sessionId || "",
        eventId: `evt_${Date.now()}`,
        operatorId: (user?.id?.toString() || "") as string,
      });
      setSyncStatus("synced");
    } catch (error) {
      console.error("Failed to sync session end:", error);
      setSyncStatus("error");
    }
  }, [sessionId, user?.id, elapsedTime, questions.length, syncSessionEventMutation]);

  const addOperatorNote = useCallback(
    async (text: string, action?: string) => {
      const newNote: OperatorNote = {
        id: `note-${Date.now()}`,
        timestamp: Date.now(),
        text,
        action,
        synced: false,
      };
      setOperatorNotes((prev) => [newNote, ...prev]);

      // Sync to Viasocket
      try {
        await syncOperatorNoteMutation.mutateAsync({
          noteId: newNote.id,
          sessionId: sessionId || "",
          operatorId: (user?.id?.toString() || "") as string,
          noteText: text,
          tags: action ? [action] : [],
        });

        // Mark as synced
        setOperatorNotes((prev) =>
          prev.map((n) => (n.id === newNote.id ? { ...n, synced: true } : n))
        );
      } catch (error) {
        console.error("Failed to sync operator note:", error);
      }
    },
    [sessionId, user?.id, syncOperatorNoteMutation]
  );

  const handleAddNote = useCallback(async () => {
    if (noteText.trim()) {
      await addOperatorNote(noteText);
      setNoteText("");
    }
  }, [noteText, addOperatorNote]);

  const handleApproveQuestion = useCallback(
    async (questionId: number) => {
      try {
        setSyncStatus("syncing");
        await approveQuestionMutation.mutateAsync({
          questionId,
          triageScore: 0.75,
          complianceRiskScore: 0.3,
        });

        // Sync to Viasocket
        await syncQuestionActionMutation.mutateAsync({
          questionId: questionId.toString(),
          sessionId: sessionId || "",
          action: "approved",
          operatorId: (user?.id?.toString() || "") as string,
        });

        await addOperatorNote(`Approved question #${questionId}`, "approve");
        setSyncStatus("synced");
        setSelectedQuestion(null);
      } catch (error) {
        console.error("Failed to approve:", error);
        setSyncStatus("error");
      }
    },
    [
      approveQuestionMutation,
      syncQuestionActionMutation,
      sessionId,
      user?.id,
      addOperatorNote,
    ]
  );

  const handleRejectQuestion = useCallback(
    async (questionId: number, reason: string) => {
      try {
        setSyncStatus("syncing");
        await rejectQuestionMutation.mutateAsync({
          questionId,
          reason,
        });

        // Sync to Viasocket
        await syncQuestionActionMutation.mutateAsync({
          questionId: questionId.toString(),
          sessionId: sessionId || "",
          action: "rejected",
          operatorId: (user?.id?.toString() || "") as string,
          reason,
        });

        await addOperatorNote(`Rejected question #${questionId}: ${reason}`, "reject");
        setSyncStatus("synced");
        setSelectedQuestion(null);
      } catch (error) {
        console.error("Failed to reject:", error);
        setSyncStatus("error");
      }
    },
    [
      rejectQuestionMutation,
      syncQuestionActionMutation,
      sessionId,
      user?.id,
      addOperatorNote,
    ]
  );

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getSessionStatusColor = () => {
    switch (sessionState.status) {
      case "running":
        return "bg-red-100 text-red-800 border-red-300";
      case "paused":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "ended":
        return "bg-gray-100 text-gray-800 border-gray-300";
      default:
        return "bg-slate-100 text-slate-800 border-slate-300";
    }
  };

  const getSentimentColor = (score: number) => {
    if (score > 0.7) return "text-green-600";
    if (score > 0.4) return "text-yellow-600";
    return "text-red-600";
  };

  const getRiskBadgeColor = (score: number) => {
    if (score > 0.7) return "bg-red-100 text-red-800";
    if (score > 0.4) return "bg-yellow-100 text-yellow-800";
    return "bg-green-100 text-green-800";
  };

  const getPendingQuestions = () => questions.filter((q) => q.status === "pending");
  const getApprovedQuestions = () => questions.filter((q) => q.status === "approved");
  const getRejectedQuestions = () => questions.filter((q) => q.status === "rejected");

  const getQATabContent = () => {
    if (questionsLoading) {
      return (
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      );
    }

    const pending = getPendingQuestions();
    const approved = getApprovedQuestions();
    const rejected = getRejectedQuestions();

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <Card className="p-4 bg-amber-50 border-amber-200">
            <div className="text-sm font-semibold text-amber-700">Pending</div>
            <div className="text-2xl font-bold text-amber-600">{pending.length}</div>
          </Card>
          <Card className="p-4 bg-green-50 border-green-200">
            <div className="text-sm font-semibold text-green-700">Approved</div>
            <div className="text-2xl font-bold text-green-600">{approved.length}</div>
          </Card>
          <Card className="p-4 bg-red-50 border-red-200">
            <div className="text-sm font-semibold text-red-700">Rejected</div>
            <div className="text-2xl font-bold text-red-600">{rejected.length}</div>
          </Card>
        </div>

        {selectedQuestion ? (
          <Card className="p-4 border-primary">
            <div className="flex items-start justify-between mb-4">
              <h3 className="font-semibold">Question Details</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedQuestion(null)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Question</p>
                <p className="text-sm">{selectedQuestion.questionText}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Submitter</p>
                  <p className="text-sm">{selectedQuestion.submitterName || "Anonymous"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Upvotes</p>
                  <p className="text-sm">{selectedQuestion.upvotes || 0}</p>
                </div>
              </div>

              {selectedQuestion.complianceRiskScore && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Compliance Risk
                  </p>
                  <div
                    className={`inline-block px-2 py-1 rounded text-xs font-semibold ${getRiskBadgeColor(
                      selectedQuestion.complianceRiskScore
                    )}`}
                  >
                    {(selectedQuestion.complianceRiskScore * 100).toFixed(0)}%
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  onClick={() => handleApproveQuestion(selectedQuestion.id)}
                  disabled={syncStatus === "syncing"}
                >
                  {syncStatus === "syncing" ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4 mr-2" />
                  )}
                  Approve
                </Button>
                <Button
                  className="flex-1 bg-red-600 hover:bg-red-700"
                  onClick={() => handleRejectQuestion(selectedQuestion.id, "Not appropriate")}
                  disabled={syncStatus === "syncing"}
                >
                  {syncStatus === "syncing" ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <X className="w-4 h-4 mr-2" />
                  )}
                  Reject
                </Button>
              </div>
            </div>
          </Card>
        ) : (
          <div className="space-y-3">
            <h3 className="font-semibold">Pending Questions</h3>
            {pending.length === 0 ? (
              <p className="text-sm text-muted-foreground">No pending questions</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {pending.map((q) => (
                  <Card
                    key={q.id}
                    className="p-3 cursor-pointer hover:bg-accent transition-colors"
                    onClick={() => setSelectedQuestion(q)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium line-clamp-2">{q.questionText}</p>
                        <p className="text-xs text-muted-foreground">{q.submitterName}</p>
                      </div>
                      <div className="flex items-center gap-2 ml-2">
                        {q.upvotes && q.upvotes > 0 && (
                          <div className="flex items-center gap-1 text-xs text-amber-600 whitespace-nowrap">
                            <ThumbsUp className="w-3 h-3" />
                            {q.upvotes}
                          </div>
                        )}
                        {q.complianceRiskScore && q.complianceRiskScore > 0.5 && (
                          <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-lg">Operator Console</h1>
              <p className="text-xs text-muted-foreground">
                {sessionState.status === "idle"
                  ? "Ready to start"
                  : `Session ${sessionState.status}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Sync Indicator */}
            {showSyncIndicator && (
              <div
                className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${
                  syncStatus === "syncing"
                    ? "bg-blue-100 text-blue-800"
                    : syncStatus === "synced"
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                }`}
              >
                {syncStatus === "syncing" && (
                  <Loader2 className="w-3 h-3 animate-spin" />
                )}
                {syncStatus === "synced" && <CheckCircle className="w-3 h-3" />}
                {syncStatus === "error" && <AlertCircle className="w-3 h-3" />}
                {syncStatus === "syncing"
                  ? "Syncing..."
                  : syncStatus === "synced"
                    ? "Synced"
                    : "Sync failed"}
              </div>
            )}

            {/* Session Timer */}
            {sessionState.status !== "idle" && (
              <div className="flex items-center gap-2 text-sm font-mono">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span>{formatTime(elapsedTime)}</span>
              </div>
            )}

            {/* Session Status Badge */}
            <div
              className={`px-3 py-1 rounded-full text-xs font-semibold border ${getSessionStatusColor()}`}
            >
              {sessionState.status.toUpperCase()}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container py-6">
        <div className="grid grid-cols-4 gap-6">
          {/* Left Panel - Transcript & Intelligence */}
          <div className="col-span-3 space-y-6">
            {/* Session Controls */}
            <Card className="p-4">
              <div className="flex gap-2">
                {sessionState.status === "idle" && (
                  <Button
                    className="bg-green-600 hover:bg-green-700"
                    onClick={handleStartSession}
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Start Session
                  </Button>
                )}
                {sessionState.status === "running" && (
                  <>
                    <Button
                      variant="outline"
                      onClick={handlePauseSession}
                    >
                      <Pause className="w-4 h-4 mr-2" />
                      Pause
                    </Button>
                    <Button
                      className="bg-red-600 hover:bg-red-700"
                      onClick={handleEndSession}
                    >
                      <Square className="w-4 h-4 mr-2" />
                      End Session
                    </Button>
                  </>
                )}
                {sessionState.status === "paused" && (
                  <>
                    <Button
                      className="bg-blue-600 hover:bg-blue-700"
                      onClick={handleResumeSession}
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Resume
                    </Button>
                    <Button
                      className="bg-red-600 hover:bg-red-700"
                      onClick={handleEndSession}
                    >
                      <Square className="w-4 h-4 mr-2" />
                      End Session
                    </Button>
                  </>
                )}
              </div>
            </Card>

            {/* Intelligence Panel */}
            <Card className="p-4">
              <h2 className="font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Intelligence Signals
              </h2>
              <div className="grid grid-cols-4 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Sentiment</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full ${getSentimentColor(intelligence.sentiment)}`}
                        style={{ width: `${intelligence.sentiment * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold">
                      {(intelligence.sentiment * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Compliance Risk</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-red-600"
                        style={{ width: `${intelligence.complianceRisk * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold">
                      {(intelligence.complianceRisk * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Engagement</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600"
                        style={{ width: `${intelligence.engagementScore * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold">
                      {(intelligence.engagementScore * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Questions</p>
                  <p className="text-2xl font-bold">{intelligence.questionsCount}</p>
                </div>
              </div>
            </Card>

            {/* Tabs */}
            <div className="border-b border-border">
              <div className="flex gap-4">
                {["transcript", "qa", "notes", "archive"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab as "transcript" | "qa" | "notes" | "archive")}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === tab
                        ? "border-primary text-primary"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            <div className="min-h-96">
              {activeTab === "transcript" && (
                <Card className="p-4 h-96 overflow-y-auto">
                  <div className="space-y-3">
                    {transcript.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-12">
                        Waiting for transcript...
                      </p>
                    ) : (
                      transcript.map((segment) => (
                        <div key={segment.id} className="space-y-1">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold">{segment.speaker}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(segment.timestamp).toLocaleTimeString()}
                            </p>
                          </div>
                          <p className="text-sm text-foreground">{segment.text}</p>
                        </div>
                      ))
                    )}
                    <div ref={transcriptEndRef} />
                  </div>
                </Card>
              )}

              {activeTab === "qa" && getQATabContent()}

              {activeTab === "notes" && (
                <div className="space-y-4">
                  <Card className="p-4">
                    <div className="space-y-3">
                      <Textarea
                        placeholder="Add operator note..."
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        className="min-h-20"
                      />
                      <Button onClick={handleAddNote} className="w-full">
                        <Send className="w-4 h-4 mr-2" />
                        Add Note
                      </Button>
                    </div>
                  </Card>

                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {operatorNotes.map((note) => (
                      <Card key={note.id} className="p-3">
                        <div className="flex items-start justify-between mb-2">
                          <p className="text-xs text-muted-foreground">
                            {new Date(note.timestamp).toLocaleTimeString()}
                          </p>
                          {note.synced && (
                            <div className="flex items-center gap-1 text-xs text-green-600">
                              <Zap className="w-3 h-3" />
                              Synced
                            </div>
                          )}
                        </div>
                        <p className="text-sm">{note.text}</p>
                        {note.action && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Action: {note.action}
                          </p>
                        )}
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "archive" && showArchivePanel && (
                <Card className="p-4">
                  <h3 className="font-semibold mb-4">Session Archive</h3>
                  <div className="space-y-3">
                    <Button variant="outline" className="w-full justify-start">
                      <Download className="w-4 h-4 mr-2" />
                      Download Transcript
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <FileText className="w-4 h-4 mr-2" />
                      Download AI Report
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Download className="w-4 h-4 mr-2" />
                      Download Recording
                    </Button>
                  </div>
                </Card>
              )}
            </div>
          </div>

          {/* Right Panel - Quick Stats */}
          <div className="space-y-4">
            <Card className="p-4">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Quick Stats
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground">Total Questions</p>
                  <p className="text-2xl font-bold">{questions.length}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Upvotes</p>
                  <p className="text-2xl font-bold">{intelligence.upvotesTotal}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold text-amber-600">
                    {getPendingQuestions().length}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Approved</p>
                  <p className="text-2xl font-bold text-green-600">
                    {getApprovedQuestions().length}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-blue-50 border-blue-200">
              <p className="text-xs font-semibold text-blue-900 mb-2">💡 Tip</p>
              <p className="text-xs text-blue-800">
                Use keyboard shortcuts to moderate faster. Press '?' for help.
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
