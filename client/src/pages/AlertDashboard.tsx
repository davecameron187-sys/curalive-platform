import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle, CheckCircle, Clock, TrendingUp, Search, Filter } from "lucide-react";

interface AlertDashboardProps {
  eventId: string;
}

export function AlertDashboard({ eventId }: AlertDashboardProps) {
  const { user } = useAuth();
  const [selectedViolation, setSelectedViolation] = useState<number | null>(null);
  const [searchText, setSearchText] = useState("");
  const [filterSeverity, setFilterSeverity] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterAcknowledged, setFilterAcknowledged] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"severity" | "timestamp">("severity");

  // Fetch violations
  const { data: violations = [], isLoading: violationsLoading } = trpc.aiAm.getViolations.useQuery(
    {
      eventId,
      severity: filterSeverity !== "all" ? [filterSeverity as any] : undefined,
      violationType: filterType !== "all" ? filterType : undefined,
      acknowledged: filterAcknowledged !== "all" ? filterAcknowledged === "acknowledged" : undefined,
      limit: 100,
    },
    { refetchInterval: 5000 } // Refetch every 5 seconds
  );

  // Fetch unacknowledged violations for priority view
  const { data: unacknowledged = [] } = trpc.aiAm.getUnacknowledgedViolations.useQuery(
    { eventId },
    { refetchInterval: 3000 }
  );

  // Fetch stats
  const { data: stats } = trpc.aiAm.getStats.useQuery({ eventId }, { refetchInterval: 10000 });

  // Acknowledge violation mutation
  const acknowledgeViolationMutation = trpc.aiAm.acknowledgeViolation.useMutation({
    onSuccess: () => {
      setSelectedViolation(null);
      // Refetch violations
      trpc.useUtils().aiAm.getViolations.invalidate();
      trpc.useUtils().aiAm.getUnacknowledgedViolations.invalidate();
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

  // Sort violations
  const sortedViolations = [...violations].sort((a, b) => {
    if (sortBy === "severity") {
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return severityOrder[b.severity as keyof typeof severityOrder] - severityOrder[a.severity as keyof typeof severityOrder];
    } else {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  const selectedViolationData = violations.find((v) => v.id === selectedViolation);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Compliance Alert Dashboard</h1>
          <p className="text-muted-foreground">Monitor and manage real-time compliance violations</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Violations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalViolationsDetected || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">in this event</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Unacknowledged</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{unacknowledged.length}</div>
              <p className="text-xs text-muted-foreground mt-1">require attention</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Critical</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {stats?.violationsBySeverity?.critical || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">high priority</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Avg Confidence</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.avgConfidenceScore ? (stats.avgConfidenceScore * 100).toFixed(0) : 0}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">detection accuracy</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Violations List */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Violations</CardTitle>
                <CardDescription>Real-time compliance violations detected</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Filters */}
                <div className="space-y-4 mb-6">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by speaker or content..."
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  {/* Filter Row */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <Select value={filterSeverity} onValueChange={setFilterSeverity}>
                      <SelectTrigger>
                        <SelectValue placeholder="Severity" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Severities</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={filterType} onValueChange={setFilterType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="abuse">Abuse</SelectItem>
                        <SelectItem value="forward_looking">Forward-Looking</SelectItem>
                        <SelectItem value="price_sensitive">Price-Sensitive</SelectItem>
                        <SelectItem value="insider_info">Insider Info</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={filterAcknowledged} onValueChange={setFilterAcknowledged}>
                      <SelectTrigger>
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="unacknowledged">Unacknowledged</SelectItem>
                        <SelectItem value="acknowledged">Acknowledged</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sort" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="severity">By Severity</SelectItem>
                        <SelectItem value="timestamp">By Time</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Violations List */}
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {violationsLoading ? (
                    <div className="text-center py-8 text-muted-foreground">Loading violations...</div>
                  ) : sortedViolations.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">No violations detected</div>
                  ) : (
                    sortedViolations.map((violation) => (
                      <div
                        key={violation.id}
                        onClick={() => setSelectedViolation(violation.id)}
                        className={`p-4 border rounded-lg cursor-pointer transition-all ${
                          selectedViolation === violation.id
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        } ${getSeverityColor(violation.severity)}`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {violation.acknowledged ? (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            ) : (
                              <AlertCircle className="w-4 h-4 text-orange-600" />
                            )}
                            <Badge variant="outline">{getViolationTypeLabel(violation.violationType)}</Badge>
                            <Badge variant="secondary">{violation.severity}</Badge>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {new Date(violation.createdAt).toLocaleTimeString()}
                          </span>
                        </div>

                        <p className="text-sm font-medium mb-2 line-clamp-2">
                          {violation.transcriptExcerpt}
                        </p>

                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>
                            {violation.speakerName} {violation.speakerRole && `(${violation.speakerRole})`}
                          </span>
                          <span>Confidence: {(violation.confidenceScore * 100).toFixed(0)}%</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Violation Details */}
          <div>
            {selectedViolationData ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Violation Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Status */}
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Status</p>
                    <Badge variant={selectedViolationData.acknowledged ? "default" : "destructive"}>
                      {selectedViolationData.acknowledged ? "Acknowledged" : "Unacknowledged"}
                    </Badge>
                  </div>

                  {/* Severity */}
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Severity</p>
                    <Badge className={getSeverityColor(selectedViolationData.severity)}>
                      {selectedViolationData.severity.toUpperCase()}
                    </Badge>
                  </div>

                  {/* Type */}
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Type</p>
                    <p className="text-sm">{getViolationTypeLabel(selectedViolationData.violationType)}</p>
                  </div>

                  {/* Confidence */}
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Confidence Score</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-secondary rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full"
                          style={{ width: `${selectedViolationData.confidenceScore * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">
                        {(selectedViolationData.confidenceScore * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>

                  {/* Speaker */}
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Speaker</p>
                    <p className="text-sm">
                      {selectedViolationData.speakerName || "Unknown"}{" "}
                      {selectedViolationData.speakerRole && `(${selectedViolationData.speakerRole})`}
                    </p>
                  </div>

                  {/* Transcript */}
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Transcript</p>
                    <p className="text-sm bg-secondary p-3 rounded-lg">
                      "{selectedViolationData.transcriptExcerpt}"
                    </p>
                  </div>

                  {/* Time */}
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Detected</p>
                    <p className="text-sm">
                      {new Date(selectedViolationData.createdAt).toLocaleString()}
                    </p>
                  </div>

                  {/* Notes */}
                  {selectedViolationData.notes && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Notes</p>
                      <p className="text-sm">{selectedViolationData.notes}</p>
                    </div>
                  )}

                  {/* Action Button */}
                  {!selectedViolationData.acknowledged && (
                    <Button
                      onClick={() =>
                        acknowledgeViolationMutation.mutate({
                          violationId: selectedViolationData.id,
                          eventId,
                          notes: "Reviewed by operator",
                        })
                      }
                      disabled={acknowledgeViolationMutation.isPending}
                      className="w-full"
                    >
                      {acknowledgeViolationMutation.isPending ? "Acknowledging..." : "Acknowledge"}
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  Select a violation to view details
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
