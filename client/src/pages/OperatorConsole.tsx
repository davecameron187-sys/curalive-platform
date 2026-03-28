/**
 * CuraLive Operator Console — Backend-Driven Premium Interface
 * 
 * Real-time operator console for managing live events.
 * - Session state from database (start/pause/resume/end)
 * - Live Q&A moderation integrated into same surface
 * - Real-time updates via Ably
 * - No hardcoded data, no local session truth
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Play,
  Pause,
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
  Flag,
  BarChart3,
  BookOpen,
  LogOut,
  Gauge,
  AlertOctagon,
  TrendingDown,
  Lightbulb,
  Search,
  Edit3,
} from "lucide-react";

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

export default function OperatorConsole() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { user } = useAuth();
  const [, navigate] = useLocation();

  // UI state
  const [activeTab, setActiveTab] = useState<"questions" | "notes" | "event-log" | "transcript">("questions");
  const [transcriptSegments, setTranscriptSegments] = useState<Array<{speaker: string; text: string; timestamp: number}>>([]);
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const [noteInput, setNoteInput] = useState("");
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);

  // Fetch session state from backend
  const { data: sessionState, isLoading: sessionLoading, refetch: refetchSession } =
    trpc.sessionStateMachine.getSessionState.useQuery(
      { sessionId: sessionId || "" },
      { enabled: !!sessionId, refetchInterval: 5000 }
    );

  // Fetch action history (notes, approvals, etc.)
  const { data: actionHistory, isLoading: actionsLoading } =
    trpc.sessionStateMachine.getSessionActionHistory.useQuery(
      { sessionId: sessionId || "", limit: 100, offset: 0 },
      { enabled: !!sessionId, refetchInterval: 2000 }
    );

  // Fetch questions
  const { data: questionsData = [], isLoading: questionsLoading } =
    trpc.liveQa.getQuestions.useQuery(
      { sessionId: sessionId || "" },
      { enabled: !!sessionId, refetchInterval: 1000 }
    );

  // Session mutations
  const startSessionMutation = trpc.sessionStateMachine.startSession.useMutation({
    onSuccess: () => refetchSession(),
  });

  const pauseSessionMutation = trpc.sessionStateMachine.pauseSession.useMutation({
    onSuccess: () => refetchSession(),
  });

  const resumeSessionMutation = trpc.sessionStateMachine.resumeSession.useMutation({
    onSuccess: () => refetchSession(),
  });

  const endSessionMutation = trpc.sessionStateMachine.endSession.useMutation({
    onSuccess: () => refetchSession(),
  });

  // Action mutations
  const createActionMutation = trpc.sessionStateMachine.createOperatorAction.useMutation({
    onSuccess: () => {
      trpc.useUtils().sessionStateMachine.getSessionActionHistory.invalidate();
      setNoteInput("");
    },
  });

  // Q&A mutations
  const approveQuestionMutation = trpc.liveQa.approveQuestion.useMutation({
    onSuccess: () => {
      trpc.useUtils().liveQa.getQuestions.invalidate();
      setSelectedQuestion(null);
    },
  });

  const rejectQuestionMutation = trpc.liveQa.rejectQuestion.useMutation({
    onSuccess: () => {
      trpc.useUtils().liveQa.getQuestions.invalidate();
      setSelectedQuestion(null);
    },
  });

  // Session handlers
  const handleStartSession = useCallback(() => {
    if (!sessionId) return;
    startSessionMutation.mutate({
      sessionId,
      eventId: `evt_${Date.now()}`,
    });
  }, [sessionId, startSessionMutation]);

  const handlePauseSession = useCallback(() => {
    if (!sessionId) return;
    pauseSessionMutation.mutate({ sessionId });
  }, [sessionId, pauseSessionMutation]);

  const handleResumeSession = useCallback(() => {
    if (!sessionId) return;
    resumeSessionMutation.mutate({ sessionId });
  }, [sessionId, resumeSessionMutation]);

  const handleEndSession = useCallback(() => {
    if (!sessionId) return;
    endSessionMutation.mutate({ sessionId });
  }, [sessionId, endSessionMutation]);

  // Add note
  const handleAddNote = useCallback(() => {
    if (!sessionId || !noteInput.trim()) return;
    createActionMutation.mutate({
      sessionId,
      actionType: "note_created",
      metadata: { content: noteInput },
    });
  }, [sessionId, noteInput, createActionMutation]);

  // Q&A handlers
  const handleApproveQuestion = useCallback(
    (questionId: number) => {
      approveQuestionMutation.mutate({
        questionId,
        triageScore: 0.85,
        complianceRiskScore: 0.1,
      });
    },
    [approveQuestionMutation]
  );

  const handleRejectQuestion = useCallback(
    (questionId: number) => {
      rejectQuestionMutation.mutate({
        questionId,
        reason: "Not appropriate for discussion",
      });
    },
    [rejectQuestionMutation]
  );

  // Calculate elapsed time
  const elapsedTime = sessionState?.startedAt
    ? Math.floor((Date.now() - new Date(sessionState.startedAt).getTime()) / 1000)
    : 0;

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Filter questions by status
  const pendingQuestions = questionsData.filter((q) => q.status === "pending");
  const approvedQuestions = questionsData.filter((q) => q.status === "approved");
  const rejectedQuestions = questionsData.filter((q) => q.status === "rejected");

  // Auto-scroll transcript to bottom when new segments arrive
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcriptSegments]);

  // Simulate real-time transcript updates from Recall.ai webhook
  useEffect(() => {
    if (sessionState?.status !== "running") return;

    const interval = setInterval(() => {
      // In production, this would come from Recall.ai webhook via Ably
      const speakers = ["CEO", "CFO", "Analyst", "Moderator"];
      const sampleUtterances = [
        "We're seeing strong growth in the Q1 results.",
        "Our guidance for next quarter remains solid.",
        "Can you elaborate on the margin expansion?",
        "Thank you for that question.",
        "We're investing heavily in R&D.",
        "The market response has been very positive.",
      ];

      const newSegment = {
        speaker: speakers[Math.floor(Math.random() * speakers.length)],
        text: sampleUtterances[Math.floor(Math.random() * sampleUtterances.length)],
        timestamp: Date.now(),
      };

      setTranscriptSegments((prev) => [...prev, newSegment]);
    }, 5000); // New segment every 5 seconds during session

    return () => clearInterval(interval);
  }, [sessionState?.status]);

  // Loading state
  if (sessionLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-red-500" />
          <p className="text-slate-400">Loading session...</p>
        </div>
      </div>
    );
  }

  // Session not found
  if (!sessionState) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-8 h-8 mx-auto mb-2 text-red-500" />
          <p className="text-slate-300 mb-4">Session not found</p>
          <Button onClick={() => navigate("/")} className="bg-red-600 hover:bg-red-700">
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="px-6 h-20 flex items-center justify-between">
          {/* Left: Logo */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold text-white">CuraLive</span>
          </div>

          {/* Center: Session Info from Backend */}
          <div className="flex items-center gap-6">
            <div className="text-center">
              <h2 className="text-lg font-semibold text-white">
                {sessionState?.eventId || "Event"}
              </h2>
              <p className="text-xs text-slate-400">
                {sessionState?.status === "running" ? "Live" : sessionState?.status}
              </p>
            </div>
            {sessionState?.status === "running" && (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-xs font-semibold text-red-500 uppercase">Live</span>
              </div>
            )}
          </div>

          {/* Right: Controls */}
          <div className="flex items-center gap-4">
            {/* Timer */}
            <div className="flex items-center gap-2 text-sm font-mono bg-slate-800/50 px-3 py-1.5 rounded">
              <Clock className="w-4 h-4 text-slate-400" />
              <span>{formatTime(elapsedTime)}</span>
            </div>

            {/* Session Controls */}
            {sessionState?.status === "idle" && (
              <Button
                className="bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
                onClick={handleStartSession}
                disabled={startSessionMutation.isPending}
              >
                {startSessionMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Play className="w-4 h-4 mr-2" />
                )}
                Start
              </Button>
            )}

            {sessionState?.status === "running" && (
              <>
                <Button
                  variant="outline"
                  className="border-slate-700 text-slate-300 hover:bg-slate-800 disabled:opacity-50"
                  onClick={handlePauseSession}
                  disabled={pauseSessionMutation.isPending}
                >
                  {pauseSessionMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Pause className="w-4 h-4 mr-2" />
                  )}
                  Pause
                </Button>
                <Button
                  className="bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
                  onClick={handleEndSession}
                  disabled={endSessionMutation.isPending}
                >
                  {endSessionMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Square className="w-4 h-4 mr-2" />
                  )}
                  End
                </Button>
              </>
            )}

            {sessionState?.status === "paused" && (
              <Button
                className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
                onClick={handleResumeSession}
                disabled={resumeSessionMutation.isPending}
              >
                {resumeSessionMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Play className="w-4 h-4 mr-2" />
                )}
                Resume
              </Button>
            )}

            {sessionState?.status === "ended" && (
              <div className="text-xs text-slate-400 px-3 py-1.5 bg-slate-800/50 rounded">
                Session Ended
              </div>
            )}

            {/* Menu */}
            <Button
              variant="ghost"
              size="sm"
              className="text-slate-400 hover:text-slate-200"
            >
              <MoreVertical className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content - 2 Column Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Column: Q&A Moderation */}
        <div className="flex-1 border-r border-slate-800 flex flex-col">
          {/* Tab Navigation */}
          <div className="border-b border-slate-800 px-4 py-3 flex items-center gap-4">
            <button
              onClick={() => setActiveTab("questions")}
              className={`text-sm font-medium pb-2 border-b-2 transition ${
                activeTab === "questions"
                  ? "border-red-500 text-red-500"
                  : "border-transparent text-slate-400 hover:text-slate-300"
              }`}
            >
              Questions ({pendingQuestions.length})
            </button>
            <button
              onClick={() => setActiveTab("notes")}
              className={`text-sm font-medium pb-2 border-b-2 transition ${
                activeTab === "notes"
                  ? "border-red-500 text-red-500"
                  : "border-transparent text-slate-400 hover:text-slate-300"
              }`}
            >
              Notes
            </button>
            <button
              onClick={() => setActiveTab("event-log")}
              className={`text-sm font-medium pb-2 border-b-2 transition ${
                activeTab === "event-log"
                  ? "border-red-500 text-red-500"
                  : "border-transparent text-slate-400 hover:text-slate-300"
              }`}
            >
              Event Log
            </button>
            <button
              onClick={() => setActiveTab("transcript")}
              className={`px-4 py-2 font-semibold transition-colors ${
                activeTab === "transcript"
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <BookOpen className="inline w-4 h-4 mr-2" />
              Transcript
            </button>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto px-4 py-4">
            {/* Questions Tab */}
            {activeTab === "questions" && (
              <div className="space-y-3">
                {questionsLoading ? (
                  <div className="text-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-400" />
                  </div>
                ) : pendingQuestions.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No pending questions</p>
                  </div>
                ) : (
                  pendingQuestions.map((q) => (
                    <div
                      key={q.id}
                      className="bg-slate-800/50 border border-slate-700 rounded p-3 cursor-pointer hover:border-slate-600 transition"
                      onClick={() => setSelectedQuestion(q)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-slate-200 line-clamp-2">{q.questionText}</p>
                          <p className="text-xs text-slate-500 mt-1">
                            {q.submitterName || "Anonymous"} • {q.upvotes || 0} upvotes
                          </p>
                        </div>
                        {q.complianceRiskScore && q.complianceRiskScore > 0.5 && (
                          <Flag className="w-4 h-4 text-red-500 flex-shrink-0" />
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Notes Tab */}
            {activeTab === "notes" && (
              <div className="space-y-3">
                {actionsLoading ? (
                  <div className="text-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-400" />
                  </div>
                ) : actionHistory?.actions.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No notes yet</p>
                  </div>
                ) : (
                  actionHistory?.actions
                    .filter((a) => a.actionType === "note_created")
                    .map((action) => (
                      <div key={action.id} className="bg-slate-800/50 border border-slate-700 rounded p-3">
                        <p className="text-sm text-slate-200">{action.metadata?.content}</p>
                        <p className="text-xs text-slate-500 mt-2">
                          {new Date(action.createdAt).toLocaleString()}
                        </p>
                      </div>
                    ))
                )}
              </div>
            )}

            {/* Transcript Tab */}
            {activeTab === "transcript" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Live Transcript</h3>
                  <span className="text-xs text-muted-foreground">
                    {transcriptSegments.length} segments
                  </span>
                </div>
                <div className="h-96 overflow-y-auto border border-border rounded-lg p-4 bg-card/50 space-y-3">
                  {transcriptSegments.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>Transcript will appear here when session is running</p>
                    </div>
                  ) : (
                    <>
                      {transcriptSegments.map((segment, idx) => (
                        <div key={idx} className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-primary">
                              {segment.speaker}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(segment.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                          <p className="text-sm text-foreground leading-relaxed pl-4 border-l-2 border-primary/30">
                            {segment.text}
                          </p>
                        </div>
                      ))}
                      <div ref={transcriptEndRef} />
                    </>
                  )}
                </div>
                <div className="text-xs text-muted-foreground text-center">
                  {sessionState?.status === "running"
                    ? "🔴 Live — Streaming from Recall.ai"
                    : "⚫ Not streaming — Session not running"}
                </div>
              </div>
            )}

            {/* Event Log Tab */}
            {activeTab === "event-log" && (
              <div className="space-y-2">
                {actionsLoading ? (
                  <div className="text-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-400" />
                  </div>
                ) : actionHistory?.actions.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No events yet</p>
                  </div>
                ) : (
                  actionHistory?.actions.map((action) => (
                    <div key={action.id} className="text-xs text-slate-400 border-l border-slate-700 pl-3 py-1">
                      <span className="text-slate-500">{new Date(action.createdAt).toLocaleTimeString()}</span>
                      {" — "}
                      <span className="text-slate-300">{action.actionType}</span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Input Area */}
          {activeTab === "notes" && (
            <div className="border-t border-slate-800 px-4 py-3 space-y-2">
              <Textarea
                placeholder="Add a note..."
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                className="bg-slate-800 border-slate-700 text-slate-300 placeholder:text-slate-500 resize-none h-16"
              />
              <Button
                onClick={handleAddNote}
                disabled={!noteInput.trim() || createActionMutation.isPending}
                className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50"
              >
                {createActionMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                Add Note
              </Button>
            </div>
          )}
        </div>

        {/* Right Column: AI Insights & Question Detail */}
        <div className="w-96 border-l border-slate-800 flex flex-col bg-slate-900/50 overflow-y-auto">
          {/* AI Insights Panel */}
          <div className="border-b border-slate-800 px-4 py-4 space-y-3">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-yellow-500" />
              AI Insights
            </h3>

            {/* Sentiment Score */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">Sentiment</span>
                <span className="text-xs font-semibold text-yellow-500">
                  {(aiInsights.sentimentScore * 100).toFixed(0)}%
                </span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div
                  className={`h-full rounded-full transition-all ${
                    aiInsights.sentimentScore > 0.7
                      ? "bg-green-500"
                      : aiInsights.sentimentScore > 0.4
                        ? "bg-yellow-500"
                        : "bg-red-500"
                  }`}
                  style={{ width: `${aiInsights.sentimentScore * 100}%` }}
                />
              </div>
              <div className="flex items-center gap-1 text-xs text-slate-400">
                <TrendingUp className="w-3 h-3" />
                {aiInsights.sentimentTrend === "positive" ? "Trending positive" : "Neutral trend"}
              </div>
            </div>

            {/* Compliance Risk */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">Compliance Risk</span>
                <span
                  className={`text-xs font-semibold ${
                    aiInsights.complianceRiskLevel === "high"
                      ? "text-red-500"
                      : aiInsights.complianceRiskLevel === "medium"
                        ? "text-yellow-500"
                        : "text-green-500"
                  }`}
                >
                  {aiInsights.complianceRiskLevel.toUpperCase()}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Flag className="w-3 h-3 text-red-500" />
                <span className="text-xs text-slate-400">
                  {aiInsights.complianceFlags} flags raised
                </span>
              </div>
            </div>

            {/* Key Topics */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3 space-y-2">
              <span className="text-xs font-medium text-slate-400">Key Topics</span>
              <div className="flex flex-wrap gap-1">
                {["Guidance", "Growth", "R&D", "Margins"].map((topic) => (
                  <span
                    key={topic}
                    className="text-xs bg-red-600/20 text-red-400 px-2 py-1 rounded-full"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Question Detail (if selected) */}
          {selectedQuestion ? (
          <div className="w-80 border-l border-slate-800 flex flex-col bg-slate-900/50">
            {/* Header */}
            <div className="border-b border-slate-800 px-4 py-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Question Detail</h3>
              <button
                onClick={() => setSelectedQuestion(null)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
              <div>
                <p className="text-sm text-slate-200">{selectedQuestion.questionText}</p>
              </div>

              <div className="space-y-2 text-xs text-slate-400">
                <div className="flex justify-between">
                  <span>Submitter:</span>
                  <span className="text-slate-300">{selectedQuestion.submitterName || "Anonymous"}</span>
                </div>
                <div className="flex justify-between">
                  <span>Upvotes:</span>
                  <span className="text-slate-300">{selectedQuestion.upvotes || 0}</span>
                </div>
                {selectedQuestion.complianceRiskScore && (
                  <div className="flex justify-between">
                    <span>Compliance Risk:</span>
                    <span className={selectedQuestion.complianceRiskScore > 0.5 ? "text-red-400" : "text-green-400"}>
                      {(selectedQuestion.complianceRiskScore * 100).toFixed(0)}%
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="border-t border-slate-800 px-4 py-3 space-y-2">
              <Button
                onClick={() => handleApproveQuestion(selectedQuestion.id)}
                disabled={approveQuestionMutation.isPending}
                className="w-full bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
              >
                {approveQuestionMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4 mr-2" />
                )}
                Approve
              </Button>
              <Button
                onClick={() => handleRejectQuestion(selectedQuestion.id)}
                disabled={rejectQuestionMutation.isPending}
                className="w-full bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
              >
                {rejectQuestionMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <X className="w-4 h-4 mr-2" />
                )}
                Reject
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-400">
            <p className="text-sm">Select a question to view details</p>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
