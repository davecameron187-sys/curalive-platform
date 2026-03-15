import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, CheckCircle, Clock, Zap, MessageSquare } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface ViolationDetailViewProps {
  violation: {
    id: number;
    eventId: string;
    violationType: string;
    severity: "low" | "medium" | "high" | "critical";
    confidenceScore: number;
    speakerName?: string;
    speakerRole?: string;
    transcriptExcerpt: string;
    startTimeMs?: number;
    endTimeMs?: number;
    acknowledged: boolean;
    acknowledgedBy?: number;
    acknowledgedAt?: Date;
    notes?: string;
    actionTaken: "none" | "warning" | "mute" | "remove";
    createdAt: Date;
  };
  onAcknowledge?: () => void;
  transcriptContext?: {
    before: string;
    after: string;
  };
}

export function ViolationDetailView({
  violation,
  onAcknowledge,
  transcriptContext,
}: ViolationDetailViewProps) {
  const [notes, setNotes] = useState(violation.notes || "");
  const [isEditing, setIsEditing] = useState(false);

  const acknowledgeViolationMutation = trpc.aiAm.acknowledgeViolation.useMutation({
    onSuccess: () => {
      onAcknowledge?.();
    },
  });

  const updateNotesMutation = trpc.aiAm.updateViolationNotes.useMutation({
    onSuccess: () => {
      setIsEditing(false);
    },
  });

  // Get severity color
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-500/10 text-red-700 border-red-200";
      case "high":
        return "bg-orange-500/10 text-orange-700 border-orange-200";
      case "medium":
        return "bg-yellow-500/10 text-yellow-700 border-yellow-200";
      case "low":
        return "bg-blue-500/10 text-blue-700 border-blue-200";
      default:
        return "bg-gray-500/10 text-gray-700 border-gray-200";
    }
  };

  // Get severity badge color
  const getSeverityBadgeColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-600 text-white";
      case "high":
        return "bg-orange-600 text-white";
      case "medium":
        return "bg-yellow-600 text-white";
      case "low":
        return "bg-blue-600 text-white";
      default:
        return "bg-gray-600 text-white";
    }
  };

  // Get violation type label
  const getViolationTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      abuse: "Abuse",
      forward_looking: "Forward-Looking",
      price_sensitive: "Price-Sensitive",
      insider_info: "Insider Info",
      policy_breach: "Policy Breach",
      profanity: "Profanity",
      harassment: "Harassment",
      misinformation: "Misinformation",
    };
    return labels[type] || type;
  };

  return (
    <div className="space-y-4">
      {/* Header Card */}
      <Card className={`border-l-4 ${getSeverityColor(violation.severity)}`}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              {violation.acknowledged ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-orange-600" />
              )}
              <div>
                <CardTitle className="text-lg">
                  {getViolationTypeLabel(violation.violationType)}
                </CardTitle>
                <CardDescription>
                  Detected {new Date(violation.createdAt).toLocaleString()}
                </CardDescription>
              </div>
            </div>
            <Badge className={getSeverityBadgeColor(violation.severity)}>
              {violation.severity.toUpperCase()}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Metrics Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Confidence Score</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-secondary rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full"
                    style={{ width: `${violation.confidenceScore * 100}%` }}
                  />
                </div>
                <span className="text-sm font-medium">
                  {(violation.confidenceScore * 100).toFixed(0)}%
                </span>
              </div>
            </div>

            <div>
              <p className="text-xs text-muted-foreground mb-1">Status</p>
              <Badge variant={violation.acknowledged ? "default" : "destructive"}>
                {violation.acknowledged ? "Acknowledged" : "Unacknowledged"}
              </Badge>
            </div>

            <div>
              <p className="text-xs text-muted-foreground mb-1">Action Taken</p>
              <p className="text-sm font-medium capitalize">{violation.actionTaken}</p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground mb-1">Time Offset</p>
              <p className="text-sm font-medium">
                {violation.startTimeMs ? `${(violation.startTimeMs / 1000).toFixed(1)}s` : "—"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Speaker Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Speaker</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Name</p>
              <p className="text-sm font-medium">{violation.speakerName || "Unknown"}</p>
            </div>
            {violation.speakerRole && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Role</p>
                <p className="text-sm font-medium">{violation.speakerRole}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Transcript Context */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Transcript Context</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {transcriptContext?.before && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Before</p>
              <p className="text-sm text-muted-foreground italic">
                "{transcriptContext.before}"
              </p>
            </div>
          )}

          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-xs text-red-700 font-medium mb-1">Flagged Content</p>
            <p className="text-sm font-medium">"{violation.transcriptExcerpt}"</p>
          </div>

          {transcriptContext?.after && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">After</p>
              <p className="text-sm text-muted-foreground italic">
                "{transcriptContext.after}"
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Operator Notes</CardTitle>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <div className="space-y-2">
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes about this violation..."
                className="min-h-[100px]"
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() =>
                    updateNotesMutation.mutate({
                      violationId: violation.id,
                      notes,
                    })
                  }
                  disabled={updateNotesMutation.isPending}
                >
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setNotes(violation.notes || "");
                    setIsEditing(false);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div>
              {notes ? (
                <p className="text-sm text-muted-foreground mb-2">{notes}</p>
              ) : (
                <p className="text-sm text-muted-foreground italic">No notes added</p>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsEditing(true)}
              >
                Edit Notes
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      {!violation.acknowledged && (
        <Button
          onClick={() =>
            acknowledgeViolationMutation.mutate({
              violationId: violation.id,
              eventId: violation.eventId,
              notes: notes || undefined,
            })
          }
          disabled={acknowledgeViolationMutation.isPending}
          className="w-full"
          size="lg"
        >
          {acknowledgeViolationMutation.isPending ? "Acknowledging..." : "Acknowledge Violation"}
        </Button>
      )}

      {violation.acknowledged && violation.acknowledgedAt && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm font-medium">
                Acknowledged on {new Date(violation.acknowledgedAt).toLocaleString()}
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
