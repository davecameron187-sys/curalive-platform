/**
 * CuraLive Operator Console — Premium Design
 * Professional 3-column layout with dark theme and strategic color accents
 *
 * Layout:
 * - Left: Live Transcript (with guidance alerts)
 * - Center: Live Intelligence (sentiment, compliance, insights)
 * - Right: Q&A Moderation (questions, actions)
 * - Bottom: Navigation tabs (Notes, Event Log, Downloads, System Status, etc.)
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
  isGuidanceAlert?: boolean;
}

interface IntelligenceSignals {
  sentiment: number;
  complianceRisk: number;
  engagementScore: number;
  questionsCount: number;
  upvotesTotal: number;
  lastUpdate: number;
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

export default function OperatorConsolePremium() {
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
  const [activeBottomTab, setActiveBottomTab] = useState<
    "questions" | "favorited" | "inbox" | "notes" | "event-log" | "downloads" | "system-status"
  >("questions");
  const [elapsedTime, setElapsedTime] = useState(0);
  const [transcript, setTranscript] = useState<TranscriptSegment[]>([]);
  const [intelligence, setIntelligence] = useState<IntelligenceSignals>({
    sentiment: 0.75,
    complianceRisk: 0.2,
    engagementScore: 0.82,
    questionsCount: 0,
    upvotesTotal: 0,
    lastUpdate: Date.now(),
  });
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "synced" | "error">("idle");

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

  // Auto-scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript]);

  // Update questions
  useEffect(() => {
    if (questionsData) {
      setQuestions(questionsData);
      const totalUpvotes = questionsData.reduce((sum, q) => sum + (q.upvotes || 0), 0);
      setIntelligence((prev) => ({
        ...prev,
        questionsCount: questionsData.length,
        upvotesTotal: totalUpvotes,
        lastUpdate: Date.now(),
      }));
    }
  }, [questionsData]);

  // Timer
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

  // Session handlers
  const handleStartSession = useCallback(async () => {
    const now = Date.now();
    setSessionState({
      status: "running",
      startTime: now,
      pausedTime: null,
      endTime: null,
    });

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
      console.error("Failed to sync:", error);
      setSyncStatus("error");
    }
  }, [sessionId, user?.id, syncSessionEventMutation]);

  const handlePauseSession = useCallback(async () => {
    setSessionState((prev) => ({
      ...prev,
      status: "paused",
      pausedTime: Date.now(),
    }));

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
      setSyncStatus("error");
    }
  }, [sessionId, user?.id, syncSessionEventMutation]);

  const handleEndSession = useCallback(async () => {
    setSessionState((prev) => ({
      ...prev,
      status: "ended",
      endTime: Date.now(),
    }));

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
      setSyncStatus("error");
    }
  }, [sessionId, user?.id, syncSessionEventMutation]);

  const handleApproveQuestion = useCallback(
    async (questionId: number) => {
      try {
        setSyncStatus("syncing");
        await approveQuestionMutation.mutateAsync({
          questionId,
          triageScore: 0.85,
          complianceRiskScore: 0.1,
        });

        await syncQuestionActionMutation.mutateAsync({
          questionId: questionId.toString(),
          sessionId: sessionId || "",
          action: "approved",
          operatorId: (user?.id?.toString() || "") as string,
        });

        setSyncStatus("synced");
        setSelectedQuestion(null);
      } catch (error) {
        setSyncStatus("error");
      }
    },
    [
      approveQuestionMutation,
      syncQuestionActionMutation,
      sessionId,
      user?.id,
    ]
  );

  const handleRejectQuestion = useCallback(
    async (questionId: number) => {
      try {
        setSyncStatus("syncing");
        await rejectQuestionMutation.mutateAsync({
          questionId,
          reason: "Not appropriate for discussion",
        });

        await syncQuestionActionMutation.mutateAsync({
          questionId: questionId.toString(),
          sessionId: sessionId || "",
          action: "rejected",
          operatorId: (user?.id?.toString() || "") as string,
          reason: "Not appropriate",
        });

        setSyncStatus("synced");
        setSelectedQuestion(null);
      } catch (error) {
        setSyncStatus("error");
      }
    },
    [
      rejectQuestionMutation,
      syncQuestionActionMutation,
      sessionId,
      user?.id,
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

  const getPendingQuestions = () => questions.filter((q) => q.status === "pending");
  const getApprovedQuestions = () => questions.filter((q) => q.status === "approved");
  const getRejectedQuestions = () => questions.filter((q) => q.status === "rejected");

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans" style={{ fontFamily: "'Inter', sans-serif" }}>
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

          {/* Center: Session Info */}
          <div className="flex items-center gap-6">
            <div className="text-center">
              <h2 className="text-lg font-semibold text-white">Q4 Earnings Call</h2>
              <p className="text-xs text-slate-400">QuantumCorp</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs font-semibold text-red-500 uppercase">Live</span>
            </div>
          </div>

          {/* Right: Controls */}
          <div className="flex items-center gap-4">
            {/* Timer */}
            <div className="flex items-center gap-2 text-sm font-mono bg-slate-800/50 px-3 py-1.5 rounded">
              <Clock className="w-4 h-4 text-slate-400" />
              <span>{formatTime(elapsedTime)}</span>
            </div>

            {/* Session Controls */}
            {sessionState.status === "idle" && (
              <Button
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={handleStartSession}
              >
                <Play className="w-4 h-4 mr-2" />
                Start
              </Button>
            )}
            {sessionState.status === "running" && (
              <>
                <Button
                  variant="outline"
                  className="border-slate-700 text-slate-300 hover:bg-slate-800"
                  onClick={handlePauseSession}
                >
                  <Pause className="w-4 h-4 mr-2" />
                  Pause
                </Button>
                <Button
                  className="bg-red-600 hover:bg-red-700 text-white"
                  onClick={handleEndSession}
                >
                  <Square className="w-4 h-4 mr-2" />
                  End Session
                </Button>
              </>
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

      {/* Main Content - 3 Column Layout */}
      <div className="flex h-[calc(100vh-80px-60px)]">
        {/* Left Column: Live Transcript */}
        <div className="flex-1 border-r border-slate-800 flex flex-col">
          {/* Header */}
          <div className="border-b border-slate-800 px-4 py-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Live Transcript
            </h3>
            <div className="flex items-center gap-2">
              <button className="text-slate-500 hover:text-slate-300 transition">
                <Eye className="w-4 h-4" />
              </button>
              <button className="text-slate-500 hover:text-slate-300 transition">
                <Edit3 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Transcript Content */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {transcript.length === 0 ? (
              <div className="space-y-3">
                {/* Sample guidance alert */}
                <div className="bg-red-950/30 border border-red-900/50 rounded px-3 py-2 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-slate-300">
                    <p className="font-semibold text-red-400 mb-1">Guidance Alert: Forward-looking statement detected.</p>
                    <p>Consider flagging for legal review.</p>
                  </div>
                </div>

                {/* Sample transcript lines */}
                <div className="text-xs text-slate-400 space-y-2">
                  <p><span className="text-slate-500">10:24 AM</span> <span className="text-slate-300 font-medium">CEO:</span> We expect strong revenue growth next quarter...</p>
                  <p><span className="text-slate-500">10:24 AM</span> <span className="text-slate-300 font-medium">CEO:</span> That's correct, we're projecting double-digit increases...</p>
                  <p><span className="text-slate-500">10:24 AM</span> <span className="text-slate-300 font-medium">Analyst:</span> Can you provide more details on the new product launch?</p>
                </div>
              </div>
            ) : (
              transcript.map((segment) => (
                <div key={segment.id} className="text-xs text-slate-400">
                  <p>
                    <span className="text-slate-500">{new Date(segment.timestamp).toLocaleTimeString()}</span>{" "}
                    <span className="text-slate-300 font-medium">{segment.speaker}:</span> {segment.text}
                  </p>
                </div>
              ))
            )}
            <div ref={transcriptEndRef} />
          </div>

          {/* Footer */}
          <div className="border-t border-slate-800 px-4 py-3 space-y-2">
            <Button
              variant="outline"
              className="w-full border-slate-700 text-slate-300 hover:bg-slate-800 justify-start"
            >
              <Edit3 className="w-4 h-4 mr-2" />
              Mark Key Moment
            </Button>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <Input
                placeholder="Search Transcript"
                className="pl-8 bg-slate-800 border-slate-700 text-slate-300 placeholder:text-slate-500"
              />
            </div>
          </div>
        </div>

        {/* Center Column: Live Intelligence */}
        <div className="flex-1 border-r border-slate-800 flex flex-col">
          {/* Header */}
          <div className="border-b border-slate-800 px-4 py-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Gauge className="w-4 h-4" />
              Live Intelligence
            </h3>
            <div className="flex items-center gap-1">
              <button className="text-slate-500 hover:text-slate-300 transition p-1">
                <Eye className="w-4 h-4" />
              </button>
              <button className="text-slate-500 hover:text-slate-300 transition p-1">
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Intelligence Content */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {/* Sentiment */}
            <div className="space-y-2">
              <p className="text-sm font-semibold text-white">Sentiment</p>
              <div className="flex items-center gap-3">
                <div className="relative w-24 h-24">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="#334155"
                      strokeWidth="8"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="#22c55e"
                      strokeWidth="8"
                      strokeDasharray={`${intelligence.sentiment * 283} 283`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-semibold text-white">
                      {(intelligence.sentiment * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-green-400 flex items-center gap-1">
                    <TrendingUp className="w-4 h-4" />
                    Positive
                  </p>
                  <p className="text-xs text-slate-400 mt-1">Trending Up ›</p>
                </div>
              </div>
            </div>

            {/* Compliance Alerts */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-white">Compliance Alerts</p>
                <button className="text-slate-500 hover:text-slate-300 transition">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
              <div className="flex gap-2">
                <div className="flex-1 bg-red-950/30 border border-red-900/50 rounded px-2 py-2 text-center">
                  <AlertOctagon className="w-4 h-4 text-red-500 mx-auto mb-1" />
                  <p className="text-xs font-semibold text-red-400">MNPI Risk</p>
                </div>
                <div className="flex-1 bg-red-950/30 border border-red-900/50 rounded px-2 py-2 text-center">
                  <AlertTriangle className="w-4 h-4 text-red-500 mx-auto mb-1" />
                  <p className="text-xs font-semibold text-red-400">Guidance Warning</p>
                </div>
                <div className="flex-1 bg-amber-950/30 border border-amber-900/50 rounded px-2 py-2 text-center">
                  <Lightbulb className="w-4 h-4 text-amber-500 mx-auto mb-1" />
                  <p className="text-xs font-semibold text-amber-400">ESG Mention</p>
                </div>
              </div>
            </div>

            {/* Key Insights */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-white">Key Insights</p>
                <button className="text-slate-500 hover:text-slate-300 transition">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-slate-300">New Product Launch</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  <span className="text-slate-300">Competitor Mention</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-2 h-2 rounded-full bg-amber-500" />
                  <span className="text-slate-300">Investor Concern</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Q&A Moderation */}
        <div className="flex-1 flex flex-col">
          {/* Header with Tabs */}
          <div className="border-b border-slate-800 px-4 py-3">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Q&A Moderation
              </h3>
              <button className="text-slate-500 hover:text-slate-300 transition">
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>
            <div className="flex gap-4 text-xs border-b border-slate-800">
              <button className="pb-2 text-slate-400 hover:text-slate-200 border-b-2 border-red-600 text-red-500 font-semibold">
                Questions
              </button>
              <button className="pb-2 text-slate-400 hover:text-slate-200">
                Favorited
              </button>
              <button className="pb-2 text-slate-400 hover:text-slate-200">
                Inbox
              </button>
            </div>
          </div>

          {/* Question Filters */}
          <div className="border-b border-slate-800 px-4 py-2 flex gap-2 text-xs">
            <button className="px-2 py-1 rounded bg-slate-800 text-slate-300 hover:bg-slate-700">
              Datiny
            </button>
            <button className="px-2 py-1 rounded text-slate-400 hover:text-slate-200">
              Junked
            </button>
            <button className="px-2 py-1 rounded text-slate-400 hover:text-slate-200">
              Comments
            </button>
            <div className="ml-auto flex gap-1">
              <button className="text-slate-500 hover:text-slate-300">
                <Zap className="w-4 h-4" />
              </button>
              <button className="text-slate-500 hover:text-slate-300">
                <TrendingDown className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Questions List */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
            {questionsLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-6 h-6 animate-spin text-slate-500" />
              </div>
            ) : getPendingQuestions().length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-8">No pending questions</p>
            ) : (
              getPendingQuestions().map((q) => (
                <div
                  key={q.id}
                  onClick={() => setSelectedQuestion(q)}
                  className="bg-slate-800/50 border border-slate-700 rounded px-3 py-2 cursor-pointer hover:bg-slate-800 transition group"
                >
                  <div className="flex items-start gap-2">
                    <input type="checkbox" className="mt-1 w-4 h-4" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-200 line-clamp-2">
                        {q.questionText}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">{q.submitterName || "Anonymous"}</p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {q.upvotes && q.upvotes > 0 && (
                        <div className="flex items-center gap-1 text-xs text-amber-500">
                          <ThumbsUp className="w-3 h-3" />
                          {q.upvotes}
                        </div>
                      )}
                      {q.complianceRiskScore && q.complianceRiskScore > 0.5 && (
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Question Detail / Actions */}
          {selectedQuestion && (
            <div className="border-t border-slate-800 bg-slate-800/30 p-4 space-y-3">
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-400">Question</p>
                <p className="text-sm text-slate-200">{selectedQuestion.questionText}</p>
              </div>

              {selectedQuestion.complianceRiskScore && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-400">Compliance Risk</p>
                  <div className="inline-block px-2 py-1 rounded text-xs font-semibold bg-red-950/50 text-red-400 border border-red-900/50">
                    Needs Review
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs h-8"
                  onClick={() => handleApproveQuestion(selectedQuestion.id)}
                  disabled={syncStatus === "syncing"}
                >
                  {syncStatus === "syncing" ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <CheckCircle className="w-3 h-3 mr-1" />
                  )}
                  Approve
                </Button>
                <Button
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs h-8"
                  onClick={() => handleRejectQuestion(selectedQuestion.id)}
                  disabled={syncStatus === "syncing"}
                >
                  <X className="w-3 h-3 mr-1" />
                  Reject
                </Button>
                <Button
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs h-8"
                >
                  Send to Speaker
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Navigation */}
      <footer className="border-t border-slate-800 bg-slate-900/50 h-15 px-6 py-3 flex items-center justify-between">
        <div className="flex gap-6 text-xs">
          <button className="text-slate-400 hover:text-slate-200 flex items-center gap-2 transition">
            <BookOpen className="w-4 h-4" />
            Notes
          </button>
          <button className="text-slate-400 hover:text-slate-200 flex items-center gap-2 transition">
            <BarChart3 className="w-4 h-4" />
            Event Log
          </button>
          <button className="text-slate-400 hover:text-slate-200 flex items-center gap-2 transition">
            <Download className="w-4 h-4" />
            Downloads
          </button>
          <button className="text-slate-400 hover:text-slate-200 flex items-center gap-2 transition">
            <Settings className="w-4 h-4" />
            System Status
          </button>
        </div>

        <div className="flex gap-6 text-xs">
          <button className="text-slate-400 hover:text-slate-200 flex items-center gap-2 transition">
            <FileText className="w-4 h-4" />
            Session Summary
          </button>
          <button className="text-amber-500 hover:text-amber-400 flex items-center gap-2 transition font-semibold">
            <Flag className="w-4 h-4" />
            Flags ‹
          </button>
          <button className="text-slate-400 hover:text-slate-200 flex items-center gap-2 transition">
            <CheckCircle className="w-4 h-4" />
            Report Ready ›
          </button>
        </div>
      </footer>
    </div>
  );
}
