import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle, CheckCircle2, Copy, Trash2, Eye, ThumbsUp } from "lucide-react";
import { toast } from "sonner";

interface GeneratedBrief {
  id: number;
  briefTitle: string;
  briefSummary: string;
  keyMessages: Array<{
    title: string;
    description: string;
    emphasis: "high" | "medium" | "low";
  }>;
  talkingPoints: Array<{
    topic: string;
    points: string[];
    speakerNotes?: string;
  }>;
  anticipatedQuestions: Array<{
    question: string;
    suggestedAnswer: string;
    difficulty: "easy" | "medium" | "hard";
  }>;
  financialHighlights: Array<{
    metric: string;
    value: string;
    context?: string;
  }>;
  generationConfidence: number;
}

export default function EventBriefGenerator() {
  const [conferenceId, setConferenceId] = useState<number | null>(null);
  const [pressRelease, setPressRelease] = useState("");
  const [pressReleaseTitle, setPressReleaseTitle] = useState("");
  const [eventId, setEventId] = useState("");
  const [generatedBrief, setGeneratedBrief] = useState<GeneratedBrief | null>(null);
  const [selectedBriefId, setSelectedBriefId] = useState<number | null>(null);
  const [approvalNotes, setApprovalNotes] = useState("");
  const [activeTab, setActiveTab] = useState("generate");

  // tRPC mutations and queries
  const generateBriefMutation = trpc.eventBrief.generateBrief.useMutation();
  const approveBriefMutation = trpc.eventBrief.approveBrief.useMutation();
  const deleteBriefMutation = trpc.eventBrief.deleteBrief.useMutation();
  const markAsUsedMutation = trpc.eventBrief.markBriefAsUsed.useMutation();
  const updateNotesMutation = trpc.eventBrief.updateBriefNotes.useMutation();

  const conferenceBriefsQuery = trpc.eventBrief.getConferenceBriefs.useQuery(
    { conferenceId: conferenceId || 0 },
    { enabled: !!conferenceId }
  );

  const conferenceStatsQuery = trpc.eventBrief.getConferenceBriefStats.useQuery(
    { conferenceId: conferenceId || 0 },
    { enabled: !!conferenceId }
  );

  const handleGenerateBrief = async () => {
    if (!pressRelease.trim()) {
      toast.error("Please enter a press release");
      return;
    }

    if (!conferenceId) {
      toast.error("Please select a conference");
      return;
    }

    try {
      const result = await generateBriefMutation.mutateAsync({
        pressRelease,
        pressReleaseTitle: pressReleaseTitle || undefined,
        conferenceId,
        eventId: eventId || undefined,
      });

      setGeneratedBrief(result);
      setSelectedBriefId(result.id);
      toast.success("Brief generated successfully!");
    } catch (error) {
      toast.error("Failed to generate brief");
      console.error(error);
    }
  };

  const handleApproveBrief = async () => {
    if (!selectedBriefId) return;

    try {
      await approveBriefMutation.mutateAsync({
        briefId: selectedBriefId,
        notes: approvalNotes || undefined,
      });

      toast.success("Brief approved!");
      setApprovalNotes("");
      conferenceBriefsQuery.refetch();
      conferenceStatsQuery.refetch();
    } catch (error) {
      toast.error("Failed to approve brief");
    }
  };

  const handleDeleteBrief = async (briefId: number) => {
    if (!confirm("Are you sure you want to delete this brief?")) return;

    try {
      await deleteBriefMutation.mutateAsync({ briefId });
      toast.success("Brief deleted");
      if (selectedBriefId === briefId) {
        setGeneratedBrief(null);
        setSelectedBriefId(null);
      }
      conferenceBriefsQuery.refetch();
      conferenceStatsQuery.refetch();
    } catch (error) {
      toast.error("Failed to delete brief");
    }
  };

  const handleMarkAsUsed = async (briefId: number) => {
    try {
      await markAsUsedMutation.mutateAsync({ briefId });
      toast.success("Brief marked as used in event");
      conferenceBriefsQuery.refetch();
      conferenceStatsQuery.refetch();
    } catch (error) {
      toast.error("Failed to mark brief as used");
    }
  };

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const stats = conferenceStatsQuery.data;
  const briefs = conferenceBriefsQuery.data || [];

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Event Brief Generator</h1>
          <p className="text-muted-foreground">
            Convert press releases into structured event briefs with talking points and Q&A prep
          </p>
        </div>

        {/* Conference Selection */}
        <Card className="mb-6 border-border">
          <CardHeader>
            <CardTitle className="text-lg">Select Conference</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Input
                type="number"
                placeholder="Enter Conference ID"
                value={conferenceId || ""}
                onChange={(e) => setConferenceId(e.target.value ? parseInt(e.target.value) : null)}
                className="max-w-xs"
              />
              {conferenceId && stats && (
                <div className="flex gap-6 ml-auto">
                  <div className="text-sm">
                    <span className="text-muted-foreground">Total Briefs:</span>
                    <span className="ml-2 font-semibold">{stats.total}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Approved:</span>
                    <span className="ml-2 font-semibold text-green-600">{stats.approved}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Used:</span>
                    <span className="ml-2 font-semibold text-blue-600">{stats.used}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Avg Confidence:</span>
                    <span className="ml-2 font-semibold">{stats.averageConfidence}%</span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="generate">Generate Brief</TabsTrigger>
            <TabsTrigger value="history">Brief History</TabsTrigger>
          </TabsList>

          {/* Generate Tab */}
          <TabsContent value="generate" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Input Section */}
              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="text-lg">Press Release Input</CardTitle>
                  <CardDescription>Paste your press release to generate a brief</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Press Release Title (Optional)
                    </label>
                    <Input
                      placeholder="e.g., Q4 2025 Earnings Announcement"
                      value={pressReleaseTitle}
                      onChange={(e) => setPressReleaseTitle(e.target.value)}
                      disabled={generateBriefMutation.isPending}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Event ID (Optional)
                    </label>
                    <Input
                      placeholder="e.g., q4-earnings-2026"
                      value={eventId}
                      onChange={(e) => setEventId(e.target.value)}
                      disabled={generateBriefMutation.isPending}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Press Release Content
                    </label>
                    <Textarea
                      placeholder="Paste your press release here..."
                      value={pressRelease}
                      onChange={(e) => setPressRelease(e.target.value)}
                      disabled={generateBriefMutation.isPending}
                      className="min-h-64 resize-none"
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      {pressRelease.length} / 10000 characters
                    </p>
                  </div>

                  <Button
                    onClick={handleGenerateBrief}
                    disabled={generateBriefMutation.isPending || !conferenceId || !pressRelease.trim()}
                    className="w-full"
                    size="lg"
                  >
                    {generateBriefMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating Brief...
                      </>
                    ) : (
                      "Generate Brief"
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Output Section */}
              {generatedBrief && (
                <Card className="border-border bg-card/50">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{generatedBrief.briefTitle}</CardTitle>
                        <CardDescription className="mt-2">{generatedBrief.briefSummary}</CardDescription>
                      </div>
                      <Badge variant="outline" className="ml-2">
                        {generatedBrief.generationConfidence}% confidence
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Key Messages */}
                    <div>
                      <h3 className="font-semibold text-foreground mb-3">Key Messages</h3>
                      <div className="space-y-2">
                        {generatedBrief.keyMessages.map((msg, idx) => (
                          <div key={idx} className="bg-background/50 p-3 rounded-lg border border-border">
                            <div className="flex items-start justify-between mb-1">
                              <span className="font-medium text-sm">{msg.title}</span>
                              <Badge
                                variant={
                                  msg.emphasis === "high"
                                    ? "default"
                                    : msg.emphasis === "medium"
                                      ? "secondary"
                                      : "outline"
                                }
                                className="text-xs"
                              >
                                {msg.emphasis}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">{msg.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Financial Highlights */}
                    {generatedBrief.financialHighlights && generatedBrief.financialHighlights.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-foreground mb-3">Financial Highlights</h3>
                        <div className="space-y-2">
                          {generatedBrief.financialHighlights.map((fh, idx) => (
                            <div key={idx} className="bg-background/50 p-3 rounded-lg border border-border">
                              <div className="flex justify-between items-center">
                                <span className="text-sm font-medium">{fh.metric}</span>
                                <span className="text-sm font-bold text-green-600">{fh.value}</span>
                              </div>
                              {fh.context && <p className="text-xs text-muted-foreground mt-1">{fh.context}</p>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Approval Section */}
                    <div className="border-t border-border pt-4">
                      <label className="text-sm font-medium text-foreground mb-2 block">
                        Approval Notes (Optional)
                      </label>
                      <Textarea
                        placeholder="Add any notes before approving..."
                        value={approvalNotes}
                        onChange={(e) => setApprovalNotes(e.target.value)}
                        className="min-h-20 resize-none"
                      />
                      <div className="flex gap-2 mt-4">
                        <Button
                          onClick={handleApproveBrief}
                          disabled={approveBriefMutation.isPending}
                          className="flex-1"
                          variant="default"
                        >
                          {approveBriefMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Approving...
                            </>
                          ) : (
                            <>
                              <ThumbsUp className="mr-2 h-4 w-4" />
                              Approve Brief
                            </>
                          )}
                        </Button>
                        <Button
                          onClick={() => handleDeleteBrief(generatedBrief.id)}
                          disabled={deleteBriefMutation.isPending}
                          variant="destructive"
                        >
                          {deleteBriefMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Detailed Brief View */}
            {generatedBrief && (
              <div className="space-y-6">
                {/* Talking Points */}
                <Card className="border-border">
                  <CardHeader>
                    <CardTitle className="text-lg">Talking Points</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {generatedBrief.talkingPoints.map((tp, idx) => (
                      <div key={idx} className="border-l-4 border-primary pl-4">
                        <h4 className="font-semibold text-foreground mb-2">{tp.topic}</h4>
                        <ul className="space-y-1 mb-3">
                          {tp.points.map((point, pidx) => (
                            <li key={pidx} className="text-sm text-foreground flex gap-2">
                              <span className="text-primary">•</span>
                              <span>{point}</span>
                            </li>
                          ))}
                        </ul>
                        {tp.speakerNotes && (
                          <div className="bg-muted/50 p-3 rounded text-xs text-muted-foreground italic">
                            <span className="font-semibold">Speaker Notes:</span> {tp.speakerNotes}
                          </div>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Anticipated Questions */}
                <Card className="border-border">
                  <CardHeader>
                    <CardTitle className="text-lg">Anticipated Questions & Answers</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {generatedBrief.anticipatedQuestions.map((q, idx) => (
                      <div key={idx} className="border border-border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <p className="font-semibold text-foreground">{q.question}</p>
                          <Badge
                            variant={
                              q.difficulty === "hard"
                                ? "destructive"
                                : q.difficulty === "medium"
                                  ? "secondary"
                                  : "outline"
                            }
                            className="text-xs ml-2"
                          >
                            {q.difficulty}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{q.suggestedAnswer}</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopyToClipboard(q.suggestedAnswer)}
                          className="mt-2"
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          Copy Answer
                        </Button>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            )}

          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-4">
            {!conferenceId ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>Select a conference to view brief history</AlertDescription>
              </Alert>
            ) : briefs.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>No briefs generated for this conference yet</AlertDescription>
              </Alert>
            ) : (
              <div className="grid gap-4">
                {briefs.map((brief: any) => (
                  <Card key={brief.id} className="border-border">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-base">{brief.briefTitle}</CardTitle>
                          <CardDescription className="mt-1">{brief.pressReleaseTitle}</CardDescription>
                        </div>
                        <div className="flex gap-2 ml-4">
                          {brief.operatorApproved && (
                            <Badge variant="default" className="flex gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              Approved
                            </Badge>
                          )}
                          {brief.usedInEvent && (
                            <Badge variant="secondary" className="flex gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              Used
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="text-sm">
                          <span className="text-muted-foreground">Generated:</span>
                          <span className="ml-2 font-medium">
                            {new Date(brief.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="text-sm">
                          <span className="text-muted-foreground">Confidence:</span>
                          <span className="ml-2 font-medium">{brief.generationConfidence}%</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setGeneratedBrief(brief);
                            setSelectedBriefId(brief.id);
                            setActiveTab("generate");
                          }}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Button>
                        {!brief.usedInEvent && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleMarkAsUsed(brief.id)}
                            disabled={markAsUsedMutation.isPending}
                          >
                            Mark as Used
                          </Button>
                        )}
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteBrief(brief.id)}
                          disabled={deleteBriefMutation.isPending}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
