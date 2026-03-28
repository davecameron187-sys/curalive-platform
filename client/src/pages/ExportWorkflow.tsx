/**
 * Export Workflow — Shadow Mode
 * 
 * Download session reports in multiple formats
 * CSV, JSON with full data export
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Download,
  FileText,
  FileJson,
  CheckCircle,
  AlertCircle,
  X,
} from "lucide-react";

interface ExportWorkflowProps {
  sessionId: string;
  onClose: () => void;
}

type ExportFormat = "csv" | "json";

interface ExportStatus {
  format: ExportFormat;
  status: "idle" | "loading" | "success" | "error";
  error?: string;
  filename?: string;
  content?: string;
}

export default function ExportWorkflow({ sessionId, onClose }: ExportWorkflowProps) {
  const [exportStatuses, setExportStatuses] = useState<Record<ExportFormat, ExportStatus>>({
    csv: { format: "csv", status: "idle" },
    json: { format: "json", status: "idle" },
  });

  // Export mutations
  const exportCSV = trpc.archive.exportSessionAsCSV.useMutation({
    onSuccess: (data) => {
      setExportStatuses((prev) => ({
        ...prev,
        csv: {
          format: "csv",
          status: "success",
          filename: data.filename,
          content: data.content,
        },
      }));
    },
    onError: (error) => {
      setExportStatuses((prev) => ({
        ...prev,
        csv: {
          format: "csv",
          status: "error",
          error: error.message,
        },
      }));
    },
  });

  const exportJSON = trpc.archive.exportSessionAsJSON.useMutation({
    onSuccess: (data) => {
      setExportStatuses((prev) => ({
        ...prev,
        json: {
          format: "json",
          status: "success",
          filename: data.filename,
          content: data.content,
        },
      }));
    },
    onError: (error) => {
      setExportStatuses((prev) => ({
        ...prev,
        json: {
          format: "json",
          status: "error",
          error: error.message,
        },
      }));
    },
  });

  const handleExportCSV = async () => {
    setExportStatuses((prev) => ({
      ...prev,
      csv: { format: "csv", status: "loading" },
    }));
    await exportCSV.mutateAsync({ sessionId });
  };

  const handleExportJSON = async () => {
    setExportStatuses((prev) => ({
      ...prev,
      json: { format: "json", status: "loading" },
    }));
    await exportJSON.mutateAsync({ sessionId });
  };

  const handleDownload = (format: ExportFormat) => {
    const status = exportStatuses[format];
    if (!status.content || !status.filename) return;

    const element = document.createElement("a");
    const file = new Blob([status.content], {
      type: format === "csv" ? "text/csv" : "application/json",
    });
    element.href = URL.createObjectURL(file);
    element.download = status.filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "loading":
        return <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />;
      case "error":
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold">Export Session Report</h2>
            <p className="text-muted-foreground text-sm mt-1">
              Download session data in your preferred format
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Export Options */}
        <div className="space-y-4 mb-6">
          {/* CSV Export */}
          <Card className="p-4 border border-border">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4 flex-1">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">CSV Export</h3>
                  <p className="text-sm text-muted-foreground">
                    Questions, compliance flags, and session metadata in CSV format
                  </p>
                  {exportStatuses.csv.status === "success" && (
                    <p className="text-xs text-green-600 mt-2">
                      ✓ Ready to download: {exportStatuses.csv.filename}
                    </p>
                  )}
                  {exportStatuses.csv.status === "error" && (
                    <p className="text-xs text-red-600 mt-2">
                      Error: {exportStatuses.csv.error}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon(exportStatuses.csv.status)}
                {exportStatuses.csv.status === "success" ? (
                  <Button
                    size="sm"
                    onClick={() => handleDownload("csv")}
                    className="flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={handleExportCSV}
                    disabled={exportStatuses.csv.status === "loading"}
                    variant="outline"
                  >
                    {exportStatuses.csv.status === "loading" ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      "Generate"
                    )}
                  </Button>
                )}
              </div>
            </div>
          </Card>

          {/* JSON Export */}
          <Card className="p-4 border border-border">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4 flex-1">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <FileJson className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">JSON Export</h3>
                  <p className="text-sm text-muted-foreground">
                    Complete session data including questions, compliance flags, and operator actions
                  </p>
                  {exportStatuses.json.status === "success" && (
                    <p className="text-xs text-green-600 mt-2">
                      ✓ Ready to download: {exportStatuses.json.filename}
                    </p>
                  )}
                  {exportStatuses.json.status === "error" && (
                    <p className="text-xs text-red-600 mt-2">
                      Error: {exportStatuses.json.error}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon(exportStatuses.json.status)}
                {exportStatuses.json.status === "success" ? (
                  <Button
                    size="sm"
                    onClick={() => handleDownload("json")}
                    className="flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={handleExportJSON}
                    disabled={exportStatuses.json.status === "loading"}
                    variant="outline"
                  >
                    {exportStatuses.json.status === "loading" ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      "Generate"
                    )}
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Info Box */}
        <Card className="p-4 bg-blue-50 border-blue-200 mb-6">
          <p className="text-sm text-blue-900">
            <strong>Note:</strong> Exports include all session data available at the time of export.
            For complete transcripts and recordings, ensure Recall.ai and Whisper services have completed processing.
          </p>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </Card>
    </div>
  );
}
