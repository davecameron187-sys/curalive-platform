/**
 * Handoff Dialog Component
 * Allows operators to select a target operator and complete session handoff
 */

import React, { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle, CheckCircle, Loader2, Users } from "lucide-react";

export interface HandoffDialogProps {
  sessionId: string;
  currentOperatorId: string;
  currentOperatorName?: string;
  onHandoffSuccess?: () => void;
  onCancel?: () => void;
}

export const HandoffDialog: React.FC<HandoffDialogProps> = ({
  sessionId,
  currentOperatorId,
  currentOperatorName,
  onHandoffSuccess,
  onCancel,
}) => {
  const [selectedOperatorId, setSelectedOperatorId] = useState("");
  const [handoffNotes, setHandoffNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch available operators (all except current)
  const { data: operators = [], isLoading: operatorsLoading } = trpc.operator.getAvailableOperators.useQuery(
    { excludeId: currentOperatorId },
    { enabled: !!currentOperatorId }
  );

  // Handoff mutation
  const handoffMutation = trpc.session.handoffSession.useMutation({
    onSuccess: () => {
      setError(null);
      onHandoffSuccess?.();
    },
    onError: (err) => {
      setError(err.message || "Failed to handoff session");
    },
  });

  const handleSubmit = async () => {
    if (!selectedOperatorId) {
      setError("Please select a target operator");
      return;
    }

    setIsSubmitting(true);
    try {
      await handoffMutation.mutateAsync({
        sessionId,
        targetOperatorId: selectedOperatorId,
        handoffNotes: handoffNotes.trim(),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4 p-6">
        <div className="mb-6">
          <h2 className="text-xl font-bold mb-2">Handoff Session</h2>
          <p className="text-sm text-muted-foreground">
            Transfer this session to another operator
          </p>
        </div>

        {/* Current Operator Info */}
        <div className="bg-muted/50 rounded-lg p-3 mb-6">
          <p className="text-xs text-muted-foreground mb-1">Current Operator</p>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            <span className="font-medium">{currentOperatorName || "Unknown"}</span>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Target Operator Selector */}
        <div className="mb-4">
          <label className="text-sm font-medium mb-2 block">Select Target Operator</label>
          {operatorsLoading ? (
            <div className="flex items-center justify-center p-3 bg-muted rounded-lg">
              <Loader2 className="w-4 h-4 animate-spin" />
            </div>
          ) : operators.length === 0 ? (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">No other operators available</p>
            </div>
          ) : (
            <Select value={selectedOperatorId} onValueChange={setSelectedOperatorId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose an operator..." />
              </SelectTrigger>
              <SelectContent>
                {operators.map((op: any) => (
                  <SelectItem key={op.id} value={op.id}>
                    <div className="flex items-center gap-2">
                      <span>{op.name}</span>
                      {op.status === "available" && (
                        <Badge className="bg-green-600 text-white text-xs">Available</Badge>
                      )}
                      {op.status === "busy" && (
                        <Badge className="bg-yellow-600 text-white text-xs">Busy</Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Handoff Notes */}
        <div className="mb-6">
          <label className="text-sm font-medium mb-2 block">Handoff Notes (Optional)</label>
          <Textarea
            value={handoffNotes}
            onChange={(e) => setHandoffNotes(e.target.value)}
            placeholder="Add any notes for the receiving operator..."
            className="min-h-24 resize-none"
          />
          <p className="text-xs text-muted-foreground mt-1">
            These notes will be visible to the operator receiving this session
          </p>
        </div>

        {/* Selected Operator Summary */}
        {selectedOperatorId && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6 flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-blue-900">Ready to handoff</p>
              <p className="text-xs text-blue-700 mt-1">
                Session will be transferred to{" "}
                <span className="font-semibold">
                  {operators.find((op: any) => op.id === selectedOperatorId)?.name}
                </span>
              </p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            className="flex-1"
            onClick={handleSubmit}
            disabled={!selectedOperatorId || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Handing off...
              </>
            ) : (
              "Complete Handoff"
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default HandoffDialog;
