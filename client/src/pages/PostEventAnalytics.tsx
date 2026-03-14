import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Loader2, Download, Copy, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

/**
 * PostEventAnalytics Page
 * 
 * Displays post-event data including AI summaries, compliance scores, engagement metrics, and transcripts.
 */
export default function PostEventAnalytics({ eventId }: { eventId: string }) {
  const [postEventData, setPostEventData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"summary" | "transcript" | "metrics" | "compliance">("summary");

  // Fetch post-event data
  const getPostEventDataQuery = trpc.persistence.postEvent.get.useQuery(
    { eventId },
    {
      onSuccess: (data) => {
        setPostEventData(data);
        setLoading(false);
      },
      onError: (error) => {
        console.error("Failed to fetch post-event data:", error);
        toast.error("Failed to load post-event data");
        setLoading(false);
      },
    }
  );

  const handleDownloadTranscript = () => {
    if (!postEventData?.fullTranscript) {
      toast.error("No transcript available");
      return;
    }

    const element = document.createElement("a");
    const file = new Blob([postEventData.fullTranscript], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = `transcript-${eventId}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success("Transcript downloaded");
  };

  const handleCopyTranscript = () => {
    if (!postEventData?.fullTranscript) {
      toast.error("No transcript available");
      return;
    }

    navigator.clipboard.writeText(postEventData.fullTranscript);
    toast.success("Transcript copied to clipboard");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!postEventData) {
    return (
      <Card className="p-8 text-center">
        <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">No post-event data available</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Post-Event Analytics</h1>
        <p className="text-muted-foreground mt-1">Event ID: {eventId}</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Compliance Score</p>
          <div className="flex items-center gap-2">
            <p className="text-2xl font-bold">{postEventData.complianceScore || "—"}%</p>
            {postEventData.complianceScore && postEventData.complianceScore >= 80 && (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            )}
          </div>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Engagement Score</p>
          <div className="flex items-center gap-2">
            <p className="text-2xl font-bold">{postEventData.engagementScore || "—"}%</p>
          </div>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Total Participants</p>
          <p className="text-2xl font-bold">{postEventData.totalParticipants || "—"}</p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Duration</p>
          <p className="text-2xl font-bold">
            {postEventData.totalDuration
              ? `${Math.floor(postEventData.totalDuration / 60)}m`
              : "—"}
          </p>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border">
        {(["summary", "transcript", "metrics", "compliance"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-medium text-sm transition-colors ${
              activeTab === tab
                ? "text-primary border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="space-y-4">
        {/* Summary Tab */}
        {activeTab === "summary" && (
          <Card className="p-6">
            <h3 className="font-semibold mb-4">AI-Generated Summary</h3>
            {postEventData.aiSummary ? (
              <div className="space-y-4">
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {postEventData.aiSummary}
                </p>

                {postEventData.keyTopics && (
                  <div>
                    <h4 className="font-medium text-sm mb-2">Key Topics</h4>
                    <div className="flex flex-wrap gap-2">
                      {postEventData.keyTopics.split(",").map((topic: string, idx: number) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-primary/10 text-primary text-xs rounded-full"
                        >
                          {topic.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {postEventData.keyQuotes && (
                  <div>
                    <h4 className="font-medium text-sm mb-2">Key Quotes</h4>
                    <div className="space-y-2">
                      {postEventData.keyQuotes.split("|").map((quote: string, idx: number) => (
                        <p key={idx} className="text-sm italic text-muted-foreground pl-4 border-l-2 border-primary">
                          "{quote.trim()}"
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No summary available</p>
            )}
          </Card>
        )}

        {/* Transcript Tab */}
        {activeTab === "transcript" && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Full Transcript</h3>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleCopyTranscript}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
                <Button variant="outline" size="sm" onClick={handleDownloadTranscript}>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>

            {postEventData.fullTranscript ? (
              <div className="bg-background p-4 rounded border border-border max-h-96 overflow-y-auto">
                <p className="text-sm whitespace-pre-wrap font-mono text-muted-foreground">
                  {postEventData.fullTranscript}
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No transcript available</p>
            )}
          </Card>
        )}

        {/* Metrics Tab */}
        {activeTab === "metrics" && (
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Engagement Metrics</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-background rounded border border-border">
                  <p className="text-xs text-muted-foreground mb-2">Engagement Score</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-white/20"
                        style={{ width: `${100 - (postEventData.engagementScore || 0)}%` }}
                      />
                    </div>
                    <span className="font-bold">{postEventData.engagementScore || 0}%</span>
                  </div>
                </div>

                <div className="p-4 bg-background rounded border border-border">
                  <p className="text-xs text-muted-foreground mb-2">Sentiment Trend</p>
                  <p className="text-sm font-medium">
                    {postEventData.sentimentTrends || "Not available"}
                  </p>
                </div>
              </div>

              {postEventData.analyticsData && (
                <div className="p-4 bg-background rounded border border-border">
                  <p className="text-xs text-muted-foreground mb-2">Raw Analytics</p>
                  <pre className="text-xs whitespace-pre-wrap font-mono overflow-auto max-h-48">
                    {JSON.stringify(JSON.parse(postEventData.analyticsData), null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Compliance Tab */}
        {activeTab === "compliance" && (
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Compliance Report</h3>
            <div className="space-y-4">
              <div className="p-4 bg-background rounded border border-border">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium">Compliance Score</p>
                  <p className="text-2xl font-bold">{postEventData.complianceScore || 0}%</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-white/20"
                      style={{ width: `${100 - (postEventData.complianceScore || 0)}%` }}
                    />
                  </div>
                </div>
              </div>

              {postEventData.flaggedItems && (
                <div className="p-4 bg-red-500/10 rounded border border-red-500/30">
                  <p className="font-medium text-sm mb-2 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Flagged Items
                  </p>
                  <div className="space-y-1 text-sm">
                    {postEventData.flaggedItems.split(",").map((item: string, idx: number) => (
                      <p key={idx} className="text-muted-foreground">
                        • {item.trim()}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              <div className="p-4 bg-green-500/10 rounded border border-green-500/30">
                <p className="font-medium text-sm mb-2 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Compliance Status
                </p>
                <p className="text-sm text-muted-foreground">
                  {postEventData.complianceScore && postEventData.complianceScore >= 80
                    ? "✓ Event meets compliance requirements"
                    : "⚠ Review flagged items for compliance"}
                </p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
