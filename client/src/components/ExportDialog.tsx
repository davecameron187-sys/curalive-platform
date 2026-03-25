import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Download,
  Share2,
  Mail,
  Link as LinkIcon,
  FileText,
  Music,
  BarChart3,
  CheckCircle2,
  Copy,
} from "lucide-react";
import { toast } from "sonner";

interface ExportOptions {
  includeTranscript: boolean;
  includeRecording: boolean;
  includePollResults: boolean;
  includeEngagementData: boolean;
  format: "pdf" | "docx" | "zip";
}

/**
 * ExportDialog Component
 * 
 * Comprehensive export and sharing interface for post-event data.
 * Supports multiple export formats and sharing methods.
 */
export function ExportDialog({
  eventTitle,
  eventId,
  onClose,
}: {
  eventTitle: string;
  eventId: number;
  onClose: () => void;
}) {
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    includeTranscript: true,
    includeRecording: true,
    includePollResults: true,
    includeEngagementData: true,
    format: "pdf",
  });

  const [isExporting, setIsExporting] = useState(false);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [showShareOptions, setShowShareOptions] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);

    try {
      // Simulate export process
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const filename = `event-${eventId}-${Date.now()}.${exportOptions.format === "pdf" ? "pdf" : exportOptions.format === "docx" ? "docx" : "zip"}`;

      // Create mock file
      const content = `
Event Report: ${eventTitle}
Generated: ${new Date().toISOString()}

Export Options:
- Transcript: ${exportOptions.includeTranscript ? "✓" : "✗"}
- Recording: ${exportOptions.includeRecording ? "✓" : "✗"}
- Poll Results: ${exportOptions.includePollResults ? "✓" : "✗"}
- Engagement Data: ${exportOptions.includeEngagementData ? "✓" : "✗"}

Format: ${exportOptions.format.toUpperCase()}
      `.trim();

      const element = document.createElement("a");
      const file = new Blob([content], { type: "text/plain" });
      element.href = URL.createObjectURL(file);
      element.download = filename;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);

      toast.success(`Exported as ${exportOptions.format.toUpperCase()}`);
      setIsExporting(false);
    } catch (error) {
      toast.error("Export failed");
      setIsExporting(false);
    }
  };

  const handleGenerateShareLink = () => {
    const link = `${window.location.origin}/events/${eventId}/report?token=${Math.random().toString(36).substr(2, 9)}`;
    setShareLink(link);
    toast.success("Share link generated");
  };

  const handleCopyLink = () => {
    if (shareLink) {
      navigator.clipboard.writeText(shareLink);
      toast.success("Link copied to clipboard");
    }
  };

  const handleEmailShare = () => {
    const subject = `Event Report: ${eventTitle}`;
    const body = `Check out the report for ${eventTitle}:\n\n${shareLink}`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-96 overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div>
            <h2 className="text-2xl font-bold">Export & Share</h2>
            <p className="text-muted-foreground mt-1">{eventTitle}</p>
          </div>

          {/* Export Options */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">What to include:</h3>

            <div className="space-y-3">
              {[
                {
                  key: "includeTranscript" as const,
                  label: "Full Transcript",
                  icon: FileText,
                  description: "Complete speaker transcript with timestamps",
                },
                {
                  key: "includeRecording" as const,
                  label: "Recording Link",
                  icon: Music,
                  description: "Link to event recording and playback",
                },
                {
                  key: "includePollResults" as const,
                  label: "Poll Results",
                  icon: BarChart3,
                  description: "All poll questions and voting results",
                },
                {
                  key: "includeEngagementData" as const,
                  label: "Engagement Metrics",
                  icon: CheckCircle2,
                  description: "Participant engagement scores and analytics",
                },
              ].map(({ key, label, icon: Icon, description }) => (
                <label
                  key={key}
                  className="flex items-start gap-3 p-3 border border-border rounded cursor-pointer hover:bg-secondary transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={exportOptions[key]}
                    onChange={(e) =>
                      setExportOptions({
                        ...exportOptions,
                        [key]: e.target.checked,
                      })
                    }
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      <p className="font-medium text-sm">{label}</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {description}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Format Selection */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm">Export format:</h3>
            <div className="grid grid-cols-3 gap-2">
              {(["pdf", "docx", "zip"] as const).map((format) => (
                <button
                  key={format}
                  onClick={() =>
                    setExportOptions({ ...exportOptions, format })
                  }
                  className={`p-3 rounded border-2 transition-colors text-sm font-medium ${
                    exportOptions.format === format
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  {format.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Sharing Options */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm">Share report:</h3>

            {!shareLink ? (
              <Button
                onClick={handleGenerateShareLink}
                variant="outline"
                className="w-full"
              >
                <LinkIcon className="h-4 w-4 mr-2" />
                Generate Share Link
              </Button>
            ) : (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={shareLink}
                    readOnly
                    className="flex-1 px-3 py-2 border border-border rounded bg-secondary text-sm"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCopyLink}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleEmailShare}
                    className="flex items-center gap-2"
                  >
                    <Mail className="h-4 w-4" />
                    Email
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.share({
                        title: `Report: ${eventTitle}`,
                        text: "Check out this event report",
                        url: shareLink,
                      }).catch(() => {
                        toast.error("Sharing not supported");
                      });
                    }}
                    className="flex items-center gap-2"
                  >
                    <Share2 className="h-4 w-4" />
                    Share
                  </Button>
                </div>

                <div className="p-3 bg-green-500/10 border border-green-500/20 rounded text-sm text-green-600">
                  ✓ Share link generated. Recipients can view the report without authentication.
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end pt-4 border-t border-border">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleExport}
              disabled={isExporting}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              {isExporting ? "Exporting..." : "Export Now"}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

/**
 * Export Button Component
 * 
 * Standalone button to trigger export dialog
 */
export function ExportButton({
  eventTitle,
  eventId,
}: {
  eventTitle: string;
  eventId: number;
}) {
  const [showDialog, setShowDialog] = useState(false);

  return (
    <>
      <Button
        onClick={() => setShowDialog(true)}
        className="flex items-center gap-2"
      >
        <Download className="h-4 w-4" />
        Export & Share
      </Button>

      {showDialog && (
        <ExportDialog
          eventTitle={eventTitle}
          eventId={eventId}
          onClose={() => setShowDialog(false)}
        />
      )}
    </>
  );
}
