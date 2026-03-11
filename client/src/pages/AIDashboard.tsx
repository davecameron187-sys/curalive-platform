import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Send,
  Edit2,
  Trash2,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { useLocation } from "wouter";

interface ContentItem {
  id: number;
  eventId: number;
  contentType: string;
  title: string;
  content: string;
  editedContent: string | null;
  status: "generated" | "approved" | "rejected" | "sent";
  recipients: string[] | null;
  generatedAt: Date;
  approvedAt: Date | null;
  approvedBy: number | null;
  rejectedAt: Date | null;
  rejectionReason: string | null;
  sentAt: Date | null;
  sentTo: string[] | null;
  createdAt: Date;
  updatedAt: Date;
}

export default function AIDashboard() {
  const [, navigate] = useLocation();
  const [eventId, setEventId] = useState<number | null>(null);
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);
  const [editedText, setEditedText] = useState<string>("");
  const [recipients, setRecipients] = useState<string>("");
  const [activeTab, setActiveTab] = useState("generated");

  // Fetch content
  const { data: contents = [], isLoading, refetch } = trpc.aiDashboard.getEventContent.useQuery(
    { eventId: eventId || 0, status: activeTab as any },
    { enabled: !!eventId }
  );

  // Fetch stats
  const { data: stats } = trpc.aiDashboard.getStats.useQuery(
    { eventId: eventId || 0 },
    { enabled: !!eventId }
  );

  // Mutations
  const approveMutation = trpc.aiDashboard.approveContent.useMutation();
  const approveSendMutation = trpc.aiDashboard.approveAndSend.useMutation();
  const rejectMutation = trpc.aiDashboard.rejectContent.useMutation();
  const updateMutation = trpc.aiDashboard.updateContent.useMutation();

  const handleSelectContent = (content: ContentItem) => {
    setSelectedContent(content);
    setEditedText(content.editedContent || content.content);
    setRecipients((content.recipients || []).join(", "));
  };

  const handleSaveEdits = async () => {
    if (!selectedContent) return;

    await updateMutation.mutateAsync({
      contentId: selectedContent.id,
      editedContent: editedText,
      recipients: recipients.split(",").map((r) => r.trim()),
    });

    refetch();
    setSelectedContent(null);
  };

  const handleApprove = async (contentId: number) => {
    await approveMutation.mutateAsync({ contentId });
    refetch();
  };

  const handleApproveSend = async (contentId: number) => {
    const content = contents.find((c) => c.id === contentId);
    if (!content) return;

    const recipientList = recipients.split(",").map((r) => r.trim());

    await approveSendMutation.mutateAsync({
      contentId,
      recipients: recipientList,
    });

    refetch();
    setSelectedContent(null);
  };

  const handleReject = async (contentId: number) => {
    const reason = prompt("Enter rejection reason (optional):");
    await rejectMutation.mutateAsync({
      contentId,
      reason: reason || undefined,
    });
    refetch();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "generated":
        return "bg-blue-100 text-blue-800";
      case "approved":
        return "bg-green-100 text-green-800";
      case "sent":
        return "bg-purple-100 text-purple-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "generated":
        return <Clock className="w-4 h-4" />;
      case "approved":
        return <CheckCircle className="w-4 h-4" />;
      case "sent":
        return <Send className="w-4 h-4" />;
      case "rejected":
        return <AlertCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  if (!eventId) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>AI Dashboard</CardTitle>
              <CardDescription>
                Select an event to view and approve AI-generated content
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Please navigate to an event first or select an event ID below.
                </p>
                <input
                  type="number"
                  placeholder="Enter Event ID"
                  onChange={(e) => setEventId(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-border rounded-lg"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">AI Content Approval Dashboard</h1>
          <p className="text-muted-foreground">
            Review, edit, and approve AI-generated content before sending to recipients
          </p>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-5 gap-4 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold">{stats.total}</div>
                  <div className="text-xs text-muted-foreground">Total</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{stats.generated}</div>
                  <div className="text-xs text-muted-foreground">Generated</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
                  <div className="text-xs text-muted-foreground">Approved</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{stats.sent}</div>
                  <div className="text-xs text-muted-foreground">Sent</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
                  <div className="text-xs text-muted-foreground">Rejected</div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="generated">Generated</TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="sent">Sent</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
            <TabsTrigger value="roi">ROI Metrics</TabsTrigger>
          </TabsList>

          {/* Generated Tab */}
          <TabsContent value="generated" className="space-y-4">
            {isLoading ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                </CardContent>
              </Card>
            ) : contents.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                  No generated content yet
                </CardContent>
              </Card>
            ) : (
              contents.map((content) => (
                <Card key={content.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(content.status)}
                        <div>
                          <CardTitle className="text-lg">{content.title}</CardTitle>
                          <CardDescription>{content.contentType}</CardDescription>
                        </div>
                      </div>
                      <Badge className={getStatusColor(content.status)}>
                        {content.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {content.content}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSelectContent(content as any)}
                      >
                        <Edit2 className="w-4 h-4 mr-2" />
                        Review & Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleApprove(content.id)}
                        disabled={approveMutation.isPending}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleReject(content.id)}
                        disabled={rejectMutation.isPending}
                      >
                        <AlertCircle className="w-4 h-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Approved Tab */}
          <TabsContent value="approved" className="space-y-4">
            {contents.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                  No approved content
                </CardContent>
              </Card>
            ) : (
              contents.map((content) => (
                <Card key={content.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>{content.title}</CardTitle>
                      <Badge className="bg-green-100 text-green-800">Approved</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {content.editedContent || content.content}
                    </p>
                    <Button
                      size="sm"
                      onClick={() => handleApproveSend(content.id)}
                      disabled={approveSendMutation.isPending}
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Send to Recipients
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Sent Tab */}
          <TabsContent value="sent" className="space-y-4">
            {contents.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                  No sent content
                </CardContent>
              </Card>
            ) : (
              contents.map((content) => (
                <Card key={content.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>{content.title}</CardTitle>
                      <Badge className="bg-purple-100 text-purple-800">Sent</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <p>
                        <strong>Sent to:</strong>{" "}
                        {(Array.isArray(content.sentTo) ? content.sentTo.join(", ") : content.sentTo) || "No recipients"}
                      </p>
                      <p className="text-muted-foreground">
                        Sent at: {new Date(content.sentAt || "").toLocaleString()}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Rejected Tab */}
          <TabsContent value="rejected" className="space-y-4">
            {contents.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                  No rejected content
                </CardContent>
              </Card>
            ) : (
              contents.map((content) => (
                <Card key={content.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>{content.title}</CardTitle>
                      <Badge className="bg-red-100 text-red-800">Rejected</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {content.rejectionReason || "No reason provided"}
                    </p>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* ROI Metrics Tab */}
          <TabsContent value="roi" className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { bundle: "A", label: "Investor Relations", metric: "+35%", unit: "investor engagement", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
                { bundle: "B", label: "Compliance & Risk", metric: "100%", unit: "audit coverage", color: "text-red-400", bg: "bg-red-500/10 border-red-500/20" },
                { bundle: "C", label: "Operations", metric: "80%", unit: "manual work reduced", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
                { bundle: "D", label: "Content Marketing", metric: "90%", unit: "faster content creation", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
              ].map(({ bundle, label, metric, unit, color, bg }) => (
                <Card key={bundle} className={`border ${bg}`}>
                  <CardContent className="pt-4 pb-4">
                    <div className="text-[10px] text-muted-foreground mb-1">Bundle {bundle} · {label}</div>
                    <div className={`text-2xl font-bold ${color}`}>{metric}</div>
                    <div className="text-xs text-muted-foreground">{unit}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { title: "Time Saved This Month", value: "47 hours", desc: "vs manual content creation", icon: "⏱️", color: "text-violet-400" },
                { title: "Follow-ups Sent", value: "128", desc: "AI-personalised investor emails", icon: "📧", color: "text-blue-400" },
                { title: "Compliance Checks Run", value: "341", desc: "statements auto-moderated", icon: "🛡️", color: "text-emerald-400" },
                { title: "Content Pieces Generated", value: "89", desc: "summaries, press releases, recaps", icon: "📄", color: "text-amber-400" },
                { title: "Social Posts Published", value: "23", desc: "via Event Echo pipeline", icon: "📱", color: "text-pink-400" },
                { title: "Podcasts Generated", value: "4", desc: "investor podcast episodes", icon: "🎙️", color: "text-purple-400" },
              ].map(({ title, value, desc, icon, color }) => (
                <Card key={title}>
                  <CardContent className="pt-4 pb-4 flex items-center gap-4">
                    <div className="text-2xl">{icon}</div>
                    <div className="flex-1">
                      <div className="text-xs text-muted-foreground">{title}</div>
                      <div className={`text-xl font-bold ${color}`}>{value}</div>
                      <div className="text-[10px] text-muted-foreground">{desc}</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Content Editor Modal */}
        {selectedContent && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <CardTitle>{selectedContent.title}</CardTitle>
                <CardDescription>{selectedContent.contentType}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Content Editor */}
                <div>
                  <label className="text-sm font-medium">Content</label>
                  <textarea
                    value={editedText}
                    onChange={(e) => setEditedText(e.target.value)}
                    className="w-full h-64 p-3 border border-border rounded-lg font-mono text-sm"
                  />
                </div>

                {/* Recipients */}
                <div>
                  <label className="text-sm font-medium">Recipients (comma-separated)</label>
                  <input
                    type="text"
                    value={recipients}
                    onChange={(e) => setRecipients(e.target.value)}
                    placeholder="email1@example.com, email2@example.com"
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm"
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-2 justify-end pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedContent(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleSaveEdits}
                    disabled={updateMutation.isPending}
                  >
                    {updateMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Edit2 className="w-4 h-4 mr-2" />
                        Save Edits
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={() => handleApproveSend(selectedContent.id)}
                    disabled={approveSendMutation.isPending}
                  >
                    {approveSendMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Approve & Send
                      </>
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
