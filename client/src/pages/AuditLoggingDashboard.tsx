/**
 * Audit Logging Dashboard
 * Comprehensive audit trail for compliance and debugging
 */
import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Download,
  Filter,
  Search,
  Calendar,
  FileText,
  AlertCircle,
  CheckCircle,
  Clock,
} from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";

export interface AuditLog {
  id: string;
  timestamp: Date;
  userId: string;
  userName: string;
  action: string;
  resourceType: string;
  resourceId: string;
  changes: Record<string, unknown>;
  status: "success" | "failure" | "pending";
  ipAddress: string;
  userAgent: string;
}

export default function AuditLoggingDashboard() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterAction, setFilterAction] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    end: new Date(),
  });

  // Mock audit logs
  const [auditLogs] = useState<AuditLog[]>([
    {
      id: "audit-001",
      timestamp: new Date(Date.now() - 3600000),
      userId: "user-123",
      userName: "John Admin",
      action: "ESCALATION_RULE_CREATED",
      resourceType: "AlertEscalationRule",
      resourceId: "rule-001",
      changes: { name: "Critical Alert Escalation", threshold: 3 },
      status: "success",
      ipAddress: "192.168.1.100",
      userAgent: "Mozilla/5.0...",
    },
    {
      id: "audit-002",
      timestamp: new Date(Date.now() - 7200000),
      userId: "user-456",
      userName: "Jane Operator",
      action: "WEBHOOK_ENDPOINT_TESTED",
      resourceType: "WebhookEndpoint",
      resourceId: "webhook-001",
      changes: { url: "https://events.pagerduty.com", status: "ok" },
      status: "success",
      ipAddress: "192.168.1.101",
      userAgent: "Mozilla/5.0...",
    },
    {
      id: "audit-003",
      timestamp: new Date(Date.now() - 10800000),
      userId: "user-123",
      userName: "John Admin",
      action: "ALERT_THRESHOLD_UPDATED",
      resourceType: "AlertThreshold",
      resourceId: "threshold-001",
      changes: { oldValue: 500, newValue: 450, location: "venue-1" },
      status: "success",
      ipAddress: "192.168.1.100",
      userAgent: "Mozilla/5.0...",
    },
    {
      id: "audit-004",
      timestamp: new Date(Date.now() - 14400000),
      userId: "user-789",
      userName: "Bob Viewer",
      action: "AUDIT_LOG_EXPORTED",
      resourceType: "AuditLog",
      resourceId: "export-001",
      changes: { format: "csv", rowCount: 1000 },
      status: "success",
      ipAddress: "192.168.1.102",
      userAgent: "Mozilla/5.0...",
    },
    {
      id: "audit-005",
      timestamp: new Date(Date.now() - 18000000),
      userId: "user-123",
      userName: "John Admin",
      action: "WEBHOOK_ENDPOINT_DELETED",
      resourceType: "WebhookEndpoint",
      resourceId: "webhook-002",
      changes: { url: "https://old-endpoint.example.com" },
      status: "success",
      ipAddress: "192.168.1.100",
      userAgent: "Mozilla/5.0...",
    },
  ]);

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <Card className="p-8 text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-destructive" />
          <h2 className="text-xl font-bold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">
            Only administrators can access audit logs.
          </p>
        </Card>
      </div>
    );
  }

  const filteredLogs = auditLogs.filter((log) => {
    const matchesSearch =
      searchQuery === "" ||
      log.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.resourceId.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesAction =
      filterAction === "all" || log.action === filterAction;

    const matchesStatus =
      filterStatus === "all" || log.status === filterStatus;

    const matchesDate =
      log.timestamp >= dateRange.start && log.timestamp <= dateRange.end;

    return matchesSearch && matchesAction && matchesStatus && matchesDate;
  });

  const handleExportCSV = () => {
    const headers = [
      "Timestamp",
      "User",
      "Action",
      "Resource Type",
      "Resource ID",
      "Status",
      "IP Address",
    ];
    const rows = filteredLogs.map((log) => [
      log.timestamp.toISOString(),
      log.userName,
      log.action,
      log.resourceType,
      log.resourceId,
      log.status,
      log.ipAddress,
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString()}.csv`;
    a.click();
  };

  const handleExportJSON = () => {
    const json = JSON.stringify(filteredLogs, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString()}.json`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Audit Logging</h1>
          <p className="text-muted-foreground">
            Comprehensive audit trail for compliance and debugging
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Logs</p>
                <p className="text-2xl font-bold">{auditLogs.length}</p>
              </div>
              <FileText className="w-8 h-8 text-primary opacity-50" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Success Rate
                </p>
                <p className="text-2xl font-bold">
                  {(
                    (auditLogs.filter((l) => l.status === "success").length /
                      auditLogs.length) *
                    100
                  ).toFixed(1)}
                  %
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500 opacity-50" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Last 7 Days
                </p>
                <p className="text-2xl font-bold">
                  {
                    auditLogs.filter(
                      (l) =>
                        l.timestamp >
                        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                    ).length
                  }
                </p>
              </div>
              <Calendar className="w-8 h-8 text-blue-500 opacity-50" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Unique Users
                </p>
                <p className="text-2xl font-bold">
                  {new Set(auditLogs.map((l) => l.userId)).size}
                </p>
              </div>
              <Clock className="w-8 h-8 text-purple-500 opacity-50" />
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-6 mb-8">
          <div className="grid grid-cols-5 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search logs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Action</label>
              <Select value={filterAction} onValueChange={setFilterAction}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="ESCALATION_RULE_CREATED">
                    Rule Created
                  </SelectItem>
                  <SelectItem value="WEBHOOK_ENDPOINT_TESTED">
                    Webhook Tested
                  </SelectItem>
                  <SelectItem value="ALERT_THRESHOLD_UPDATED">
                    Threshold Updated
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="failure">Failure</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Date Range
              </label>
              <Input
                type="date"
                value={dateRange.start.toISOString().split("T")[0]}
                onChange={(e) =>
                  setDateRange({
                    ...dateRange,
                    start: new Date(e.target.value),
                  })
                }
              />
            </div>

            <div className="flex gap-2 items-end">
              <Button variant="outline" onClick={handleExportCSV}>
                <Download className="w-4 h-4 mr-2" />
                CSV
              </Button>
              <Button variant="outline" onClick={handleExportJSON}>
                <Download className="w-4 h-4 mr-2" />
                JSON
              </Button>
            </div>
          </div>
        </Card>

        {/* Audit Logs Table */}
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Resource</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>IP Address</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-mono text-sm">
                    {log.timestamp.toLocaleString()}
                  </TableCell>
                  <TableCell>{log.userName}</TableCell>
                  <TableCell>
                    <code className="text-xs bg-secondary px-2 py-1 rounded">
                      {log.action}
                    </code>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <p className="font-medium">{log.resourceType}</p>
                      <p className="text-xs text-muted-foreground">
                        {log.resourceId}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        log.status === "success"
                          ? "default"
                          : log.status === "failure"
                            ? "destructive"
                            : "secondary"
                      }
                    >
                      {log.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {log.ipAddress}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        {/* Pagination Info */}
        <div className="mt-4 text-sm text-muted-foreground">
          Showing {filteredLogs.length} of {auditLogs.length} logs
        </div>
      </div>
    </div>
  );
}
