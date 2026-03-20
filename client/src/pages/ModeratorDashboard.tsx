/**
 * Moderator Dashboard
 * GROK2 Module 31 — Question triage, approval, and sentiment analysis
 */

import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
  Users,
  MessageSquare,
  Loader2,
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

interface DashboardStats {
  totalQuestions: number;
  pendingQuestions: number;
  approvedQuestions: number;
  averageSentiment: number;
  riskFlags: number;
}

export default function ModeratorDashboard() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { user } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalQuestions: 0,
    pendingQuestions: 0,
    approvedQuestions: 0,
    averageSentiment: 0,
    riskFlags: 0,
  });
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [moderatorNote, setModeratorNote] = useState("");
  const [filter, setFilter] = useState<"all" | "submitted" | "approved" | "risk">(
    "submitted"
  );

  // Fetch questions
  const { data: questionsData, isLoading } = trpc.liveQa.getQuestions.useQuery(
    { sessionId: sessionId || "" },
    { enabled: !!sessionId, refetchInterval: 1000 }
  );

  // Mutations
  const approveQuestionMutation = trpc.liveQa.approveQuestion.useMutation();
  const rejectQuestionMutation = trpc.liveQa.rejectQuestion.useMutation();
  // Use approveQuestionMutation to mark answered

  useEffect(() => {
    if (questionsData) {
      setQuestions(questionsData);

      // Calculate stats
      const pending = questionsData.filter((q) => q.status === "submitted").length;
      const approved = questionsData.filter(
        (q) => q.status === "approved"
      ).length;
      const risk = questionsData.filter(
        (q) => (q.complianceRiskScore || 0) > 0.5
      ).length;
      const avgSentiment =
        questionsData.reduce((sum, q) => sum + (q.triageScore || 0), 0) /
        questionsData.length;

      setStats({
        totalQuestions: questionsData.length,
        pendingQuestions: pending,
        approvedQuestions: approved,
        averageSentiment: avgSentiment,
        riskFlags: risk,
      });
    }
  }, [questionsData]);

  const handleApprove = async (questionId: number) => {
    try {
      await approveQuestionMutation.mutateAsync({
        questionId,
        triageScore: 0.75,
        complianceRiskScore: 0.3,
      });
      setModeratorNote("");
      setSelectedQuestion(null);
      setTimeout(() => window.location.reload(), 300);
    } catch (error) {
      console.error("Failed to approve:", error);
    }
  };

  const handleReject = async (questionId: number) => {
    try {
      await rejectQuestionMutation.mutateAsync({
        questionId,
        reason: moderatorNote,
      });
      setModeratorNote("");
      setSelectedQuestion(null);
      setTimeout(() => window.location.reload(), 300);
    } catch (error) {
      console.error("Failed to reject:", error);
    }
  };

  const handleMarkAnswered = async (questionId: number) => {
    try {
      // Mark as answered by updating status
      await approveQuestionMutation.mutateAsync({
        questionId,
        triageScore: 0.75,
        complianceRiskScore: 0.3,
      });
      setTimeout(() => window.location.reload(), 300);
    } catch (error) {
      console.error("Failed to mark answered:", error);
    }
  };

  const getFilteredQuestions = () => {
    switch (filter) {
      case "submitted":
        return questions.filter((q) => q.status === "submitted");
      case "approved":
        return questions.filter((q) => q.status === "approved");
      case "risk":
        return questions.filter((q) => (q.complianceRiskScore || 0) > 0.5);
      default:
        return questions;
    }
  };

  const getRiskBadgeColor = (score: number) => {
    if (score > 0.7) return "bg-red-100 text-red-800";
    if (score > 0.4) return "bg-yellow-100 text-yellow-800";
    return "bg-green-100 text-green-800";
  };

  const getSentimentColor = (score: number) => {
    if (score > 0.6) return "text-green-600";
    if (score > 0.4) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Moderator Dashboard</h1>
          <p className="text-muted-foreground">
            Triage, approve, and manage questions in real-time
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-5 gap-4 mb-8">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Questions</p>
                <p className="text-2xl font-bold">{stats.totalQuestions}</p>
              </div>
              <MessageSquare className="w-8 h-8 text-primary opacity-50" />
            </div>
          </Card>

          <Card className="p-4 border-yellow-200 bg-yellow-50/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Review</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {stats.pendingQuestions}
                </p>
              </div>
              <AlertCircle className="w-8 h-8 text-yellow-600 opacity-50" />
            </div>
          </Card>

          <Card className="p-4 border-green-200 bg-green-50/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Approved</p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.approvedQuestions}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600 opacity-50" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Sentiment</p>
                <p className={`text-2xl font-bold ${getSentimentColor(stats.averageSentiment)}`}>
                  {(stats.averageSentiment * 100).toFixed(0)}%
                </p>
              </div>
              <TrendingUp className="w-8 h-8 opacity-50" />
            </div>
          </Card>

          <Card className="p-4 border-red-200 bg-red-50/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Risk Flags</p>
                <p className="text-2xl font-bold text-red-600">
                  {stats.riskFlags}
                </p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-600 opacity-50" />
            </div>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Questions List */}
          <div className="lg:col-span-2">
            {/* Filter Buttons */}
            <div className="flex gap-2 mb-6">
              {(["all", "submitted", "approved", "risk"] as const).map((f) => (
                <Button
                  key={f}
                  variant={filter === f ? "default" : "outline"}
                  onClick={() => setFilter(f)}
                  className="capitalize"
                >
                  {f}
                </Button>
              ))}
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : getFilteredQuestions().length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">
                  No questions in this category
                </p>
              </Card>
            ) : (
              <div className="space-y-4">
                {getFilteredQuestions().map((question) => (
                  <Card
                    key={question.id}
                    className={`p-4 cursor-pointer hover:shadow-md transition-all ${
                      selectedQuestion?.id === question.id
                        ? "ring-2 ring-primary"
                        : ""
                    }`}
                    onClick={() => setSelectedQuestion(question)}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-1">
                          {question.questionText}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {question.submitterName || "Anonymous"}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {question.complianceRiskScore &&
                          question.complianceRiskScore > 0.5 && (
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getRiskBadgeColor(
                                question.complianceRiskScore
                              )}`}
                            >
                              <AlertCircle className="w-3 h-3" />
                              Risk
                            </span>
                          )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex gap-4">
                        {question.triageScore !== null && (
                          <span className={getSentimentColor(question.triageScore)}>
                            Sentiment: {(question.triageScore * 100).toFixed(0)}%
                          </span>
                        )}
                        {question.priorityScore !== null && (
                          <span className="text-muted-foreground">
                            Priority: {(question.priorityScore * 100).toFixed(0)}%
                          </span>
                        )}
                      </div>
                      <span className="text-muted-foreground">
                        👍 {question.upvotes || 0}
                      </span>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Moderation Panel */}
          <div className="lg:col-span-1">
            {selectedQuestion ? (
              <Card className="p-6 sticky top-4">
                <h2 className="text-xl font-semibold mb-4">Moderation</h2>

                <div className="space-y-4 mb-6">
                  <div>
                    <p className="text-sm font-medium mb-2">Question</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedQuestion.questionText}
                    </p>
                  </div>

                  {selectedQuestion.complianceRiskScore && (
                    <div>
                      <p className="text-sm font-medium mb-2">Compliance Risk</p>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-red-600 h-2 rounded-full"
                          style={{
                            width: `${selectedQuestion.complianceRiskScore * 100}%`,
                          }}
                        ></div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {(selectedQuestion.complianceRiskScore * 100).toFixed(0)}%
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Moderator Note
                    </label>
                    <Textarea
                      value={moderatorNote}
                      onChange={(e) => setModeratorNote(e.target.value)}
                      placeholder="Add a note or reason..."
                      className="min-h-[100px]"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  {selectedQuestion.status === "submitted" && (
                    <>
                      <Button
                        className="flex-1 bg-green-600 hover:bg-green-700"
                        onClick={() => handleApprove(selectedQuestion.id)}
                        disabled={approveQuestionMutation.isPending}
                      >
                        {approveQuestionMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Approve
                          </>
                        )}
                      </Button>
                      <Button
                        className="flex-1 bg-red-600 hover:bg-red-700"
                        onClick={() => handleReject(selectedQuestion.id)}
                        disabled={rejectQuestionMutation.isPending}
                      >
                        {rejectQuestionMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <XCircle className="w-4 h-4 mr-2" />
                            Reject
                          </>
                        )}
                      </Button>
                    </>
                  )}

                  {selectedQuestion.status === "approved" &&
                    !selectedQuestion.isAnswered && (
                      <Button
                        className="w-full"
                        onClick={() => handleMarkAnswered(selectedQuestion.id)}
                        disabled={approveQuestionMutation.isPending}
                      >
                        {approveQuestionMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Mark Answered
                          </>
                        )}
                      </Button>
                    )}              </div>
              </Card>
            ) : (
              <Card className="p-6 text-center text-muted-foreground">
                <p>Select a question to moderate</p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
