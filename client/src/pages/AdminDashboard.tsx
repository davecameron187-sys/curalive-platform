import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import {
  Users,
  BarChart3,
  TrendingUp,
  Calendar,
  Download,
  Settings,
  Shield,
  Activity,
} from "lucide-react";

/**
 * AdminDashboard Page
 * 
 * Comprehensive admin dashboard with aggregate analytics, compliance tracking,
 * and user management capabilities.
 */
export default function AdminDashboard() {
  const [dateRange, setDateRange] = useState<"week" | "month" | "year">("month");
  const [selectedUser, setSelectedUser] = useState<number | null>(null);

  // Fetch role statistics
  const roleStatsQuery = trpc.rbac.getRoleStatistics.useQuery();

  // Mock analytics data
  const analyticsData = {
    totalEvents: 156,
    totalParticipants: 12847,
    avgEngagement: 78,
    complianceScore: 94,
    eventsByType: {
      audioConference: 45,
      videoConference: 78,
      webcast: 33,
    },
    complianceTrend: [92, 93, 94, 93, 95, 94, 94],
    engagementTrend: [72, 75, 78, 76, 79, 78, 78],
  };

  const handleExportReport = () => {
    const report = {
      generatedAt: new Date().toISOString(),
      dateRange,
      analytics: analyticsData,
      roleStats: roleStatsQuery.data,
    };

    const element = document.createElement("a");
    const file = new Blob([JSON.stringify(report, null, 2)], {
      type: "application/json",
    });
    element.href = URL.createObjectURL(file);
    element.download = `admin-report-${dateRange}-${Date.now()}.json`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Platform overview and management
          </p>
        </div>
        <div className="flex gap-2">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as any)}
            className="px-3 py-2 border border-border rounded bg-background"
          >
            <option value="week">Last 7 days</option>
            <option value="month">Last 30 days</option>
            <option value="year">Last year</option>
          </select>
          <Button onClick={handleExportReport}>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Total Events</p>
              <p className="text-3xl font-bold">{analyticsData.totalEvents}</p>
            </div>
            <Activity className="h-8 w-8 text-blue-500/20" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground mb-1">
                Total Participants
              </p>
              <p className="text-3xl font-bold">
                {(analyticsData.totalParticipants / 1000).toFixed(1)}K
              </p>
            </div>
            <Users className="h-8 w-8 text-green-500/20" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground mb-1">
                Avg Engagement
              </p>
              <p className="text-3xl font-bold">{analyticsData.avgEngagement}%</p>
            </div>
            <TrendingUp className="h-8 w-8 text-amber-500/20" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground mb-1">
                Compliance Score
              </p>
              <p className="text-3xl font-bold">{analyticsData.complianceScore}%</p>
            </div>
            <Shield className="h-8 w-8 text-red-500/20" />
          </div>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Events by Type */}
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Events by Type</h3>
          <div className="space-y-3">
            {Object.entries(analyticsData.eventsByType).map(([type, count]) => (
              <div key={type}>
                <div className="flex justify-between mb-1">
                  <p className="text-sm capitalize">
                    {type.replace(/([A-Z])/g, " $1").trim()}
                  </p>
                  <p className="text-sm font-medium">{count}</p>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary"
                    style={{
                      width: `${(count / analyticsData.totalEvents) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Compliance Trend */}
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Compliance Trend</h3>
          <div className="flex items-end justify-between h-32 gap-1">
            {analyticsData.complianceTrend.map((score, idx) => (
              <div
                key={idx}
                className="flex-1 bg-green-500/30 rounded-t hover:bg-green-500/50 transition-colors"
                style={{ height: `${(score / 100) * 100}%` }}
                title={`Day ${idx + 1}: ${score}%`}
              />
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            7-day compliance average: {Math.round(analyticsData.complianceTrend.reduce((a, b) => a + b) / analyticsData.complianceTrend.length)}%
          </p>
        </Card>
      </div>

      {/* User Management */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Users className="h-4 w-4" />
            User Management
          </h3>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Manage Roles
          </Button>
        </div>

        {roleStatsQuery.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : roleStatsQuery.data ? (
          <div className="grid grid-cols-5 gap-4">
            <div className="p-4 bg-background rounded border border-border">
              <p className="text-xs text-muted-foreground mb-1">Total Users</p>
              <p className="text-2xl font-bold">
                {roleStatsQuery.data.totalUsers}
              </p>
            </div>
            <div className="p-4 bg-background rounded border border-border">
              <p className="text-xs text-muted-foreground mb-1">Admins</p>
              <p className="text-2xl font-bold">{roleStatsQuery.data.admins}</p>
            </div>
            <div className="p-4 bg-background rounded border border-border">
              <p className="text-xs text-muted-foreground mb-1">Operators</p>
              <p className="text-2xl font-bold">
                {roleStatsQuery.data.operators}
              </p>
            </div>
            <div className="p-4 bg-background rounded border border-border">
              <p className="text-xs text-muted-foreground mb-1">Moderators</p>
              <p className="text-2xl font-bold">
                {roleStatsQuery.data.moderators}
              </p>
            </div>
            <div className="p-4 bg-background rounded border border-border">
              <p className="text-xs text-muted-foreground mb-1">Users</p>
              <p className="text-2xl font-bold">{roleStatsQuery.data.users}</p>
            </div>
          </div>
        ) : null}
      </Card>

      {/* Compliance Reports */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Recent Compliance Issues</h3>
        <div className="space-y-3">
          {[
            {
              id: 1,
              event: "Q4 Earnings Call",
              issue: "Unauthorized recording detected",
              severity: "high",
              date: "2026-03-14",
            },
            {
              id: 2,
              event: "Board Strategy Briefing",
              issue: "Participant data retention exceeded",
              severity: "medium",
              date: "2026-03-13",
            },
            {
              id: 3,
              event: "Investor Day",
              issue: "Transcript not generated within SLA",
              severity: "low",
              date: "2026-03-12",
            },
          ].map((item) => (
            <div
              key={item.id}
              className={`p-3 rounded border-l-4 ${
                item.severity === "high"
                  ? "border-red-500 bg-red-500/5"
                  : item.severity === "medium"
                    ? "border-yellow-500 bg-yellow-500/5"
                    : "border-blue-500 bg-blue-500/5"
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-sm">{item.event}</p>
                  <p className="text-sm text-muted-foreground">{item.issue}</p>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded capitalize ${
                    item.severity === "high"
                      ? "bg-red-500/20 text-red-600"
                      : item.severity === "medium"
                        ? "bg-yellow-500/20 text-yellow-600"
                        : "bg-blue-500/20 text-blue-600"
                  }`}
                >
                  {item.severity}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">{item.date}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* System Health */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">System Health</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-background rounded border border-border">
            <p className="text-xs text-muted-foreground mb-2">API Uptime</p>
            <div className="flex items-end gap-2">
              <p className="text-2xl font-bold">99.9%</p>
              <span className="text-xs text-green-600">✓ Healthy</span>
            </div>
          </div>
          <div className="p-4 bg-background rounded border border-border">
            <p className="text-xs text-muted-foreground mb-2">Database</p>
            <div className="flex items-end gap-2">
              <p className="text-2xl font-bold">98.5%</p>
              <span className="text-xs text-green-600">✓ Healthy</span>
            </div>
          </div>
          <div className="p-4 bg-background rounded border border-border">
            <p className="text-xs text-muted-foreground mb-2">Ably Realtime</p>
            <div className="flex items-end gap-2">
              <p className="text-2xl font-bold">99.8%</p>
              <span className="text-xs text-green-600">✓ Healthy</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
