import React, { useState, useCallback } from "react";
import { useAblyChannel, useAblyPublish } from "@/hooks/useAblyChannel";
import { Types } from "ably";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle2, XCircle, AlertCircle, MessageSquare } from "lucide-react";

/**
 * RealtimeQaModeration Component
 * 
 * Real-time Q&A moderation interface with Ably integration.
 * Displays incoming questions and allows operators to approve/reject them.
 */
export function RealtimeQaModeration({ conferenceId }: { conferenceId: number }) {
  const [incomingQuestions, setIncomingQuestions] = useState<any[]>([]);
  const [approvedQuestions, setApprovedQuestions] = useState<any[]>([]);
  const [rejectedQuestions, setRejectedQuestions] = useState<any[]>([]);
  const [selectedQuestion, setSelectedQuestion] = useState<any>(null);

  const publishQaApproval = useAblyPublish(`occ:qa:${conferenceId}`);

  // Subscribe to incoming Q&A questions
  useAblyChannel(
    `occ:qa:${conferenceId}`,
    "qa.submitted",
    useCallback((message: Types.Message) => {
      const qaData = message.data;
      setIncomingQuestions((prev) => [
        ...prev,
        {
          id: `qa-${Date.now()}`,
          ...qaData,
          submittedAt: new Date().toISOString(),
        },
      ]);
      toast.info(`New question: "${qaData.question.substring(0, 50)}..."`);
    }, [conferenceId])
  );

  // Subscribe to Q&A approvals (for sync across operators)
  useAblyChannel(
    `occ:qa:${conferenceId}`,
    "qa.approved",
    useCallback((message: Types.Message) => {
      const qaData = message.data;
      setApprovedQuestions((prev) => [...prev, qaData]);
      setIncomingQuestions((prev) =>
        prev.filter((q) => q.id !== qaData.questionId)
      );
    }, [conferenceId])
  );

  // Subscribe to Q&A rejections
  useAblyChannel(
    `occ:qa:${conferenceId}`,
    "qa.rejected",
    useCallback((message: Types.Message) => {
      const qaData = message.data;
      setRejectedQuestions((prev) => [...prev, qaData]);
      setIncomingQuestions((prev) =>
        prev.filter((q) => q.id !== qaData.questionId)
      );
    }, [conferenceId])
  );

  const handleApproveQuestion = async (question: any) => {
    try {
      await publishQaApproval("qa.approved", {
        questionId: question.id,
        question: question.question,
        asker: question.asker,
        approvedBy: "Moderator",
        approvedAt: new Date().toISOString(),
      });

      setApprovedQuestions((prev) => [...prev, question]);
      setIncomingQuestions((prev) =>
        prev.filter((q) => q.id !== question.id)
      );
      setSelectedQuestion(null);
      toast.success("Question approved!");
    } catch (error) {
      console.error("Failed to approve question:", error);
      toast.error("Failed to approve question");
    }
  };

  const handleRejectQuestion = async (question: any, reason: string) => {
    try {
      await publishQaApproval("qa.rejected", {
        questionId: question.id,
        question: question.question,
        asker: question.asker,
        rejectedBy: "Moderator",
        reason,
        rejectedAt: new Date().toISOString(),
      });

      setRejectedQuestions((prev) => [...prev, question]);
      setIncomingQuestions((prev) =>
        prev.filter((q) => q.id !== question.id)
      );
      setSelectedQuestion(null);
      toast.success("Question rejected");
    } catch (error) {
      console.error("Failed to reject question:", error);
      toast.error("Failed to reject question");
    }
  };

  return (
    <div className="grid grid-cols-3 gap-4">
      {/* Incoming Questions */}
      <Card className="p-4 col-span-2">
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare className="h-5 w-5 text-amber-500" />
          <h3 className="font-semibold">Incoming Questions ({incomingQuestions.length})</h3>
        </div>

        {incomingQuestions.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            No incoming questions
          </p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {incomingQuestions.map((question) => (
              <div
                key={question.id}
                className={`p-3 rounded border cursor-pointer transition-colors ${
                  selectedQuestion?.id === question.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
                onClick={() => setSelectedQuestion(question)}
              >
                <p className="font-medium text-sm">{question.question}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  From: {question.asker || "Anonymous"}
                </p>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Question Details & Actions */}
      <Card className="p-4">
        <h3 className="font-semibold mb-4">Moderation</h3>

        {selectedQuestion ? (
          <div className="space-y-4">
            <div className="p-3 bg-background rounded border border-border">
              <p className="text-sm font-medium mb-2">Question:</p>
              <p className="text-sm text-muted-foreground">
                {selectedQuestion.question}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                From: {selectedQuestion.asker || "Anonymous"}
              </p>
            </div>

            <div className="space-y-2">
              <Button
                className="w-full bg-green-600 hover:bg-green-700"
                onClick={() => handleApproveQuestion(selectedQuestion)}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Approve
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => handleRejectQuestion(selectedQuestion, "Off-topic")}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">
            Select a question to moderate
          </p>
        )}
      </Card>

      {/* Approved Questions */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle2 className="h-5 w-5 text-green-500" />
          <h3 className="font-semibold">Approved ({approvedQuestions.length})</h3>
        </div>

        <div className="space-y-2 max-h-48 overflow-y-auto">
          {approvedQuestions.slice(-5).map((question, idx) => (
            <div key={idx} className="p-2 bg-green-500/10 rounded border border-green-500/30 text-xs">
              <p className="font-medium">{question.question?.substring(0, 40)}...</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Rejected Questions */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <XCircle className="h-5 w-5 text-red-500" />
          <h3 className="font-semibold">Rejected ({rejectedQuestions.length})</h3>
        </div>

        <div className="space-y-2 max-h-48 overflow-y-auto">
          {rejectedQuestions.slice(-5).map((question, idx) => (
            <div key={idx} className="p-2 bg-red-500/10 rounded border border-red-500/30 text-xs">
              <p className="font-medium">{question.question?.substring(0, 40)}...</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
