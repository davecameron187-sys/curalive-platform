import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertCircle,
  CheckCircle2,
  XCircle,
  Flag,
  Search,
  Filter,
  TrendingUp,
  MessageSquare,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

interface TriagedQuestion {
  triageId: number;
  qaId: number;
  question: string;
  classification: "approved" | "duplicate" | "off_topic" | "spam" | "unclear" | "sensitive";
  confidence: number | null;
  reason: string | null;
  isSensitive: number;
  sensitivityFlags: string | null;
  triageScore: number | null;
  triageTimestamp: any;
  operatorApproved?: boolean;
  approvalNotes?: string;
}

import PollManager from "@/components/PollManager";

export default function ModeratorQAConsole() {
  const [eventId, setEventId] = useState<string>("");
  const [activeTab, setActiveTab] = useState("qa");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedQuestion, setSelectedQuestion] = useState<TriagedQuestion | null>(null);
  const [approvalNotes, setApprovalNotes] = useState("");
  const [showApprovalModal, setShowApprovalModal] = useState(false);

  // tRPC queries and mutations
  const eventQuestionsQuery = trpc.aiFeatures.qaAutoTriageModeration.getEventQATriageResults.useQuery(
    { eventId: eventId || "0" },
    { enabled: !!eventId }
  );

  const qaStatsQuery = trpc.aiFeatures.qaAutoTriageModeration.getQATriageStats.useQuery(
    { eventId: parseInt(eventId) || 0 },
    { enabled: !!eventId && !isNaN(parseInt(eventId)) }
  );

  const approveQuestionMutation = trpc.aiFeatures.qaAutoTriageModeration.approveQAQuestion.useMutation();
  const rejectQuestionMutation = trpc.aiFeatures.qaAutoTriageModeration.rejectQAQuestion.useMutation();
  const flagQuestionMutation = trpc.aiFeatures.qaAutoTriageModeration.flagQAQuestion.useMutation();

  const questions = eventQuestionsQuery.data || [];
  const stats = qaStatsQuery.data;

  const categoryConfig = {
    approved: { color: "bg-green-500/10", textColor: "text-green-600", label: "Approved", icon: "✓" },
    duplicate: { color: "bg-yellow-500/10", textColor: "text-yellow-600", label: "Duplicate", icon: "⊕" },
    off_topic: { color: "bg-orange-500/10", textColor: "text-orange-600", label: "Off-Topic", icon: "→" },
    spam: { color: "bg-red-500/10", textColor: "text-red-600", label: "Spam", icon: "!" },
    unclear: { color: "bg-gray-500/10", textColor: "text-gray-600", label: "Unclear", icon: "?" },
    sensitive: { color: "bg-purple-500/10", textColor: "text-purple-600", label: "Sensitive", icon: "⚠" },
  };

  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      const categoryMatch = selectedCategory === "all" || q.classification === selectedCategory;
      const searchMatch = searchTerm === "" || q.question.toLowerCase().includes(searchTerm.toLowerCase());
      return categoryMatch && searchMatch;
    });
  }, [questions, selectedCategory, searchTerm]);

  const handleApproveQuestion = async (questionId: number) => {
    try {
      await approveQuestionMutation.mutateAsync({
        questionId,
        notes: approvalNotes || undefined,
      });
      toast.success("Question approved!");
      setApprovalNotes("");
      setShowApprovalModal(false);
      eventQuestionsQuery.refetch();
      qaStatsQuery.refetch();
    } catch (error) {
      toast.error("Failed to approve question");
    }
  };

  const handleRejectQuestion = async (questionId: number) => {
    if (!confirm("Reject this question?")) return;
    try {
      await rejectQuestionMutation.mutateAsync({ questionId });
      toast.success("Question rejected");
      eventQuestionsQuery.refetch();
      qaStatsQuery.refetch();
    } catch (error) {
      toast.error("Failed to reject question");
    }
  };

  const handleFlagQuestion = async (questionId: number) => {
    try {
      await flagQuestionMutation.mutateAsync({
        questionId,
        reason: "Manual moderator flag",
      });
      toast.success("Question flagged for review");
      eventQuestionsQuery.refetch();
    } catch (error) {
      toast.error("Failed to flag question");
    }
  };

  const getRiskBadges = (sensitivityFlags: string | null) => {
    if (!sensitivityFlags) return null;
    return sensitivityFlags.split(",").map((flag) => {
      let variant: "default" | "secondary" | "destructive" = "secondary";
      if (flag.includes("price") || flag.includes("confidential")) variant = "destructive";
      if (flag.includes("legal")) variant = "destructive";
      return (
        <Badge key={flag} variant={variant} className="text-xs">
          {flag}
        </Badge>
      );
    });
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Moderator Q&A Console</h1>
          <p className="text-muted-foreground">
            AI-powered question triage with automatic classification and risk detection
          </p>
        </div>

        {/* Event Selection */}
        <Card className="mb-6 border-border">
          <CardHeader>
            <CardTitle className="text-lg">Select Event</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              placeholder="Enter Event ID"
              value={eventId}
              onChange={(e) => setEventId(e.target.value)}
              className="max-w-xs"
            />
          </CardContent>
        </Card>

        {eventId && stats && (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="qa">Q&A Moderation</TabsTrigger>
              <TabsTrigger value="polls">Live Polling</TabsTrigger>
            </TabsList>

            <TabsContent value="qa">
              {/* Statistics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <Card className="p-4 border-border">
                  <p className="text-xs text-muted-foreground mb-1">Total Questions</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </Card>
                <Card className="p-4 border-border">
                  <p className="text-xs text-muted-foreground mb-1">Approved</p>
                  <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
                </Card>
                <Card className="p-4 border-border">
                  <p className="text-xs text-muted-foreground mb-1">Flagged</p>
                  <p className="text-2xl font-bold text-red-600">{stats.flagged}</p>
                </Card>
                <Card className="p-4 border-border">
                  <p className="text-xs text-muted-foreground mb-1">Avg Confidence</p>
                  <p className="text-2xl font-bold">{stats.averageConfidence}%</p>
                </Card>
              </div>

              {/* Filters */}
              <div className="mb-6 space-y-4">
                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant={selectedCategory === "all" ? "default" : "outline"}
                    onClick={() => setSelectedCategory("all")}
                    size="sm"
                  >
                    All ({questions.length})
                  </Button>
                  {Object.entries(categoryConfig).map(([key, config]) => (
                    <Button
                      key={key}
                      variant={selectedCategory === key ? "default" : "outline"}
                      onClick={() => setSelectedCategory(key)}
                      size="sm"
                      className={selectedCategory === key ? "" : "border-border"}
                    >
                      {config.label}
                    </Button>
                  ))}
                </div>

                <div className="relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search questions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Questions List */}
              <div className="space-y-3">
                {filteredQuestions.length === 0 ? (
                  <Card className="p-8 text-center border-border">
                    <MessageSquare className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                    <p className="text-muted-foreground">No questions found</p>
                  </Card>
                ) : (
                  filteredQuestions.map((question) => {
                    const config = categoryConfig[question.classification as keyof typeof categoryConfig];
                    return (
                      <Card
                        key={question.triageId}
                        className={`p-4 border-l-4 cursor-pointer transition-all hover:border-primary ${config.color}`}
                        style={{ borderLeftColor: config.textColor }}
                        onClick={() => {
                          setSelectedQuestion(question);
                          setShowApprovalModal(true);
                        }}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge className={`${config.color} ${config.textColor} border-0`}>
                                {config.label}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {question.confidence}% confidence
                              </span>
                            </div>
                            <p className="text-sm font-medium text-foreground break-words">{question.question}</p>

                            {question.sensitivityFlags && (
                              <div className="flex gap-1 mt-2 flex-wrap">{getRiskBadges(question.sensitivityFlags)}</div>
                            )}

                            {question.operatorApproved && (
                              <div className="mt-2 text-xs text-green-600 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                Approved by moderator
                              </div>
                            )}
                          </div>

                          <div className="flex gap-2 flex-shrink-0">
                            {!question.operatorApproved && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleApproveQuestion(question.triageId);
                                  }}
                                  disabled={approveQuestionMutation.isPending}
                                  className="border-green-500/20 text-green-600 hover:bg-green-500/10"
                                >
                                  <CheckCircle2 className="w-3 h-3" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRejectQuestion(question.triageId);
                                  }}
                                  disabled={rejectQuestionMutation.isPending}
                                  className="border-red-500/20 text-red-600 hover:bg-red-500/10"
                                >
                                  <XCircle className="w-3 h-3" />
                                </Button>
                              </>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleFlagQuestion(question.triageId);
                              }}
                              disabled={flagQuestionMutation.isPending}
                              className="border-amber-500/20 text-amber-600 hover:bg-amber-500/10"
                            >
                              <Flag className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    );
                  })
                )}
              </div>
            </TabsContent>

            <TabsContent value="polls">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 border-border">
                  <CardHeader>
                    <CardTitle>Poll Management</CardTitle>
                    <CardDescription>Create and manage live polls for your audience</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <PollManager eventId={eventId} />
                  </CardContent>
                </Card>
                
                <Card className="border-border">
                  <CardHeader>
                    <CardTitle>Polling Guidelines</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm text-muted-foreground">
                    <p>• Keep questions clear and concise for mobile users.</p>
                    <p>• Use "Rating Scale" for sentiment or satisfaction checks.</p>
                    <p>• Use "Word Cloud" for open-ended brainstorming sessions.</p>
                    <p>• Only one poll can be "Live" at any given time.</p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        )}

        {/* Approval Modal */}
        {showApprovalModal && selectedQuestion && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-2xl border-border">
              <CardHeader>
                <CardTitle>Review Question</CardTitle>
                <CardDescription>Approve or reject this question for the Q&A queue</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Question</p>
                  <p className="text-foreground p-3 bg-card rounded border border-border">
                    {selectedQuestion.question}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Category</p>
                    <Badge className="w-fit">
                      {categoryConfig[selectedQuestion.classification as keyof typeof categoryConfig].label}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Confidence</p>
                    <p className="text-foreground font-semibold">{selectedQuestion.confidence}%</p>
                  </div>
                </div>

                {selectedQuestion.sensitivityFlags && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Risk Flags</p>
                    <div className="flex gap-2 flex-wrap">{getRiskBadges(selectedQuestion.sensitivityFlags)}</div>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Moderator Notes (Optional)
                  </label>
                  <Textarea
                    placeholder="Add notes about your decision..."
                    value={approvalNotes}
                    onChange={(e) => setApprovalNotes(e.target.value)}
                    className="min-h-20 resize-none"
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowApprovalModal(false);
                      setApprovalNotes("");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      handleRejectQuestion(selectedQuestion.id);
                      setShowApprovalModal(false);
                      setApprovalNotes("");
                    }}
                  >
                    Reject
                  </Button>
                  <Button
                    onClick={() => {
                      handleApproveQuestion(selectedQuestion.id);
                      setShowApprovalModal(false);
                    }}
                    disabled={approveQuestionMutation.isPending}
                  >
                    {approveQuestionMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Approving...
                      </>
                    ) : (
                      "Approve"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
