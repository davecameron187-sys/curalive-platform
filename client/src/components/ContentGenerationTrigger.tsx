import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Zap, CheckCircle, AlertCircle } from "lucide-react";

interface ContentGenerationTriggerProps {
  eventId: number;
  transcript: string;
  sentimentData?: {
    overallSentiment: string;
    averageScore: number;
    keyMoments: string[];
  };
  onSuccess?: (contentIds: number[]) => void;
}

export default function ContentGenerationTrigger({
  eventId,
  transcript,
  sentimentData,
  onSuccess,
}: ContentGenerationTriggerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([
    "event_summary",
    "press_release",
    "follow_up_email",
  ]);

  const triggerMutation = trpc.contentTriggers.triggerEventCompletion.useMutation();
  const generateTypeMutation = trpc.contentTriggers.generateContentType.useMutation();

  const contentTypes = [
    {
      id: "event_summary",
      label: "Event Summary",
      description: "2-3 paragraph executive summary",
    },
    {
      id: "press_release",
      label: "Press Release",
      description: "Professional press release (250-350 words)",
    },
    {
      id: "follow_up_email",
      label: "Follow-Up Email",
      description: "Personalized email template for IR contacts",
    },
    {
      id: "talking_points",
      label: "Talking Points",
      description: "5-7 key discussion points",
    },
    {
      id: "qa_analysis",
      label: "Q&A Analysis",
      description: "Analysis of questions and sentiment",
    },
    {
      id: "sentiment_report",
      label: "Sentiment Report",
      description: "Detailed sentiment and engagement analysis",
    },
  ];

  const handleGenerateAll = async () => {
    try {
      const result = await triggerMutation.mutateAsync({
        eventId,
        transcript,
        sentimentData,
      });

      if (result.success) {
        onSuccess?.(result.contentIds);
      }
    } catch (error) {
      console.error("Failed to generate content:", error);
    }
  };

  const handleGenerateType = async (contentType: string) => {
    try {
      const result = await generateTypeMutation.mutateAsync({
        eventId,
        contentType: contentType as any,
        transcript,
        sentimentData,
      });

      if (result.success) {
        onSuccess?.([result.contentId || 0]);
      }
    } catch (error) {
      console.error("Failed to generate content:", error);
    }
  };

  const toggleContentType = (typeId: string) => {
    setSelectedTypes((prev) =>
      prev.includes(typeId) ? prev.filter((t) => t !== typeId) : [...prev, typeId]
    );
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-500" />
              AI Content Generation
            </CardTitle>
            <CardDescription>
              Automatically generate summaries, press releases, and more
            </CardDescription>
          </div>
          <Button
            variant="outline"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? "Collapse" : "Expand"}
          </Button>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-6">
          {/* Status Messages */}
          {triggerMutation.isSuccess && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                {triggerMutation.data.message}
              </AlertDescription>
            </Alert>
          )}

          {triggerMutation.isError && (
            <Alert className="bg-red-50 border-red-200">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                Failed to generate content. Please try again.
              </AlertDescription>
            </Alert>
          )}

          {/* Quick Generate All Button */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-900 mb-2">Quick Generate</h4>
            <p className="text-sm text-blue-800 mb-4">
              Generate all content types at once for operator review
            </p>
            <Button
              onClick={handleGenerateAll}
              disabled={triggerMutation.isPending}
              className="w-full"
            >
              {triggerMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating Content...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Generate All Content Types
                </>
              )}
            </Button>
          </div>

          {/* Individual Content Type Selection */}
          <div>
            <h4 className="font-semibold mb-3">Generate Specific Content Types</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {contentTypes.map((type) => (
                <div
                  key={type.id}
                  className="flex items-start gap-3 p-3 border border-border rounded-lg hover:bg-secondary/50 transition-colors"
                >
                  <input
                    type="checkbox"
                    id={type.id}
                    checked={selectedTypes.includes(type.id)}
                    onChange={() => toggleContentType(type.id)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <label
                      htmlFor={type.id}
                      className="font-medium text-sm cursor-pointer"
                    >
                      {type.label}
                    </label>
                    <p className="text-xs text-muted-foreground">{type.description}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleGenerateType(type.id)}
                    disabled={generateTypeMutation.isPending}
                  >
                    {generateTypeMutation.isPending ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Zap className="w-3 h-3" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Information */}
          <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
            <h4 className="font-semibold text-amber-900 mb-2">ℹ️ How It Works</h4>
            <ul className="text-sm text-amber-800 space-y-1">
              <li>• AI analyzes event transcript and sentiment data</li>
              <li>• Generates professional content for each type</li>
              <li>• Content appears in AI Dashboard for review</li>
              <li>• Operators can edit and approve before sending</li>
              <li>• Full audit trail of all approvals and sends</li>
            </ul>
          </div>

          {/* Transcript Preview */}
          <div>
            <h4 className="font-semibold mb-2">Transcript Preview</h4>
            <div className="bg-secondary p-3 rounded-lg max-h-32 overflow-y-auto">
              <p className="text-sm text-muted-foreground font-mono">
                {transcript.substring(0, 300)}...
              </p>
            </div>
          </div>

          {/* Sentiment Data */}
          {sentimentData && (
            <div>
              <h4 className="font-semibold mb-2">Sentiment Analysis</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-secondary p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground">Overall Sentiment</p>
                  <p className="text-lg font-semibold">{sentimentData.overallSentiment}</p>
                </div>
                <div className="bg-secondary p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground">Average Score</p>
                  <p className="text-lg font-semibold">
                    {(sentimentData.averageScore * 100).toFixed(0)}%
                  </p>
                </div>
              </div>
              {sentimentData.keyMoments.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs text-muted-foreground mb-2">Key Moments</p>
                  <div className="flex flex-wrap gap-2">
                    {sentimentData.keyMoments.slice(0, 3).map((moment, idx) => (
                      <Badge key={idx} variant="secondary">
                        {moment}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
