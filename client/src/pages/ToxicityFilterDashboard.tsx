import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertCircle,
  CheckCircle2,
  Shield,
  AlertTriangle,
  Search,
  Eye,
  Loader2,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";

interface FlaggedContent {
  id: number;
  contentText: string;
  toxicityScore: number;
  toxicityCategory: "abusive" | "harassing" | "price_sensitive" | "confidential" | "spam" | "legal_risk";
  riskLevel: "low" | "medium" | "high" | "critical";
  recommendedAction: "approve" | "review" | "flag" | "block" | "redact";
  moderatorReviewed?: boolean;
  moderatorDecision?: "approved" | "rejected" | "flagged";
  createdAt: string;
}

export default function ToxicityFilterDashboard() {
  const [eventId, setEventId] = useState<string>("");
  const [selectedRiskLevel, setSelectedRiskLevel] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedContent, setSelectedContent] = useState<FlaggedContent | null>(null);
  const [moderatorNotes, setModeratorNotes] = useState("");
  const [showReviewModal, setShowReviewModal] = useState(false);

  // tRPC queries and mutations
  const flaggedContentQuery = trpc.aiFeatures.toxicityFilter.getEventToxicityResults.useQuery(
    { eventId: eventId || "" },
    { enabled: !!eventId }
  );

  const toxicityStatsQuery = trpc.aiFeatures.toxicityFilter.getToxicityStats.useQuery(
    { eventId: eventId || "" },
    { enabled: !!eventId }
  );

  const approveFlagMutation = trpc.aiFeatures.toxicityFilter.approveToxicityFlag.useMutation();
  const rejectFlagMutation = trpc.aiFeatures.toxicityFilter.rejectToxicityFlag.useMutation();
  const blockContentMutation = trpc.aiFeatures.toxicityFilter.blockToxicContent.useMutation();
  const redactContentMutation = trpc.aiFeatures.toxicityFilter.redactToxicContent.useMutation();

  const flaggedContent = flaggedContentQuery.data || [];
  const stats = toxicityStatsQuery.data;

  const categoryConfig = {
    abusive: { color: "bg-red-500/10", textColor: "text-red-600", label: "Abusive", icon: "⚠" },
    harassing: { color: "bg-red-500/10", textColor: "text-red-600", label: "Harassing", icon: "!" },
    price_sensitive: {
      color: "bg-orange-500/10",
      textColor: "text-orange-600",
      label: "Price Sensitive",
      icon: "$",
    },
    confidential: {
      color: "bg-purple-500/10",
      textColor: "text-purple-600",
      label: "Confidential",
      icon: "🔒",
    },
    spam: { color: "bg-yellow-500/10", textColor: "text-yellow-600", label: "Spam", icon: "📧" },
    legal_risk: { color: "bg-red-500/10", textColor: "text-red-600", label: "Legal Risk", icon: "⚖" },
  };

  const riskLevelConfig = {
    low: { color: "bg-green-500/10", textColor: "text-green-600", label: "Low" },
    medium: { color: "bg-yellow-500/10", textColor: "text-yellow-600", label: "Medium" },
    high: { color: "bg-orange-500/10", textColor: "text-orange-600", label: "High" },
    critical: { color: "bg-red-500/10", textColor: "text-red-600", label: "Critical" },
  };

  const filteredContent = useMemo(() => {
    return flaggedContent.filter((c) => {
      const riskMatch = selectedRiskLevel === "all" || c.riskLevel === selectedRiskLevel;
      const searchMatch = searchTerm === "" || c.contentText.toLowerCase().includes(searchTerm.toLowerCase());
      return riskMatch && searchMatch;
    });
  }, [flaggedContent, selectedRiskLevel, searchTerm]);

  const handleApproveFlag = async (contentId: number) => {
    try {
      await approveFlagMutation.mutateAsync({
        flagId: contentId,
        notes: moderatorNotes || undefined,
      });
      toast.success("Content approved!");
      setModeratorNotes("");
      setShowReviewModal(false);
      flaggedContentQuery.refetch();
      toxicityStatsQuery.refetch();
    } catch (error) {
      toast.error("Failed to approve content");
    }
  };

  const handleRejectFlag = async (contentId: number) => {
    try {
      await rejectFlagMutation.mutateAsync({
        flagId: contentId,
        notes: moderatorNotes || undefined,
      });
      toast.success("Flag rejected");
      setModeratorNotes("");
      setShowReviewModal(false);
      flaggedContentQuery.refetch();
      toxicityStatsQuery.refetch();
    } catch (error) {
      toast.error("Failed to reject flag");
    }
  };

  const handleBlockContent = async (contentId: number) => {
    if (!confirm("Block this content? It will be hidden from the Q&A queue.")) return;
    try {
      await blockContentMutation.mutateAsync({ contentId });
      toast.success("Content blocked");
      flaggedContentQuery.refetch();
      toxicityStatsQuery.refetch();
    } catch (error) {
      toast.error("Failed to block content");
    }
  };

  const handleRedactContent = async (contentId: number) => {
    try {
      await redactContentMutation.mutateAsync({ contentId });
      toast.success("Content redacted");
      flaggedContentQuery.refetch();
      toxicityStatsQuery.refetch();
    } catch (error) {
      toast.error("Failed to redact content");
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Toxicity & Compliance Filter</h1>
          <p className="text-muted-foreground">
            AI-powered content moderation with risk assessment and recommended actions
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
          <>
            {/* Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <Card className="p-4 border-border">
                <p className="text-xs text-muted-foreground mb-1">Flagged Items</p>
                <p className="text-2xl font-bold">{stats.totalFlagged}</p>
              </Card>
              <Card className="p-4 border-border">
                <p className="text-xs text-muted-foreground mb-1">Critical</p>
                <p className="text-2xl font-bold text-red-600">{stats.criticalCount}</p>
              </Card>
              <Card className="p-4 border-border">
                <p className="text-xs text-muted-foreground mb-1">Blocked</p>
                <p className="text-2xl font-bold text-orange-600">{stats.blockedCount}</p>
              </Card>
              <Card className="p-4 border-border">
                <p className="text-xs text-muted-foreground mb-1">Avg Toxicity</p>
                <p className="text-2xl font-bold">{stats.averageToxicityScore.toFixed(2)}</p>
              </Card>
            </div>

            {/* Filters */}
            <div className="mb-6 space-y-4">
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant={selectedRiskLevel === "all" ? "default" : "outline"}
                  onClick={() => setSelectedRiskLevel("all")}
                  size="sm"
                >
                  All ({flaggedContent.length})
                </Button>
                {Object.entries(riskLevelConfig).map(([key, config]) => {
                  const count = flaggedContent.filter((c) => c.riskLevel === key).length;
                  return (
                    <Button
                      key={key}
                      variant={selectedRiskLevel === key ? "default" : "outline"}
                      onClick={() => setSelectedRiskLevel(key)}
                      size="sm"
                      className={selectedRiskLevel === key ? "" : "border-border"}
                    >
                      {config.label} ({count})
                    </Button>
                  );
                })}
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search flagged content..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Flagged Content List */}
            <div className="space-y-3">
              {filteredContent.length === 0 ? (
                <Card className="p-8 text-center border-border">
                  <Shield className="w-8 h-8 text-green-600 mx-auto mb-2 opacity-50" />
                  <p className="text-muted-foreground">No flagged content in this event</p>
                </Card>
              ) : (
                filteredContent.map((content) => {
                  const categoryConfig_ = categoryConfig[content.toxicityCategory];
                  const riskConfig = riskLevelConfig[content.riskLevel];
                  return (
                    <Card
                      key={content.id}
                      className={`p-4 border-l-4 cursor-pointer transition-all hover:border-primary ${riskConfig.color}`}
                      style={{ borderLeftColor: riskConfig.textColor }}
                      onClick={() => {
                        setSelectedContent(content);
                        setShowReviewModal(true);
                      }}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <Badge className={`${riskConfig.color} ${riskConfig.textColor} border-0`}>
                              {riskConfig.label} Risk
                            </Badge>
                            <Badge className={`${categoryConfig_.color} ${categoryConfig_.textColor} border-0`}>
                              {categoryConfig_.label}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {(content.toxicityScore * 100).toFixed(0)}% toxicity
                            </span>
                          </div>
                          <p className="text-sm font-medium text-foreground break-words">{content.contentText}</p>

                          <div className="mt-2 text-xs text-muted-foreground">
                            <span className="font-semibold">Recommended:</span> {content.recommendedAction}
                          </div>

                          {content.moderatorAction && (
                            <div className="mt-2 text-xs flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              <span className="text-green-600">
                                {content.moderatorAction === "approved"
                                  ? "Approved by moderator"
                                  : content.moderatorAction === "rejected"
                                    ? "Rejected by moderator"
                                    : "Flagged by moderator"}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2 flex-shrink-0">
                          {!content.moderatorAction && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleApproveFlag(content.id);
                                }}
                                disabled={approveFlagMutation.isPending}
                                className="border-green-500/20 text-green-600 hover:bg-green-500/10"
                              >
                                <CheckCircle2 className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleBlockContent(content.id);
                                }}
                                disabled={blockContentMutation.isPending}
                                className="border-red-500/20 text-red-600 hover:bg-red-500/10"
                              >
                                <AlertTriangle className="w-3 h-3" />
                              </Button>
                            </>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRedactContent(content.id);
                            }}
                            disabled={redactContentMutation.isPending}
                            className="border-amber-500/20 text-amber-600 hover:bg-amber-500/10"
                          >
                            <Eye className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  );
                })
              )}
            </div>
          </>
        )}

        {/* Review Modal */}
        {showReviewModal && selectedContent && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-2xl border-border">
              <CardHeader>
                <CardTitle>Review Flagged Content</CardTitle>
                <CardDescription>Decide how to handle this content</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Content</p>
                  <p className="text-foreground p-3 bg-card rounded border border-border">{selectedContent.contentText}</p>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Risk Level</p>
                    <Badge className={`${riskLevelConfig[selectedContent.riskLevel].color}`}>
                      {riskLevelConfig[selectedContent.riskLevel].label}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Category</p>
                    <Badge className={`${categoryConfig[selectedContent.toxicityCategory].color}`}>
                      {categoryConfig[selectedContent.toxicityCategory].label}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Toxicity Score</p>
                    <p className="text-foreground font-semibold">{(selectedContent.toxicityScore * 100).toFixed(0)}%</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Recommended Action</p>
                  <Badge variant="secondary">{selectedContent.recommendedAction}</Badge>
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Moderator Notes (Optional)
                  </label>
                  <Textarea
                    placeholder="Document your decision..."
                    value={moderatorNotes}
                    onChange={(e) => setModeratorNotes(e.target.value)}
                    className="min-h-20 resize-none"
                  />
                </div>

                <div className="flex gap-2 justify-end flex-wrap">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowReviewModal(false);
                      setModeratorNotes("");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      handleBlockContent(selectedContent.id);
                      setShowReviewModal(false);
                      setModeratorNotes("");
                    }}
                    disabled={blockContentMutation.isPending}
                  >
                    {blockContentMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Blocking...
                      </>
                    ) : (
                      "Block Content"
                    )}
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      handleRedactContent(selectedContent.id);
                      setShowReviewModal(false);
                      setModeratorNotes("");
                    }}
                    disabled={redactContentMutation.isPending}
                  >
                    Redact
                  </Button>
                  <Button
                    onClick={() => {
                      handleApproveFlag(selectedContent.id);
                      setShowReviewModal(false);
                    }}
                    disabled={approveFlagMutation.isPending}
                  >
                    {approveFlagMutation.isPending ? (
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
