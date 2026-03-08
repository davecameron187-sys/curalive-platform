import React, { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Check, X, Clock, Download, RotateCcw, Eye, Edit2, Trash2, Copy } from "lucide-react";
import { toast } from "sonner";

interface TranscriptEdit {
  id: number;
  originalText: string;
  correctedText: string;
  editType: "correction" | "clarification" | "redaction" | "speaker_correction";
  approved: boolean;
  approvedBy: number; // 0 = not approved, otherwise user ID
  approvedAt: Date;
  createdAt: Date;
}

interface TranscriptVersion {
  id: number;
  versionNumber: number;
  changeDescription?: string;
  isPublished: boolean;
  publishedAt?: Date;
  createdAt: Date;
}

export default function TranscriptEditor() {
  const { user } = useAuth();
  const [conferenceId, setConferenceId] = useState<number>(1);
  const [activeTab, setActiveTab] = useState("editor");
  const [selectedEdit, setSelectedEdit] = useState<TranscriptEdit | null>(null);
  const [showDiffView, setShowDiffView] = useState(false);
  const [exportFormat, setExportFormat] = useState<"txt" | "md" | "json">("md");

  // tRPC queries
  const editsQuery = trpc.transcriptEditor.getConferenceEdits.useQuery({ conferenceId });
  const pendingQuery = trpc.transcriptEditor.getPendingEdits.useQuery({ conferenceId });
  const versionsQuery = trpc.transcriptEditor.getConferenceVersions.useQuery({ conferenceId });
  const statsQuery = trpc.transcriptEditor.getEditStatistics.useQuery({ conferenceId });
  const auditQuery = trpc.transcriptEditor.getAuditLog.useQuery({ conferenceId });
  const fullTranscriptQuery = trpc.transcriptEditor.getFullTranscript.useQuery({ conferenceId });

  // tRPC mutations
  const approveEditMutation = trpc.transcriptEditor.approveEdit.useMutation({
    onSuccess: () => {
      toast.success("Edit approved");
      editsQuery.refetch();
      pendingQuery.refetch();
      statsQuery.refetch();
    },
    onError: (error) => {
      toast.error(`Failed to approve edit: ${error.message}`);
    },
  });

  const createVersionMutation = trpc.transcriptEditor.createVersion.useMutation({
    onSuccess: () => {
      toast.success("Version created");
      versionsQuery.refetch();
      statsQuery.refetch();
    },
    onError: (error) => {
      toast.error(`Failed to create version: ${error.message}`);
    },
  });

  const publishVersionMutation = trpc.transcriptEditor.publishVersion.useMutation({
    onSuccess: () => {
      toast.success("Version published");
      versionsQuery.refetch();
    },
    onError: (error) => {
      toast.error(`Failed to publish version: ${error.message}`);
    },
  });

  const revertVersionMutation = trpc.transcriptEditor.revertToVersion.useMutation({
    onSuccess: () => {
      toast.success("Reverted to previous version");
      versionsQuery.refetch();
      editsQuery.refetch();
    },
    onError: (error) => {
      toast.error(`Failed to revert version: ${error.message}`);
    },
  });

  const exportMutation = trpc.transcriptEditor.exportTranscript.useQuery(
    { conferenceId, format: exportFormat },
    { enabled: false }
  );

  const handleApproveEdit = (editId: number, approved: boolean) => {
    approveEditMutation.mutate({
      editId,
      conferenceId,
      approved,
    });
  };

  const handleCreateVersion = (description?: string) => {
    createVersionMutation.mutate({
      conferenceId,
      changeDescription: description,
    });
  };

  const handlePublishVersion = (versionId: number) => {
    publishVersionMutation.mutate({
      versionId,
      conferenceId,
    });
  };

  const handleRevertVersion = (versionId: number) => {
    revertVersionMutation.mutate({
      versionId,
      conferenceId,
    });
  };

  const handleExport = async () => {
    try {
      const result = await exportMutation.refetch();
      if (result.data?.transcript) {
        const content = typeof result.data.transcript === "string" 
          ? result.data.transcript 
          : JSON.stringify(result.data.transcript, null, 2);
        
        const blob = new Blob([content], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `transcript-export.${exportFormat}`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success(`Transcript exported as ${exportFormat.toUpperCase()}`);
      }
    } catch (error) {
      toast.error("Failed to export transcript");
    }
  };

  const getEditTypeColor = (type: string) => {
    switch (type) {
      case "correction":
        return "bg-blue-100 text-blue-800";
      case "clarification":
        return "bg-purple-100 text-purple-800";
      case "redaction":
        return "bg-red-100 text-red-800";
      case "speaker_correction":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const stats = statsQuery.data;
  const edits = editsQuery.data || [];
  const pending = pendingQuery.data || [];
  const versions = versionsQuery.data || [];
  const auditLogs = auditQuery.data || [];
  const fullTranscript = fullTranscriptQuery.data?.transcript || "";

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Transcript Editor</h1>
          <p className="text-muted-foreground">
            Edit, correct, and manage live transcripts with version control and audit logging
          </p>
        </div>

        {/* Conference Selection */}
        <div className="mb-6 flex gap-4">
          <Input
            type="number"
            placeholder="Conference ID"
            value={conferenceId}
            onChange={(e) => setConferenceId(Number(e.target.value))}
            className="w-32"
          />
          <Button onClick={() => editsQuery.refetch()}>Refresh</Button>
        </div>

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
            <Card className="p-4">
              <div className="text-sm text-muted-foreground">Total Edits</div>
              <div className="text-3xl font-bold">{stats.totalEdits}</div>
            </Card>
            <Card className="p-4">
              <div className="text-sm text-muted-foreground">Approved</div>
              <div className="text-3xl font-bold text-green-600">{stats.approvedEdits}</div>
            </Card>
            <Card className="p-4">
              <div className="text-sm text-muted-foreground">Pending</div>
              <div className="text-3xl font-bold text-amber-600">{stats.pendingEdits}</div>
            </Card>
            <Card className="p-4">
              <div className="text-sm text-muted-foreground">Approval Rate</div>
              <div className="text-3xl font-bold">{stats.approvalRate.toFixed(1)}%</div>
            </Card>
            <Card className="p-4">
              <div className="text-sm text-muted-foreground">Avg Confidence</div>
              <div className="text-3xl font-bold">{stats.averageConfidence.toFixed(0)}%</div>
            </Card>
          </div>
        )}

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="editor">Editor</TabsTrigger>
            <TabsTrigger value="pending">
              Pending ({pending.length})
            </TabsTrigger>
            <TabsTrigger value="versions">Versions</TabsTrigger>
            <TabsTrigger value="audit">Audit Log</TabsTrigger>
            <TabsTrigger value="export">Export</TabsTrigger>
          </TabsList>

          {/* Editor Tab */}
          <TabsContent value="editor" className="space-y-4">
            <Card className="p-6">
              <div className="mb-4 flex justify-between items-center">
                <h2 className="text-xl font-semibold">Full Transcript</h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDiffView(!showDiffView)}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  {showDiffView ? "Hide" : "Show"} Diff
                </Button>
              </div>

              <div className="bg-muted p-4 rounded-lg min-h-96 max-h-96 overflow-y-auto font-mono text-sm whitespace-pre-wrap">
                {fullTranscript || "No transcript available"}
              </div>

              <div className="mt-4 flex gap-2">
                <Button
                  onClick={() => handleCreateVersion("Manual save")}
                  disabled={createVersionMutation.isPending}
                >
                  {createVersionMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Save Version
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(fullTranscript);
                    toast.success("Transcript copied to clipboard");
                  }}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </Button>
              </div>
            </Card>

            {/* All Edits List */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">All Edits ({edits.length})</h2>
              <div className="space-y-3">
                {edits.length === 0 ? (
                  <p className="text-muted-foreground">No edits yet</p>
                ) : (
                  edits.map((edit) => (
                    <div
                      key={edit.id}
                      className="border rounded-lg p-4 hover:bg-muted/50 cursor-pointer transition"
                      onClick={() => setSelectedEdit(edit)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex gap-2">
                          <Badge className={getEditTypeColor(edit.editType)}>
                            {edit.editType}
                          </Badge>
                          {edit.approved ? (
                            <Badge variant="outline" className="bg-green-50">
                              <Check className="w-3 h-3 mr-1" />
                              Approved
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-amber-50">
                              <Clock className="w-3 h-3 mr-1" />
                              Pending
                            </Badge>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(edit.createdAt).toLocaleString()}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                        <div>
                          <div className="text-muted-foreground text-xs mb-1">Original</div>
                          <div className="bg-red-50 p-2 rounded text-red-900 line-through">
                            {edit.originalText}
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground text-xs mb-1">Corrected</div>
                          <div className="bg-green-50 p-2 rounded text-green-900">
                            {edit.correctedText}
                          </div>
                        </div>
                      </div>

                      {!edit.approved && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleApproveEdit(edit.id, true)}
                            disabled={approveEditMutation.isPending}
                          >
                            <Check className="w-3 h-3 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleApproveEdit(edit.id, false)}
                            disabled={approveEditMutation.isPending}
                          >
                            <X className="w-3 h-3 mr-1" />
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </Card>
          </TabsContent>

          {/* Pending Tab */}
          <TabsContent value="pending" className="space-y-4">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Pending Edits ({pending.length})</h2>
              {pending.length === 0 ? (
                <Alert>
                  <AlertDescription>All edits have been reviewed!</AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-3">
                  {pending.map((edit) => (
                    <div key={edit.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <Badge className={getEditTypeColor(edit.editType)}>
                          {edit.editType}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(edit.createdAt).toLocaleString()}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                        <div>
                          <div className="text-muted-foreground text-xs mb-1">Original</div>
                          <div className="bg-red-50 p-2 rounded">{edit.originalText}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground text-xs mb-1">Corrected</div>
                          <div className="bg-green-50 p-2 rounded">{edit.correctedText}</div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleApproveEdit(edit.id, true)}
                          disabled={approveEditMutation.isPending}
                        >
                          <Check className="w-3 h-3 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleApproveEdit(edit.id, false)}
                          disabled={approveEditMutation.isPending}
                        >
                          <X className="w-3 h-3 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Versions Tab */}
          <TabsContent value="versions" className="space-y-4">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Transcript Versions ({versions.length})</h2>
              <div className="space-y-3">
                {versions.length === 0 ? (
                  <p className="text-muted-foreground">No versions yet</p>
                ) : (
                  versions.map((version) => (
                    <div key={version.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline">v{version.versionNumber}</Badge>
                          <span className="font-medium">{version.changeDescription || "No description"}</span>
                        </div>
                        {version.isPublished && (
                          <Badge className="bg-green-100 text-green-800">Published</Badge>
                        )}
                      </div>

                      <div className="text-sm text-muted-foreground mb-3">
                        Created: {new Date(version.createdAt).toLocaleString()}
                        {version.publishedAt && (
                          <>
                            <br />
                            Published: {new Date(version.publishedAt).toLocaleString()}
                          </>
                        )}
                      </div>

                      <div className="flex gap-2">
                        {!version.isPublished && (
                          <Button
                            size="sm"
                            onClick={() => handlePublishVersion(version.id)}
                            disabled={publishVersionMutation.isPending}
                          >
                            Publish
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRevertVersion(version.id)}
                          disabled={revertVersionMutation.isPending}
                        >
                          <RotateCcw className="w-3 h-3 mr-1" />
                          Revert
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </TabsContent>

          {/* Audit Log Tab */}
          <TabsContent value="audit" className="space-y-4">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Audit Log ({auditLogs.length})</h2>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {auditLogs.length === 0 ? (
                  <p className="text-muted-foreground">No audit events</p>
                ) : (
                  auditLogs.map((log, idx) => (
                    <div key={idx} className="border-l-2 border-muted pl-4 py-2 text-sm">
                      <div className="flex justify-between">
                        <span className="font-medium">{log.action}</span>
                        <span className="text-muted-foreground">
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <div className="text-muted-foreground">
                        {log.userName} ({log.userRole})
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </TabsContent>

          {/* Export Tab */}
          <TabsContent value="export" className="space-y-4">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Export Transcript</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Format</label>
                  <div className="flex gap-2">
                    {(["txt", "md", "json"] as const).map((fmt) => (
                      <Button
                        key={fmt}
                        variant={exportFormat === fmt ? "default" : "outline"}
                        onClick={() => setExportFormat(fmt)}
                      >
                        {fmt.toUpperCase()}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">Preview:</p>
                  <div className="bg-background p-3 rounded text-sm max-h-48 overflow-y-auto font-mono">
                    {exportFormat === "json" ? (
                      <pre>{JSON.stringify({ transcript: "..." }, null, 2)}</pre>
                    ) : (
                      <div>Transcript will be exported as {exportFormat.toUpperCase()}</div>
                    )}
                  </div>
                </div>

                <Button onClick={handleExport} disabled={exportMutation.isPending} className="w-full">
                  <Download className="w-4 h-4 mr-2" />
                  Export as {exportFormat.toUpperCase()}
                </Button>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
