/**
 * Advanced Moderation Dashboard
 * Comprehensive moderation interface with bulk actions, priority sorting, and auto-rules
 */

import { useEffect, useState } from "react";
import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  TrendingUp,
  Filter,
  Settings,
} from "lucide-react";

interface Question {
  id: string;
  text: string;
  askedBy: string;
  timestamp: string;
  complianceRisk: "low" | "medium" | "high" | "critical";
  status: "submitted" | "approved" | "rejected";
  sentiment: number;
}

interface ModerationMetrics {
  totalQuestions: number;
  approvedCount: number;
  rejectedCount: number;
  pendingCount: number;
  approvalRate: number;
  avgResponseTime: number;
  moderatorPerformance: Record<string, { approved: number; rejected: number }>;
}

interface AutoModerationRule {
  id: string;
  name: string;
  condition: "risk_level" | "keyword" | "sentiment";
  action: "auto_approve" | "auto_reject" | "flag_for_review";
  enabled: boolean;
}

export default function AdvancedModerationDashboard() {
  const { sessionId } = useParams<{ sessionId: string }>();

  // State
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<"risk" | "time" | "sentiment">("risk");
  const [filterRisk, setFilterRisk] = useState<"all" | "low" | "medium" | "high" | "critical">(
    "all"
  );
  const [metrics, setMetrics] = useState<ModerationMetrics | null>(null);
  const [autoRules, setAutoRules] = useState<AutoModerationRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // tRPC queries
  const { data: sessionData } = trpc.sessionStateMachine.getSessionState.useQuery(
    { sessionId: sessionId || "" },
    { enabled: !!sessionId }
  );

  const { data: questionsData } = trpc.sessionStateMachine.getSessionActionHistory.useQuery(
    { sessionId: sessionId || "" },
    { enabled: !!sessionId }
  );

  // Mutations
  const approveQuestionMutation = trpc.sessionStateMachine.createOperatorAction.useMutation();
  const rejectQuestionMutation = trpc.sessionStateMachine.createOperatorAction.useMutation();

  // Initialize
  useEffect(() => {
    if (questionsData) {
      // Mock questions from action history
      const mockQuestions: Question[] = [
        {
          id: "1",
          text: "What is your guidance for Q1 2026?",
          askedBy: "Analyst A",
          timestamp: new Date().toISOString(),
          complianceRisk: "low",
          status: "approved",
          sentiment: 0.7,
        },
        {
          id: "2",
          text: "How are you managing supply chain challenges?",
          askedBy: "Analyst B",
          timestamp: new Date().toISOString(),
          complianceRisk: "high",
          status: "submitted",
          sentiment: 0.3,
        },
      ];
      setQuestions(mockQuestions);
      setIsLoading(false);

      // Calculate metrics
      const approved = mockQuestions.filter((q: Question) => q.status === "approved").length;
      const rejected = mockQuestions.filter((q: Question) => q.status === "rejected").length;
      const pending = mockQuestions.filter((q: Question) => q.status === "submitted").length;

      setMetrics({
        totalQuestions: mockQuestions.length,
        approvedCount: approved,
        rejectedCount: rejected,
        pendingCount: pending,
        approvalRate: (approved / (approved + rejected)) * 100 || 0,
        avgResponseTime: 45, // Mock data
        moderatorPerformance: {}, // Would be populated from backend
      });

      // Mock auto-rules
      setAutoRules([
        {
          id: "1",
          name: "Auto-approve low-risk questions",
          condition: "risk_level",
          action: "auto_approve",
          enabled: true,
        },
        {
          id: "2",
          name: "Auto-reject high-risk compliance",
          condition: "risk_level",
          action: "auto_reject",
          enabled: false,
        },
      ]);
    }
  }, [questionsData]);

  // Sort questions
  const sortedQuestions = [...questions].sort((a: Question, b: Question) => {
    if (sortBy === "risk") {
      const riskOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return riskOrder[a.complianceRisk] - riskOrder[b.complianceRisk];
    } else if (sortBy === "time") {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    } else {
      return b.sentiment - a.sentiment;
    }
  });

  // Filter questions
  const filteredQuestions =
    filterRisk === "all"
      ? sortedQuestions
      : sortedQuestions.filter((q: Question) => q.complianceRisk === filterRisk);

  // Bulk actions
  const handleBulkApprove = async () => {
    for (const id of Array.from(selectedQuestions)) {
      await approveQuestionMutation.mutateAsync({ sessionId: sessionId || "", actionType: "question_approved", targetId: id, targetType: "question" });
    }
    setSelectedQuestions(new Set());
  };

  const handleBulkReject = async () => {
    for (const id of Array.from(selectedQuestions)) {
      await rejectQuestionMutation.mutateAsync({ sessionId: sessionId || "", actionType: "question_approved", targetId: id, targetType: "question" });
    }
    setSelectedQuestions(new Set());
  };

  const handleToggleQuestion = (id: string) => {
    const newSelected = new Set(selectedQuestions);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedQuestions(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedQuestions.size === filteredQuestions.length) {
      setSelectedQuestions(new Set());
    } else {
      setSelectedQuestions(new Set(filteredQuestions.map((q) => q.id)));
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "critical":
        return "bg-red-500/20 text-red-400 border-red-500";
      case "high":
        return "bg-orange-500/20 text-orange-400 border-orange-500";
      case "medium":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500";
      default:
        return "bg-green-500/20 text-green-400 border-green-500";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Moderation Dashboard</h1>
          <p className="text-muted-foreground">Session: {sessionId}</p>
        </div>

        {/* Metrics */}
        {metrics && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card className="p-4">
              <p className="text-sm text-muted-foreground">Total Questions</p>
              <p className="text-2xl font-bold">{metrics.totalQuestions}</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-muted-foreground">Approved</p>
              <p className="text-2xl font-bold text-green-400">{metrics.approvedCount}</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-muted-foreground">Rejected</p>
              <p className="text-2xl font-bold text-red-400">{metrics.rejectedCount}</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="text-2xl font-bold text-yellow-400">{metrics.pendingCount}</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-muted-foreground">Approval Rate</p>
              <p className="text-2xl font-bold">{metrics.approvalRate.toFixed(0)}%</p>
            </Card>
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center gap-4 flex-wrap">
          <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Sort by..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="risk">Risk Level</SelectItem>
              <SelectItem value="time">Most Recent</SelectItem>
              <SelectItem value="sentiment">Sentiment</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterRisk} onValueChange={(v: any) => setFilterRisk(v)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by risk..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Risks</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>

          {selectedQuestions.size > 0 && (
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-sm text-muted-foreground">{selectedQuestions.size} selected</span>
              <Button onClick={handleBulkApprove} size="sm" className="bg-green-600 hover:bg-green-700">
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Approve
              </Button>
              <Button onClick={handleBulkReject} size="sm" className="bg-red-600 hover:bg-red-700">
                <XCircle className="w-4 h-4 mr-2" />
                Reject
              </Button>
            </div>
          )}
        </div>

        {/* Questions List */}
        <Card className="p-6">
          <div className="space-y-3">
            {/* Select All */}
            <div className="flex items-center gap-3 pb-4 border-b border-border">
              <Checkbox
                checked={selectedQuestions.size === filteredQuestions.length}
                onCheckedChange={handleSelectAll}
              />
              <span className="text-sm font-semibold">
                {filteredQuestions.length} questions
              </span>
            </div>

            {/* Questions */}
            {filteredQuestions.map((question) => (
              <div
                key={question.id}
                className="flex items-start gap-4 p-4 rounded-lg border border-border hover:bg-secondary/50 transition"
              >
                <Checkbox
                  checked={selectedQuestions.has(question.id)}
                  onCheckedChange={() => handleToggleQuestion(question.id)}
                />

                <div className="flex-1">
                  <p className="font-semibold">{question.text}</p>
                  <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                    <span>Asked by: {question.askedBy}</span>
                    <span>•</span>
                    <span>{question.timestamp}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge className={getRiskColor(question.complianceRisk)}>
                    {question.complianceRisk.toUpperCase()}
                  </Badge>
                  {question.status === "approved" && (
                    <Badge className="bg-green-500/20 text-green-400">Approved</Badge>
                  )}
                  {question.status === "rejected" && (
                    <Badge className="bg-red-500/20 text-red-400">Rejected</Badge>
                  )}
                </div>

                {question.status === "submitted" && (
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => approveQuestionMutation.mutate({ sessionId: sessionId || "", actionType: "question_approved", targetId: question.id, targetType: "question" })}
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => rejectQuestionMutation.mutate({ sessionId: sessionId || "", actionType: "question_rejected", targetId: question.id, targetType: "question" })}
                    >
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Auto-Moderation Rules */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Auto-Moderation Rules
          </h2>
          <div className="space-y-3">
            {autoRules.map((rule) => (
              <div
                key={rule.id}
                className="flex items-center justify-between p-4 rounded-lg border border-border"
              >
                <div>
                  <p className="font-semibold">{rule.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {rule.condition} → {rule.action}
                  </p>
                </div>
                <Checkbox checked={rule.enabled} />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
