import React, { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Filter, Check, X, Archive, Download } from "lucide-react";

/**
 * Advanced Q&A Filtering and Bulk Actions
 * Filter questions by sentiment, compliance, status
 * Perform bulk approve/reject/assign operations
 */
export default function AdvancedQAFiltering() {
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  const [filters, setFilters] = useState({
    sentiment: "all" as "all" | "positive" | "negative" | "neutral",
    compliance: "all" as "all" | "high" | "medium" | "low",
    status: "all" as "all" | "submitted" | "approved" | "rejected",
  });

  // Mock questions data
  const mockQuestions = [
    {
      id: "q1",
      text: "What are your Q4 guidance expectations?",
      sentiment: "positive",
      complianceRisk: "low",
      status: "submitted" as const,
      upvotes: 45,
      speaker: "CFO",
    },
    {
      id: "q2",
      text: "Can you comment on the SEC investigation?",
      sentiment: "negative",
      complianceRisk: "high",
      status: "submitted" as const,
      upvotes: 23,
      speaker: "CEO",
    },
    {
      id: "q3",
      text: "How is the new product launch progressing?",
      sentiment: "neutral",
      complianceRisk: "medium",
      status: "submitted" as const,
      upvotes: 12,
      speaker: "COO",
    },
  ];

  // Filter questions based on selected filters
  const filteredQuestions = useMemo(() => {
    return mockQuestions.filter((q) => {
      if (filters.sentiment !== "all" && q.sentiment !== filters.sentiment)
        return false;
      if (filters.compliance !== "all" && q.complianceRisk !== filters.compliance)
        return false;
      if (filters.status !== "all" && q.status !== filters.status) return false;
      return true;
    });
  }, [filters]);

  const handleSelectAll = () => {
    if (selectedQuestions.length === filteredQuestions.length) {
      setSelectedQuestions([]);
    } else {
      setSelectedQuestions(filteredQuestions.map((q) => q.id));
    }
  };

  const handleBulkApprove = async () => {
    console.log("Approving questions:", selectedQuestions);
    setSelectedQuestions([]);
  };

  const handleBulkReject = async () => {
    console.log("Rejecting questions:", selectedQuestions);
    setSelectedQuestions([]);
  };

  const handleBulkAssign = async (speaker: string) => {
    console.log("Assigning to speaker:", speaker, selectedQuestions);
    setSelectedQuestions([]);
  };

  const handleExport = () => {
    const csv = [
      ["Question", "Sentiment", "Compliance Risk", "Upvotes", "Speaker"],
      ...filteredQuestions.map((q) => [
        q.text,
        q.sentiment,
        q.complianceRisk,
        q.upvotes,
        q.speaker,
      ]),
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "questions.csv";
    a.click();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50">
        <div className="container py-6">
          <h1 className="text-3xl font-bold text-foreground">Advanced Q&A</h1>
          <p className="text-muted-foreground mt-2">
            Filter, sort, and bulk manage questions
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="border-b border-border bg-card/30">
        <div className="container py-6">
          <div className="flex gap-4 items-center flex-wrap">
            <Filter className="w-5 h-5 text-muted-foreground" />

            <select
              value={filters.sentiment}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  sentiment: e.target.value as typeof filters.sentiment,
                })
              }
              className="px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm"
            >
              <option value="all">All Sentiments</option>
              <option value="positive">Positive</option>
              <option value="negative">Negative</option>
              <option value="neutral">Neutral</option>
            </select>

            <select
              value={filters.compliance}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  compliance: e.target.value as typeof filters.compliance,
                })
              }
              className="px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm"
            >
              <option value="all">All Compliance Levels</option>
              <option value="high">High Risk</option>
              <option value="medium">Medium Risk</option>
              <option value="low">Low Risk</option>
            </select>

            <select
              value={filters.status}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  status: e.target.value as typeof filters.status,
                })
              }
              className="px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm"
            >
              <option value="all">All Statuses</option>
              <option value="submitted">Submitted</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>

            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container py-8">
        {/* Bulk Actions */}
        {selectedQuestions.length > 0 && (
          <Card className="p-4 mb-6 bg-primary/10 border-primary/20">
            <div className="flex justify-between items-center">
              <p className="text-sm font-medium text-foreground">
                {selectedQuestions.length} question
                {selectedQuestions.length !== 1 ? "s" : ""} selected
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="default"
                  onClick={handleBulkApprove}
                  className="gap-2"
                >
                  <Check className="w-4 h-4" />
                  Approve All
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleBulkReject}
                  className="gap-2"
                >
                  <X className="w-4 h-4" />
                  Reject All
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedQuestions([])}
                >
                  Clear Selection
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Questions List */}
        <div className="space-y-4">
          {/* Select All Header */}
          <div className="flex items-center gap-4 px-4 py-3 bg-card/50 rounded-lg border border-border">
            <input
              type="checkbox"
              checked={
                filteredQuestions.length > 0 &&
                selectedQuestions.length === filteredQuestions.length
              }
              onChange={handleSelectAll}
              className="w-4 h-4 rounded"
            />
            <span className="text-sm font-medium text-foreground">
              {filteredQuestions.length} question
              {filteredQuestions.length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Questions */}
          {filteredQuestions.map((question) => (
            <Card
              key={question.id}
              className="p-4 hover:bg-card/80 transition-colors cursor-pointer"
              onClick={() => {
                setSelectedQuestions((prev) =>
                  prev.includes(question.id)
                    ? prev.filter((id) => id !== question.id)
                    : [...prev, question.id]
                );
              }}
            >
              <div className="flex gap-4">
                <input
                  type="checkbox"
                  checked={selectedQuestions.includes(question.id)}
                  onChange={() => {}}
                  className="w-4 h-4 rounded mt-1"
                />

                <div className="flex-1">
                  <p className="font-medium text-foreground">{question.text}</p>

                  <div className="flex gap-2 mt-3 flex-wrap">
                    {/* Sentiment Badge */}
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        question.sentiment === "positive"
                          ? "bg-green-500/20 text-green-600"
                          : question.sentiment === "negative"
                            ? "bg-red-500/20 text-red-600"
                            : "bg-gray-500/20 text-gray-600"
                      }`}
                    >
                      {question.sentiment}
                    </span>

                    {/* Compliance Badge */}
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        question.complianceRisk === "high"
                          ? "bg-red-500/20 text-red-600"
                          : question.complianceRisk === "medium"
                            ? "bg-yellow-500/20 text-yellow-600"
                            : "bg-green-500/20 text-green-600"
                      }`}
                    >
                      {question.complianceRisk} risk
                    </span>

                    {/* Speaker */}
                    <span className="px-2 py-1 rounded text-xs font-medium bg-blue-500/20 text-blue-600">
                      {question.speaker}
                    </span>

                    {/* Upvotes */}
                    <span className="px-2 py-1 rounded text-xs font-medium bg-muted text-muted-foreground">
                      {question.upvotes} upvotes
                    </span>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleBulkApprove();
                    }}
                  >
                    <Check className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleBulkReject();
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
