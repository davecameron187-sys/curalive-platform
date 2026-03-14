import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Zap, AlertTriangle, Clock, CheckCircle, Send, BarChart3 } from "lucide-react";

interface AutomatedIncident {
  id: string;
  title: string;
  severity: "critical" | "high" | "medium" | "low";
  status: "active" | "resolved" | "escalated";
  detectedAt: string;
  correlatedEvents: number;
  playbookExecuted: string;
  automationScore: number;
  timeToResolution: string;
}

interface CorrelationResult {
  id: string;
  sourceEvent: string;
  relatedEvents: number;
  confidence: number;
  threat: string;
  riskScore: number;
  suggestedPlaybook: string;
}

interface NotificationLog {
  id: string;
  timestamp: string;
  recipient: string;
  channel: string;
  message: string;
  status: "sent" | "pending" | "failed";
  severity: string;
}

export default function IncidentResponseAutomationEngine() {
  const incidents: AutomatedIncident[] = [
    {
      id: "INC-001",
      title: "Ransomware Detection - Lateral Movement",
      severity: "critical",
      status: "active",
      detectedAt: "2026-03-14 14:32:15",
      correlatedEvents: 23,
      playbookExecuted: "Ransomware Response v2.1",
      automationScore: 94,
      timeToResolution: "12m 45s",
    },
    {
      id: "INC-002",
      title: "Credential Compromise - Brute Force",
      severity: "high",
      status: "resolved",
      detectedAt: "2026-03-14 11:18:22",
      correlatedEvents: 15,
      playbookExecuted: "Credential Compromise v1.8",
      automationScore: 91,
      timeToResolution: "8m 32s",
    },
    {
      id: "INC-003",
      title: "Data Exfiltration - Unusual Network Activity",
      severity: "high",
      status: "escalated",
      detectedAt: "2026-03-14 09:45:08",
      correlatedEvents: 31,
      playbookExecuted: "Data Breach Response v2.0",
      automationScore: 88,
      timeToResolution: "25m 18s",
    },
    {
      id: "INC-004",
      title: "Insider Threat - Policy Violation",
      severity: "medium",
      status: "resolved",
      detectedAt: "2026-03-13 16:22:45",
      correlatedEvents: 8,
      playbookExecuted: "Insider Threat Response v1.5",
      automationScore: 85,
      timeToResolution: "45m 12s",
    },
  ];

  const correlations: CorrelationResult[] = [
    {
      id: "CORR-001",
      sourceEvent: "Malware Detection - Process Injection",
      relatedEvents: 34,
      confidence: 98,
      threat: "APT28 Campaign",
      riskScore: 94,
      suggestedPlaybook: "Advanced Threat Response",
    },
    {
      id: "CORR-002",
      sourceEvent: "Failed Login Attempts - Multiple Accounts",
      relatedEvents: 12,
      confidence: 92,
      threat: "Credential Stuffing Attack",
      riskScore: 87,
      suggestedPlaybook: "Credential Compromise",
    },
    {
      id: "CORR-003",
      sourceEvent: "Large Data Transfer - Off-Hours",
      relatedEvents: 8,
      confidence: 85,
      threat: "Data Exfiltration",
      riskScore: 82,
      suggestedPlaybook: "Data Breach Response",
    },
    {
      id: "CORR-004",
      sourceEvent: "Privilege Escalation - Unusual Account",
      relatedEvents: 5,
      confidence: 88,
      threat: "Insider Threat",
      riskScore: 79,
      suggestedPlaybook: "Insider Threat Response",
    },
  ];

  const notifications: NotificationLog[] = [
    {
      id: "NOT-001",
      timestamp: "2026-03-14 14:32:45",
      recipient: "Security Team Lead",
      channel: "Email + Slack",
      message: "CRITICAL: Ransomware detected - Playbook auto-executed",
      status: "sent",
      severity: "critical",
    },
    {
      id: "NOT-002",
      timestamp: "2026-03-14 14:33:12",
      recipient: "CISO",
      channel: "SMS + Email",
      message: "Critical incident escalation - Manual review required",
      status: "sent",
      severity: "critical",
    },
    {
      id: "NOT-003",
      timestamp: "2026-03-14 14:33:58",
      recipient: "Incident Response Team",
      channel: "Slack",
      message: "Incident correlation complete - 23 related events linked",
      status: "sent",
      severity: "high",
    },
    {
      id: "NOT-004",
      timestamp: "2026-03-14 14:35:22",
      recipient: "Executive Leadership",
      channel: "Email",
      message: "Incident summary report generated - 12m 45s response time",
      status: "sent",
      severity: "high",
    },
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-500/20 text-red-300";
      case "high":
        return "bg-orange-500/20 text-orange-300";
      case "medium":
        return "bg-yellow-500/20 text-yellow-300";
      case "low":
        return "bg-blue-500/20 text-blue-300";
      default:
        return "bg-gray-500/20 text-gray-300";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-red-500/20 text-red-300";
      case "resolved":
        return "bg-green-500/20 text-green-300";
      case "escalated":
        return "bg-orange-500/20 text-orange-300";
      default:
        return "bg-gray-500/20 text-gray-300";
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-foreground flex items-center gap-3">
            <Zap className="w-10 h-10 text-primary" />
            Incident Response Automation Engine
          </h1>
          <p className="text-muted-foreground">AI-driven correlation, automated playbook execution, and stakeholder notifications</p>
        </div>

        {/* Automation Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card className="bg-card/50 border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Incidents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">
                {incidents.filter((i) => i.status === "active").length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Being handled</p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Avg Response Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-400">18m</div>
              <p className="text-xs text-muted-foreground mt-1">Auto-detection to resolution</p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Automation Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">90%</div>
              <p className="text-xs text-muted-foreground mt-1">Average automation</p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Correlations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">
                {correlations.reduce((sum, c) => sum + c.relatedEvents, 0)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Events linked</p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Playbooks Executed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{incidents.length}</div>
              <p className="text-xs text-muted-foreground mt-1">This week</p>
            </CardContent>
          </Card>
        </div>

        {/* Automated Incidents */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-primary" />
              Automated Incident Response
            </CardTitle>
            <CardDescription>AI-driven incident detection and automated playbook execution</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {incidents.map((incident) => (
                <div key={incident.id} className="border border-border/50 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">{incident.title}</h3>
                      <p className="text-xs text-muted-foreground mt-1">Detected: {incident.detectedAt}</p>
                    </div>
                    <div className="flex gap-2">
                      <Badge className={getSeverityColor(incident.severity)}>{incident.severity}</Badge>
                      <Badge className={getStatusColor(incident.status)}>{incident.status}</Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-5 gap-4 mb-3 text-sm">
                    <div>
                      <p className="text-muted-foreground text-xs">Correlated Events</p>
                      <p className="font-semibold">{incident.correlatedEvents}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Playbook</p>
                      <p className="font-semibold text-xs">{incident.playbookExecuted}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Automation</p>
                      <p className="font-semibold text-green-400">{incident.automationScore}%</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Response Time</p>
                      <p className="font-semibold">{incident.timeToResolution}</p>
                    </div>
                    <div>
                      <Button size="sm" variant="outline" className="w-full">
                        View Details
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Event Correlation */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              AI Event Correlation Results
            </CardTitle>
            <CardDescription>ML-powered correlation of security events</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {correlations.map((corr) => (
                <div key={corr.id} className="border border-border/50 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">{corr.sourceEvent}</h3>
                      <p className="text-xs text-muted-foreground mt-1">Threat: {corr.threat}</p>
                    </div>
                    <Badge variant="outline" className="text-lg font-bold">
                      {corr.riskScore}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-4 gap-4 mb-3 text-sm">
                    <div>
                      <p className="text-muted-foreground text-xs">Related Events</p>
                      <p className="font-semibold">{corr.relatedEvents}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Confidence</p>
                      <p className="font-semibold text-green-400">{corr.confidence}%</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Risk Score</p>
                      <p className="font-semibold text-red-400">{corr.riskScore}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Suggested Playbook</p>
                      <p className="font-semibold text-xs">{corr.suggestedPlaybook}</p>
                    </div>
                  </div>

                  <Button size="sm" className="w-full gap-2">
                    <Zap className="w-4 h-4" />
                    Execute Playbook
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Stakeholder Notifications */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="w-5 h-5 text-primary" />
              Stakeholder Notifications
            </CardTitle>
            <CardDescription>Automated multi-channel incident notifications</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left py-2 px-3 text-muted-foreground font-semibold">Timestamp</th>
                    <th className="text-left py-2 px-3 text-muted-foreground font-semibold">Recipient</th>
                    <th className="text-left py-2 px-3 text-muted-foreground font-semibold">Channel</th>
                    <th className="text-left py-2 px-3 text-muted-foreground font-semibold">Message</th>
                    <th className="text-left py-2 px-3 text-muted-foreground font-semibold">Status</th>
                    <th className="text-left py-2 px-3 text-muted-foreground font-semibold">Severity</th>
                  </tr>
                </thead>
                <tbody>
                  {notifications.map((notif) => (
                    <tr key={notif.id} className="border-b border-border/50 hover:bg-card/30">
                      <td className="py-2 px-3 text-xs">{notif.timestamp}</td>
                      <td className="py-2 px-3 font-semibold">{notif.recipient}</td>
                      <td className="py-2 px-3">
                        <Badge variant="outline" className="text-xs">{notif.channel}</Badge>
                      </td>
                      <td className="py-2 px-3 text-xs text-muted-foreground">{notif.message}</td>
                      <td className="py-2 px-3">
                        {notif.status === "sent" ? (
                          <CheckCircle className="w-4 h-4 text-green-400" />
                        ) : (
                          <Clock className="w-4 h-4 text-yellow-400" />
                        )}
                      </td>
                      <td className="py-2 px-3">
                        <Badge className={getSeverityColor(notif.severity)}>{notif.severity}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Automation Controls */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Automation Controls
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Configure Auto-Execution Rules</label>
              <Button variant="outline" className="w-full gap-2">
                <Zap className="w-4 h-4" />
                Edit Automation Rules
              </Button>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Test Playbook Execution</label>
              <Button variant="outline" className="w-full gap-2">
                <CheckCircle className="w-4 h-4" />
                Run Test Scenario
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
