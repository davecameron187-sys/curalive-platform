import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  Target,
  Calendar,
  CheckCircle,
  TrendingUp,
  FileText,
  Zap,
  Clock,
} from "lucide-react";
import { toast } from "sonner";

interface PenetrationTest {
  id: string;
  vendor: string;
  testType: string;
  status: "scheduled" | "in_progress" | "completed" | "remediation";
  startDate: number;
  endDate?: number;
  findings: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  remediationRate: number;
}

export default function PenetrationTestingDashboard() {
  const [tests, setTests] = useState<PenetrationTest[]>([
    {
      id: "pt-001",
      vendor: "Synack",
      testType: "Web Application",
      status: "completed",
      startDate: Date.now() - 7776000000,
      endDate: Date.now() - 7689600000,
      findings: 24,
      critical: 2,
      high: 5,
      medium: 10,
      low: 7,
      remediationRate: 96,
    },
    {
      id: "pt-002",
      vendor: "Bugcrowd",
      testType: "API Security",
      status: "completed",
      startDate: Date.now() - 5184000000,
      endDate: Date.now() - 5097600000,
      findings: 18,
      critical: 1,
      high: 4,
      medium: 8,
      low: 5,
      remediationRate: 89,
    },
    {
      id: "pt-003",
      vendor: "HackerOne",
      testType: "Infrastructure",
      status: "in_progress",
      startDate: Date.now() - 1209600000,
      findings: 12,
      critical: 1,
      high: 3,
      medium: 5,
      low: 3,
      remediationRate: 42,
    },
    {
      id: "pt-004",
      vendor: "Synack",
      testType: "Mobile Application",
      status: "scheduled",
      startDate: Date.now() + 604800000,
      findings: 0,
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      remediationRate: 0,
    },
  ]);

  const stats = {
    completed: tests.filter((t) => t.status === "completed").length,
    inProgress: tests.filter((t) => t.status === "in_progress").length,
    scheduled: tests.filter((t) => t.status === "scheduled").length,
    totalFindings: tests.reduce((sum, t) => sum + t.findings, 0),
    criticalFindings: tests.reduce((sum, t) => sum + t.critical, 0),
  };

  const handleScheduleTest = () => {
    toast.success("Penetration test scheduled");
  };

  const handleViewFindings = (testId: string) => {
    toast.success("Opening findings report");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500/20 text-green-600";
      case "in_progress":
        return "bg-blue-500/20 text-blue-600";
      case "scheduled":
        return "bg-yellow-500/20 text-yellow-600";
      case "remediation":
        return "bg-orange-500/20 text-orange-600";
      default:
        return "bg-gray-500/20 text-gray-600";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Penetration Testing Management</h1>
        <p className="text-muted-foreground mt-1">
          Vendor management, test scheduling, and finding tracking
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Completed</p>
          <p className="text-3xl font-bold">{stats.completed}</p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">In Progress</p>
          <p className="text-3xl font-bold text-blue-600">{stats.inProgress}</p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Scheduled</p>
          <p className="text-3xl font-bold text-yellow-600">{stats.scheduled}</p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Total Findings</p>
          <p className="text-3xl font-bold">{stats.totalFindings}</p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Critical</p>
          <p className="text-3xl font-bold text-red-600">{stats.criticalFindings}</p>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold flex items-center gap-2">
            <Target className="h-4 w-4" />
            Penetration Tests
          </h2>
          <Button onClick={handleScheduleTest}>Schedule New Test</Button>
        </div>

        <div className="space-y-3">
          {tests.map((test) => (
            <div
              key={test.id}
              className="p-4 border border-border rounded-lg hover:bg-secondary/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="font-semibold text-sm">{test.testType}</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Vendor: {test.vendor}
                  </p>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded font-semibold ${getStatusColor(
                    test.status
                  )}`}
                >
                  {test.status}
                </span>
              </div>

              <div className="grid grid-cols-5 gap-2 mb-3 text-xs">
                <div>
                  <p className="text-muted-foreground">Total</p>
                  <p className="font-semibold">{test.findings}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Critical</p>
                  <p className="font-semibold text-red-600">{test.critical}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">High</p>
                  <p className="font-semibold text-orange-600">{test.high}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Medium</p>
                  <p className="font-semibold text-yellow-600">{test.medium}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Low</p>
                  <p className="font-semibold text-blue-600">{test.low}</p>
                </div>
              </div>

              <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-semibold">Remediation Rate</p>
                  <p className="text-xs font-semibold">{test.remediationRate}%</p>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full"
                    style={{ width: `${test.remediationRate}%` }}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => handleViewFindings(test.id)}
                  variant="outline"
                >
                  View Findings
                </Button>
                {test.status === "completed" && (
                  <Button size="sm" variant="outline">
                    Export Report
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Vendor Management
          </h2>

          <div className="space-y-3">
            <div className="p-3 border border-border rounded">
              <p className="font-semibold text-sm">Synack</p>
              <p className="text-xs text-muted-foreground mt-1">
                2 tests completed | Next: Q2 2026
              </p>
            </div>

            <div className="p-3 border border-border rounded">
              <p className="font-semibold text-sm">Bugcrowd</p>
              <p className="text-xs text-muted-foreground mt-1">
                1 test completed | Next: Q3 2026
              </p>
            </div>

            <div className="p-3 border border-border rounded">
              <p className="font-semibold text-sm">HackerOne</p>
              <p className="text-xs text-muted-foreground mt-1">
                1 test in progress | Completion: Q1 2026
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Trend Analysis
          </h2>

          <div className="space-y-3 text-sm">
            <div>
              <p className="font-semibold">Finding Trend</p>
              <p className="text-muted-foreground text-xs mt-1">
                ↓ 33% reduction in findings (24 → 18 → 12)
              </p>
            </div>

            <div>
              <p className="font-semibold">Remediation Speed</p>
              <p className="text-muted-foreground text-xs mt-1">
                ↑ 7% faster remediation (avg 42 days → 39 days)
              </p>
            </div>

            <div>
              <p className="font-semibold">Critical Findings</p>
              <p className="text-muted-foreground text-xs mt-1">
                ↓ 50% reduction in critical findings (2 → 1 → 1)
              </p>
            </div>

            <div>
              <p className="font-semibold">Test Coverage</p>
              <p className="text-muted-foreground text-xs mt-1">
                Quarterly testing across 4 domains
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
