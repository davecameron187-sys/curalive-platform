/**
 * LiveQaSession Component
 * GROK2 Module 31 — Live Q&A Intelligence Engine
 * Main event room for attendees to submit and view questions
 */

import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ThumbsUp, AlertCircle, Loader2 } from "lucide-react";

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

export default function LiveQaSession() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { user } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    questionText: "",
    submitterName: user?.name || "",
    submitterEmail: user?.email || "",
    questionCategory: "general",
  });

  // Fetch questions
  const { data: questionsData, isLoading } = trpc.liveQa.getQuestions.useQuery(
    { sessionId: sessionId || "" },
    { enabled: !!sessionId, refetchInterval: 2000 }
  );

  // Submit question mutation
  const submitQuestionMutation = trpc.liveQa.submitQuestion.useMutation();
  const upvoteQuestionMutation = trpc.liveQa.upvoteQuestion.useMutation();

  useEffect(() => {
    if (questionsData) {
      setQuestions(questionsData);
    }
  }, [questionsData]);

  const handleSubmitQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.questionText.trim()) return;

    setSubmitting(true);
    try {
      await submitQuestionMutation.mutateAsync({
        sessionId: sessionId || "",
        questionText: formData.questionText,
        submitterName: formData.submitterName,
        submitterEmail: formData.submitterEmail,
        questionCategory: formData.questionCategory,
      });

      // Reset form
      setFormData({
        ...formData,
        questionText: "",
      });

      // Refresh questions
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      console.error("Failed to submit question:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpvote = async (questionId: number) => {
    try {
      await upvoteQuestionMutation.mutateAsync({ questionId });
      // Refresh questions
      setTimeout(() => {
        window.location.reload();
      }, 300);
    } catch (error) {
      console.error("Failed to upvote:", error);
    }
  };

  const getRiskBadgeColor = (score: number) => {
    if (score > 0.7) return "bg-red-100 text-red-800";
    if (score > 0.4) return "bg-yellow-100 text-yellow-800";
    return "bg-green-100 text-green-800";
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-blue-100 text-blue-800";
      case "answered":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Live Q&A Session</h1>
          <p className="text-muted-foreground">
            Submit your questions and engage with the panel in real-time
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Question Submission Form */}
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-4">
              <h2 className="text-xl font-semibold mb-4">Submit a Question</h2>

              <form onSubmit={handleSubmitQuestion} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Your Name
                  </label>
                  <Input
                    value={formData.submitterName}
                    onChange={(e) =>
                      setFormData({ ...formData, submitterName: e.target.value })
                    }
                    placeholder="Your name"
                    disabled={submitting}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Category
                  </label>
                  <select
                    value={formData.questionCategory}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        questionCategory: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                    disabled={submitting}
                  >
                    <option value="general">General</option>
                    <option value="financial">Financial</option>
                    <option value="strategy">Strategy</option>
                    <option value="operations">Operations</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Your Question
                  </label>
                  <Textarea
                    value={formData.questionText}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        questionText: e.target.value,
                      })
                    }
                    placeholder="Ask your question here..."
                    className="min-h-[120px]"
                    disabled={submitting}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {formData.questionText.length}/500 characters
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={submitting || !formData.questionText.trim()}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Question"
                  )}
                </Button>
              </form>
            </Card>
          </div>

          {/* Questions List */}
          <div className="lg:col-span-2">
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : questions.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">
                  No questions yet. Be the first to ask!
                </p>
              </Card>
            ) : (
              <div className="space-y-4">
                {questions
                  .filter((q) => q.status === "approved")
                  .sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0))
                  .map((question) => (
                    <Card
                      key={question.id}
                      className="p-4 hover:shadow-md transition-shadow"
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
                          <span
                            className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(
                              question.status
                            )}`}
                          >
                            {question.status}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex gap-4 text-sm text-muted-foreground">
                          {question.questionCategory && (
                            <span className="capitalize">
                              {question.questionCategory}
                            </span>
                          )}
                          {question.isAnswered && (
                            <span className="text-green-600 font-medium">
                              ✓ Answered
                            </span>
                          )}
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUpvote(question.id)}
                          className="flex items-center gap-1"
                        >
                          <ThumbsUp className="w-4 h-4" />
                          {question.upvotes || 0}
                        </Button>
                      </div>
                    </Card>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
