import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  GitBranch,
  Bell,
  Clock,
  CheckCircle,
  AlertTriangle,
  Zap,
  BarChart3,
  Shield,
} from "lucide-react";
import { toast } from "sonner";

interface AuditSchedule {
  id: string;
  name: string;
  type: "sast" | "dast" | "policy" | "vendor";
  frequency: "daily" | "weekly" | "monthly";
  lastRun: number;
  nextRun: number;
  status: "active" | "paused" | "failed";
  violations: number;
}

interface SlackNotification {
  id: string;
  channel: string;
  webhook: string;
  events: string[];
  enabled: boolean;
}

export default function SecurityAuditAutomation() {
  const [schedules, setSchedules] = useState<AuditSchedule[]>([
    {
      id: "audit-001",
      name: "Daily SAST Scan",
      type: "sast",
      frequency: "daily",
      lastRun: Date.now() - 3600000,
      nextRun: Date.now() + 82800000,
      status: "active",
      violations: 2,
    },
    {
      id: "audit-002",
      name: "Weekly DAST Scan",
      type: "dast",
      frequency: "weekly",
      lastRun: Date.now() - 604800000,
      nextRun: Date.now() + 604800000,
      status: "active",
      violations: 0,
    },
    {
      id: "audit-003",
      name: "Policy Compliance Check",
      type: "policy",
      frequency: "daily",
      lastRun: Date.now() - 1800000,
      nextRun: Date.now() + 84600000,
      status: "active",
      violations: 6,
    },
    {
      id: "audit-004",
      name: "Vendor Risk Assessment",
      type: "vendor",
      frequency: "weekly",
      lastRun: Date.now() - 259200000,
      nextRun: Date.now() + 345600000,
      status: "active",
      violations: 2,
    },
  ]);

  const [slackNotifications, setSlackNotifications] = useState<SlackNotification[]>([
    {
      id: "slack-001",
      channel: "#security-alerts",
      webhook: "https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX",
      events: ["critical_violation", "policy_breach", "vendor_at_risk"],
      enabled: true,
    },
    {
      id: "slack-002",
      channel: "#compliance-team",
      webhook: "https://hooks.slack.com/services/T00000000/B00000001/XXXXXXXXXXXXXXXXXXXX",
      events: ["compliance_report", "audit_complete"],
      enabled: true,
    },
  ]);

  const stats = {
    activeSchedules: schedules.filter((s) => s.status === "active").length,
    totalViolations: schedules.reduce((sum, s) => sum + s.violations, 0),
    slackChannels: slackNotifications.filter((n) => n.enabled).length,
    lastAuditTime: new Date(schedules[0]?.lastRun || Date.now()).toLocaleString(),
  };

  const handleRunAudit = (scheduleId: string) => {
    toast.success("Audit scheduled to run immediately");
  };

  const handlePauseSchedule = (scheduleId: string) => {
    toast.success("Schedule paused");
  };

  const handleTestSlack = (slackId: string) => {
    toast.success("Test message sent to Slack");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500/20 text-green-600";
      case "paused":
        return "bg-yellow-500/20 text-yellow-600";
      case "failed":
        return "bg-red-500/20 text-red-600";
      default:
        return "bg-gray-500/20 text-gray-600";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "sast":
        return "bg-blue-500/20 text-blue-600";
      case "dast":
        return "bg-purple-500/20 text-purple-600";
      case "policy":
        return "bg-orange-500/20 text-orange-600";
      case "vendor":
        return "bg-pink-500/20 text-pink-600";
      default:
        return "bg-gray-500/20 text-gray-600";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Security Audit Automation</h1>
        <p className="text-muted-foreground mt-1">
          Automated security scans with GitHub Actions and Slack notifications
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Active Schedules</p>
          <p className="text-3xl font-bold">{stats.activeSchedules}</p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Total Violations</p>
          <p className="text-3xl font-bold text-red-600">{stats.totalViolations}</p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Slack Channels</p>
          <p className="text-3xl font-bold">{stats.slackChannels}</p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Last Audit</p>
          <p className="text-xs font-semibold">{stats.lastAuditTime}</p>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Audit Schedules
          </h2>
          <Button>Add Schedule</Button>
        </div>

        <div className="space-y-3">
          {schedules.map((schedule) => (
            <div
              key={schedule.id}
              className="p-4 border border-border rounded-lg hover:bg-secondary/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="font-semibold text-sm">{schedule.name}</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    {schedule.frequency.charAt(0).toUpperCase() + schedule.frequency.slice(1)} • Last run:{" "}
                    {Math.floor((Date.now() - schedule.lastRun) / (1000 * 60))} min ago
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded font-semibold ${getTypeColor(schedule.type)}`}>
                    {schedule.type.toUpperCase()}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded font-semibold ${getStatusColor(schedule.status)}`}>
                    {schedule.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-3 text-xs">
                <div>
                  <p className="text-muted-foreground">Violations</p>
                  <p className="font-semibold text-red-600">{schedule.violations}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Next Run</p>
                  <p className="font-semibold">
                    {Math.floor((schedule.nextRun - Date.now()) / (1000 * 60 * 60))}h
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">GitHub Actions</p>
                  <p className="font-semibold">Enabled</p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button size="sm" onClick={() => handleRunAudit(schedule.id)}>
                  <Zap className="h-3 w-3 mr-1" />
                  Run Now
                </Button>
                <Button size="sm" variant="outline" onClick={() => handlePauseSchedule(schedule.id)}>
                  Pause
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Slack Notifications
          </h2>

          <div className="space-y-3">
            {slackNotifications.map((notification) => (
              <div key={notification.id} className="p-3 border border-border rounded">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold text-sm">{notification.channel}</p>
                  <span className={`text-xs px-2 py-1 rounded font-semibold ${notification.enabled ? "bg-green-500/20 text-green-600" : "bg-gray-500/20 text-gray-600"}`}>
                    {notification.enabled ? "Enabled" : "Disabled"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mb-2">
                  {notification.events.length} event types
                </p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleTestSlack(notification.id)}>
                    Test
                  </Button>
                  <Button size="sm" variant="outline">
                    Edit
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <Button className="w-full mt-4">Add Slack Channel</Button>
        </Card>

        <Card className="p-6">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <GitBranch className="h-4 w-4" />
            GitHub Actions Configuration
          </h2>

          <div className="space-y-3 text-sm">
            <div>
              <p className="font-semibold">Workflow Status</p>
              <p className="text-muted-foreground text-xs mt-1">
                4 workflows active, 0 failed
              </p>
            </div>

            <div>
              <p className="font-semibold">Recent Runs</p>
              <ul className="list-disc list-inside text-muted-foreground text-xs mt-1">
                <li>daily-sast-scan: ✓ Passed (1h ago)</li>
                <li>policy-check: ✓ Passed (30m ago)</li>
                <li>vendor-scan: ✓ Passed (2h ago)</li>
              </ul>
            </div>

            <div>
              <p className="font-semibold">Remediation Workflows</p>
              <p className="text-muted-foreground text-xs mt-1">
                Automated remediation enabled for low/medium severity findings
              </p>
            </div>
          </div>

          <Button className="w-full mt-4">View Workflow Logs</Button>
        </Card>
      </div>
    </div>
  );
}
