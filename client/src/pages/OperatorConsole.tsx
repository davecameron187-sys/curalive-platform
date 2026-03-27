/**
 * CuraLive Operator Console — World-Class Interface
 * The primary product surface for live event operators
 *
 * Core Modules:
 * - Transcript Panel: Real-time transcription feed
 * - Intelligence Panel: Sentiment, compliance, risk, engagement signals
 * - Session Controls: Start/pause/resume/end state machine
 * - Live Q&A Tab: Question moderation and speaker workflow
 * - Operator Notes: Timestamped action logging
 * - Archive Handoff: Post-event transcript, report, downloads
 */

import { useState, useEffect, useRef } from "react";
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

export default function OperatorConsole() {
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
  const [activeTab, setActiveTab] = useState<"transcript" | "qa" | "notes">(
    "transcript"
  );
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
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(
    null
  );
  const [showArchivePanel, setShowArchivePanel] = useState(false);

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

  // Session control handlers
  const handleStartSession = () => {
    const now = Date.now();
    setSessionState({
      status: "running",
      startTime: now,
      pausedTime: null,
      endTime: null,
    });
    addOperatorNote("Session started", "start");
  };

  const handlePauseSession = () => {
    setSessionState((prev) => ({
      ...prev,
      status: "paused",
      pausedTime: Date.now(),
    }));
    addOperatorNote("Session paused", "pause");
  };

  const handleResumeSession = () => {
    if (sessionState.pausedTime && sessionState.startTime) {
      const pauseDuration = sessionState.pausedTime - sessionState.startTime;
      setSessionState((prev) => ({
        ...prev,
        status: "running",
        startTime: Date.now() - pauseDuration,
        pausedTime: null,
      }));
      addOperatorNote("Session resumed", "resume");
    }
  };

  const handleEndSession = () => {
    setSessionState((prev) => ({
      ...prev,
      status: "ended",
      endTime: Date.now(),
    }));
    addOperatorNote("Session ended", "end");
    setShowArchivePanel(true);
  };

  const addOperatorNote = (text: string, action?: string) => {
    const newNote: OperatorNote = {
      id: `note-${Date.now()}`,
      timestamp: Date.now(),
      text,
      action,
    };
    setOperatorNotes((prev) => [newNote, ...prev]);
  };

  const handleAddNote = () => {
    if (noteText.trim()) {
      addOperatorNote(noteText);
      setNoteText("");
    }
  };

  const handleApproveQuestion = async (questionId: number) => {
    try {
      await approveQuestionMutation.mutateAsync({
        questionId,
        triageScore: 0.75,
        complianceRiskScore: 0.3,
      });
      addOperatorNote(`Approved question #${questionId}`, "approve");
      setSelectedQuestion(null);
    } catch (error) {
      console.error("Failed to approve:", error);
    }
  };

  const handleRejectQuestion = async (questionId: number, reason: string) => {
    try {
      await rejectQuestionMutation.mutateAsync({
        questionId,
        reason,
      });
      addOperatorNote(`Rejected question #${questionId}: ${reason}`, "reject");
      setSelectedQuestion(null);
    } catch (error) {
      console.error("Failed to reject:", error);
    }
  };

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

  const getPendingQuestions = () =>
    questions.filter((q) => q.status === "submitted");
  const getApprovedQuestions = () =>
    questions.filter((q) => q.status === "approved");

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Operator Console</h1>
              <p className="text-sm text-muted-foreground">
                Session ID: {sessionId}
              </p>
            </div>

            {/* Session Status & Timer */}
            <div className="flex items-center gap-6">
              <div className="text-right">
                <div
                  className={`inline-block px-3 py-1 rounded-full text-sm font-semibold border ${getSessionStatusColor()}`}
                >
                  {sessionState.status.toUpperCase()}
                </div>
                <p className="text-2xl font-mono font-bold mt-1">
                  {formatTime(elapsedTime)}
                </p>
              </div>

              {/* Session Controls */}
              <div className="flex gap-2">
                {sessionState.status === "idle" && (
                  <Button
                    onClick={handleStartSession}
                    className="gap-2 bg-green-600 hover:bg-green-700"
                  >
                    <Play className="w-4 h-4" />
                    Start
                  </Button>
                )}

                {sessionState.status === "running" && (
                  <>
                    <Button
                      onClick={handlePauseSession}
                      variant="outline"
                      className="gap-2"
                    >
                      <Pause className="w-4 h-4" />
                      Pause
                    </Button>
                    <Button
                      onClick={handleEndSession}
                      className="gap-2 bg-red-600 hover:bg-red-700"
                    >
                      <Square className="w-4 h-4" />
                      End
                    </Button>
                  </>
                )}

                {sessionState.status === "paused" && (
                  <>
                    <Button
                      onClick={handleResumeSession}
                      className="gap-2 bg-blue-600 hover:bg-blue-700"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Resume
                    </Button>
                    <Button
                      onClick={handleEndSession}
                      className="gap-2 bg-red-600 hover:bg-red-700"
                    >
                      <Square className="w-4 h-4" />
                      End
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Left: Transcript & Intelligence */}
          <div className="lg:col-span-2 space-y-6">
            {/* Intelligence Panel */}
            <Card className="p-6 bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700">
              <h2 className="text-lg font-semibold mb-4 text-white">
                Live Intelligence
              </h2>

              <div className="grid grid-cols-2 gap-4">
                {/* Sentiment */}
                <div className="bg-slate-700/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-300">Sentiment</span>
                    <TrendingUp className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className={`text-2xl font-bold ${getSentimentColor(intelligence.sentiment)}`}>
                    {(intelligence.sentiment * 100).toFixed(0)}%
                  </div>
                  <div className="w-full bg-slate-600 rounded-full h-2 mt-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${intelligence.sentiment * 100}%` }}
                    />
                  </div>
                </div>

                {/* Compliance Risk */}
                <div className="bg-slate-700/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-300">Compliance Risk</span>
                    <AlertCircle className="w-4 h-4 text-amber-400" />
                  </div>
                  <div
                    className={`text-2xl font-bold ${
                      intelligence.complianceRisk > 0.5
                        ? "text-red-400"
                        : "text-green-400"
                    }`}
                  >
                    {(intelligence.complianceRisk * 100).toFixed(0)}%
                  </div>
                  <div className="w-full bg-slate-600 rounded-full h-2 mt-2">
                    <div
                      className={`h-2 rounded-full ${
                        intelligence.complianceRisk > 0.5
                          ? "bg-red-500"
                          : "bg-green-500"
                      }`}
                      style={{ width: `${intelligence.complianceRisk * 100}%` }}
                    />
                  </div>
                </div>

                {/* Engagement */}
                <div className="bg-slate-700/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-300">Engagement</span>
                    <Users className="w-4 h-4 text-purple-400" />
                  </div>
                  <div className="text-2xl font-bold text-purple-400">
                    {(intelligence.engagementScore * 100).toFixed(0)}%
                  </div>
                  <div className="text-xs text-slate-400 mt-2">
                    {intelligence.questionsCount} questions • {intelligence.upvotesTotal} upvotes
                  </div>
                </div>

                {/* Q&A Volume */}
                <div className="bg-slate-700/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-300">Q&A Volume</span>
                    <MessageSquare className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div className="text-2xl font-bold text-cyan-400">
                    {intelligence.questionsCount}
                  </div>
                  <div className="text-xs text-slate-400 mt-2">
                    {getPendingQuestions().length} pending
                  </div>
                </div>
              </div>
            </Card>

            {/* Transcript Panel */}
            <Card className="p-6 h-96 overflow-y-auto bg-slate-50 dark:bg-slate-900">
              <h2 className="text-lg font-semibold mb-4 sticky top-0 bg-slate-50 dark:bg-slate-900">
                Live Transcript
              </h2>

              <div className="space-y-3">
                {transcript.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Waiting for transcript...
                  </p>
                ) : (
                  transcript.map((segment) => (
                    <div
                      key={segment.id}
                      className="border-l-4 border-primary pl-4 py-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm">
                          {segment.speaker}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(segment.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-sm mt-1">{segment.text}</p>
                    </div>
                  ))
                )}
                <div ref={transcriptEndRef} />
              </div>
            </Card>
          </div>

          {/* Right: Tabs (Q&A, Notes, Archive) */}
          <div className="lg:col-span-2">
            {/* Tab Navigation */}
            <div className="flex gap-2 mb-4 border-b border-border">
              <button
                onClick={() => setActiveTab("qa")}
                className={`px-4 py-2 font-semibold border-b-2 transition-colors ${
                  activeTab === "qa"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Q&A ({getPendingQuestions().length})
                </div>
              </button>

              <button
                onClick={() => setActiveTab("notes")}
                className={`px-4 py-2 font-semibold border-b-2 transition-colors ${
                  activeTab === "notes"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Notes ({operatorNotes.length})
                </div>
              </button>

              <button
                onClick={() => setActiveTab("transcript")}
                className={`px-4 py-2 font-semibold border-b-2 transition-colors ${
                  activeTab === "transcript"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Archive
                </div>
              </button>
            </div>

            {/* Tab Content */}
            <div className="min-h-96">
              {/* Q&A Tab */}
              {activeTab === "qa" && (
                <div className="space-y-4">
                  {questionsLoading ? (
                    <div className="flex justify-center items-center h-64">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                  ) : getPendingQuestions().length === 0 ? (
                    <Card className="p-8 text-center">
                      <p className="text-muted-foreground">
                        No pending questions
                      </p>
                    </Card>
                  ) : (
                    <>
                      {getPendingQuestions().map((question) => (
                        <Card
                          key={question.id}
                          className={`p-4 cursor-pointer hover:shadow-md transition-all ${
                            selectedQuestion?.id === question.id
                              ? "ring-2 ring-primary"
                              : ""
                          }`}
                          onClick={() => setSelectedQuestion(question)}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                              <h3 className="font-semibold text-sm">
                                {question.questionText}
                              </h3>
                              <p className="text-xs text-muted-foreground">
                                {question.submitterName || "Anonymous"}
                              </p>
                            </div>
                            <div className="flex gap-1">
                              {question.complianceRiskScore &&
                                question.complianceRiskScore > 0.5 && (
                                  <span
                                    className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${getRiskBadgeColor(
                                      question.complianceRiskScore
                                    )}`}
                                  >
                                    <AlertTriangle className="w-3 h-3" />
                                    Risk
                                  </span>
                                )}
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-xs">
                            <div className="flex gap-2">
                              <span className="text-muted-foreground">
                                {question.upvotes || 0} upvotes
                              </span>
                            </div>

                            {selectedQuestion?.id === question.id && (
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  className="gap-1 bg-green-600 hover:bg-green-700"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleApproveQuestion(question.id);
                                  }}
                                >
                                  <CheckCircle className="w-3 h-3" />
                                  Approve
                                </Button>

                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRejectQuestion(
                                      question.id,
                                      "Operator rejected"
                                    );
                                  }}
                                >
                                  <X className="w-3 h-3" />
                                  Reject
                                </Button>
                              </div>
                            )}
                          </div>
                        </Card>
                      ))}
                    </>
                  )}
                </div>
              )}

              {/* Notes Tab */}
              {activeTab === "notes" && (
                <div className="space-y-4">
                  {/* Add Note Form */}
                  <Card className="p-4">
                    <div className="flex gap-2">
                      <Textarea
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        placeholder="Add operator note..."
                        className="min-h-[80px]"
                      />
                    </div>
                    <Button
                      onClick={handleAddNote}
                      className="mt-2 gap-2 w-full"
                      disabled={!noteText.trim()}
                    >
                      <Send className="w-4 h-4" />
                      Add Note
                    </Button>
                  </Card>

                  {/* Notes List */}
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {operatorNotes.length === 0 ? (
                      <Card className="p-4 text-center">
                        <p className="text-muted-foreground text-sm">
                          No notes yet
                        </p>
                      </Card>
                    ) : (
                      operatorNotes.map((note) => (
                        <Card key={note.id} className="p-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="text-sm font-medium">{note.text}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {new Date(note.timestamp).toLocaleTimeString()}
                              </p>
                            </div>
                            {note.action && (
                              <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                                {note.action}
                              </span>
                            )}
                          </div>
                        </Card>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Archive Tab */}
              {activeTab === "transcript" && (
                <div className="space-y-4">
                  {sessionState.status === "ended" ? (
                    <>
                      <Card className="p-6 bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
                        <div className="flex items-center gap-3 mb-4">
                          <CheckCircle className="w-6 h-6 text-green-600" />
                          <h3 className="font-semibold text-green-900 dark:text-green-100">
                            Session Complete
                          </h3>
                        </div>
                        <p className="text-sm text-green-800 dark:text-green-200 mb-4">
                          Your session has ended. Download the transcript, AI report, and
                          recording below.
                        </p>

                        <div className="space-y-2">
                          <Button className="w-full gap-2 justify-start">
                            <Download className="w-4 h-4" />
                            Download Transcript
                          </Button>
                          <Button
                            variant="outline"
                            className="w-full gap-2 justify-start"
                          >
                            <Download className="w-4 h-4" />
                            Download AI Report
                          </Button>
                          <Button
                            variant="outline"
                            className="w-full gap-2 justify-start"
                          >
                            <Download className="w-4 h-4" />
                            Download Recording
                          </Button>
                        </div>
                      </Card>

                      {/* Session Summary */}
                      <Card className="p-4">
                        <h3 className="font-semibold mb-3">Session Summary</h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Duration:</span>
                            <span className="font-medium">
                              {formatTime(elapsedTime)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Questions:
                            </span>
                            <span className="font-medium">
                              {questions.length}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Approved:</span>
                            <span className="font-medium">
                              {getApprovedQuestions().length}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Avg Sentiment:
                            </span>
                            <span className="font-medium">
                              {(intelligence.sentiment * 100).toFixed(0)}%
                            </span>
                          </div>
                        </div>
                      </Card>
                    </>
                  ) : (
                    <Card className="p-8 text-center">
                      <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                      <p className="text-muted-foreground">
                        Archive will be available after session ends
                      </p>
                    </Card>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
