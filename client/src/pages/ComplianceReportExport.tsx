import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Download, FileJson, FileText, Table as TableIcon, CheckCircle2, AlertCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useRoute } from "wouter";

export default function ComplianceReportExport() {
  const [, params] = useRoute("/compliance-report/:eventId");
  const eventId = params?.eventId || "";

  const [selectedFormat, setSelectedFormat] = useState<"pdf" | "csv" | "json">("pdf");
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  // Fetch compliance report
  const { data: report, isLoading: isLoadingReport } = trpc.aiAm.getComplianceReport.useQuery(
    { eventId },
    { enabled: !!eventId }
  );

  // Export report mutation
  const exportMutation = trpc.aiAm.exportComplianceReport.useMutation({
    onSuccess: (data) => {
      setExportStatus("success");
      // Trigger download
      const blob = new Blob([data.content], { type: data.mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = data.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setTimeout(() => setExportStatus("idle"), 3000);
    },
    onError: () => {
      setExportStatus("error");
      setTimeout(() => setExportStatus("idle"), 3000);
    },
  });

  const handleExport = async () => {
    setIsExporting(true);
    setExportStatus("loading");

    try {
      await exportMutation.mutateAsync({
        eventId,
        format: selectedFormat,
      });
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoadingReport) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading compliance report...</p>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Report Not Found</CardTitle>
            <CardDescription>The compliance report for this event could not be found.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Compliance Report</h1>
          <p className="text-muted-foreground">Event: {eventId}</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Violations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{report.totalViolations}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Violations Detected</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{report.actionBreakdown.violationDetected}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Acknowledged</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{report.actionBreakdown.violationAcknowledged}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Muted</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{report.actionBreakdown.violationMuted}</div>
            </CardContent>
          </Card>
        </div>

        {/* Audit Trail Integrity */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Audit Trail Integrity</CardTitle>
              {report.auditTrailIntegrity.isValid ? (
                <Badge className="bg-green-600">
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Valid
                </Badge>
              ) : (
                <Badge variant="destructive">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Issues Found
                </Badge>
              )}
            </div>
            <CardDescription>Chain of custody verification status</CardDescription>
          </CardHeader>
          <CardContent>
            {report.auditTrailIntegrity.isValid ? (
              <p className="text-sm text-green-600">All audit log entries are valid and properly chained.</p>
            ) : (
              <div className="space-y-2">
                {report.auditTrailIntegrity.errors.map((error, i) => (
                  <p key={i} className="text-sm text-red-600">
                    • {error}
                  </p>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Export Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Export Report</CardTitle>
            <CardDescription>Download the compliance report in your preferred format</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={selectedFormat} onValueChange={(v) => setSelectedFormat(v as any)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="pdf" className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  PDF
                </TabsTrigger>
                <TabsTrigger value="csv" className="flex items-center gap-2">
                  <TableIcon className="w-4 h-4" />
                  CSV
                </TabsTrigger>
                <TabsTrigger value="json" className="flex items-center gap-2">
                  <FileJson className="w-4 h-4" />
                  JSON
                </TabsTrigger>
              </TabsList>

              <TabsContent value="pdf" className="space-y-4 mt-4">
                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">PDF Report</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Download a formatted PDF report with all violations, audit trail, and compliance checklist.
                  </p>
                  <ul className="text-sm space-y-2 text-muted-foreground">
                    <li>✓ Executive summary</li>
                    <li>✓ Violation timeline</li>
                    <li>✓ Operator actions</li>
                    <li>✓ Regulatory compliance checklist</li>
                  </ul>
                </div>
              </TabsContent>

              <TabsContent value="csv" className="space-y-4 mt-4">
                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">CSV Export</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Export audit trail as CSV for spreadsheet analysis and archival.
                  </p>
                  <ul className="text-sm space-y-2 text-muted-foreground">
                    <li>✓ All audit log entries</li>
                    <li>✓ Timestamps and operators</li>
                    <li>✓ Violation details</li>
                    <li>✓ Hash verification data</li>
                  </ul>
                </div>
              </TabsContent>

              <TabsContent value="json" className="space-y-4 mt-4">
                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">JSON Export</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Export structured JSON for programmatic access and integration.
                  </p>
                  <ul className="text-sm space-y-2 text-muted-foreground">
                    <li>✓ Complete audit trail</li>
                    <li>✓ Metadata and statistics</li>
                    <li>✓ Chain of custody data</li>
                    <li>✓ Machine-readable format</li>
                  </ul>
                </div>
              </TabsContent>
            </Tabs>

            <div className="mt-6 flex gap-4">
              <Button
                onClick={handleExport}
                disabled={isExporting || exportStatus === "loading"}
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                {isExporting ? "Exporting..." : "Download Report"}
              </Button>

              {exportStatus === "success" && (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-sm">Export successful!</span>
                </div>
              )}

              {exportStatus === "error" && (
                <div className="flex items-center gap-2 text-red-600">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">Export failed. Please try again.</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Violation Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Violation Timeline</CardTitle>
            <CardDescription>Chronological list of all detected violations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {report.violationTimeline.map((violation: any, index: number) => (
                <div key={index} className="border-l-4 border-amber-500 pl-4 py-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold">{violation.type}</h4>
                      <p className="text-sm text-muted-foreground">Speaker: {violation.speaker}</p>
                      <p className="text-sm text-muted-foreground">
                        Detected: {new Date(violation.detectedAt).toLocaleString()}
                      </p>
                      {violation.acknowledged && (
                        <p className="text-sm text-green-600">
                          Acknowledged: {new Date(violation.acknowledged).toLocaleString()}
                        </p>
                      )}
                    </div>
                    <Badge
                      variant={
                        violation.severity === "critical"
                          ? "destructive"
                          : violation.severity === "high"
                            ? "default"
                            : "secondary"
                      }
                    >
                      {violation.severity}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
