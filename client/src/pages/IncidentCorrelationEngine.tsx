import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, TrendingUp, Link2, Zap } from "lucide-react";

interface CorrelatedEvent {
  id: string;
  type: string;
  severity: "critical" | "high" | "medium" | "low";
  timestamp: string;
  source: string;
  description: string;
}

interface CorrelatedIncident {
  id: string;
  title: string;
  severity: "critical" | "high" | "medium" | "low";
  correlatedEvents: number;
  confidence: number;
  status: "active" | "investigating" | "resolved";
  firstSeen: string;
  lastSeen: string;
  relatedIncidents: string[];
}

export default function IncidentCorrelationEngine() {
  const correlatedIncidents: CorrelatedIncident[] = [
    {
      id: "INC-2026-001",
      title: "Coordinated Lateral Movement Detected",
      severity: "critical",
      correlatedEvents: 47,
      confidence: 96,
      status: "active",
      firstSeen: "2026-03-14 14:32:15",
      lastSeen: "2026-03-14 15:28:42",
      relatedIncidents: ["INC-2026-002", "INC-2026-003"],
    },
    {
      id: "INC-2026-002",
      title: "Privilege Escalation Attempt",
      severity: "high",
      correlatedEvents: 23,
      confidence: 89,
      status: "investigating",
      firstSeen: "2026-03-14 14:35:22",
      lastSeen: "2026-03-14 15:15:08",
      relatedIncidents: ["INC-2026-001"],
    },
    {
      id: "INC-2026-003",
      title: "Data Exfiltration Pattern",
      severity: "high",
      correlatedEvents: 31,
      confidence: 92,
      status: "investigating",
      firstSeen: "2026-03-14 14:38:45",
      lastSeen: "2026-03-14 15:22:33",
      relatedIncidents: ["INC-2026-001"],
    },
  ];

  const recentEvents: CorrelatedEvent[] = [
    {
      id: "EVT-001",
      type: "Suspicious Login",
      severity: "high",
      timestamp: "2026-03-14 15:28:42",
      source: "auth.system",
      description: "Multiple failed login attempts from unusual location",
    },
    {
      id: "EVT-002",
      type: "File Access",
      severity: "high",
      timestamp: "2026-03-14 15:27:15",
      source: "file.monitor",
      description: "Bulk download of sensitive documents detected",
    },
    {
      id: "EVT-003",
      type: "Network Anomaly",
      severity: "medium",
      timestamp: "2026-03-14 15:26:08",
      source: "network.ids",
      description: "Unusual outbound traffic pattern to known malicious IP",
    },
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-900 text-red-100";
      case "high":
        return "bg-orange-900 text-orange-100";
      case "medium":
        return "bg-yellow-900 text-yellow-100";
      default:
        return "bg-blue-900 text-blue-100";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-red-500/20 text-red-300 border-red-500/30";
      case "investigating":
        return "bg-yellow-500/20 text-yellow-300 border-yellow-500/30";
      default:
        return "bg-green-500/20 text-green-300 border-green-500/30";
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-foreground flex items-center gap-3">
            <Link2 className="w-10 h-10 text-primary" />
            Incident Correlation Engine
          </h1>
          <p className="text-muted-foreground">ML-powered event correlation and unified incident detection</p>
        </div>

        {/* Correlation Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-card/50 border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Incidents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">3</div>
              <p className="text-xs text-muted-foreground mt-1">↑ 1 from last hour</p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Correlated Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">101</div>
              <p className="text-xs text-muted-foreground mt-1">Avg 96% confidence</p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">False Positive Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-400">2.3%</div>
              <p className="text-xs text-muted-foreground mt-1">↓ 0.8% improvement</p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Avg Response Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">4.2s</div>
              <p className="text-xs text-muted-foreground mt-1">Correlation latency</p>
            </CardContent>
          </Card>
        </div>

        {/* Correlated Incidents */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-primary" />
              Correlated Incidents
            </CardTitle>
            <CardDescription>Unified incidents from correlated security events</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {correlatedIncidents.map((incident) => (
              <div key={incident.id} className="border border-border/50 rounded-lg p-4 space-y-3 hover:bg-card/80 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground">{incident.title}</h3>
                      <Badge className={getSeverityColor(incident.severity)}>{incident.severity.toUpperCase()}</Badge>
                      <Badge variant="outline" className={getStatusColor(incident.status)}>
                        {incident.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{incident.id}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary">{incident.confidence}%</div>
                    <p className="text-xs text-muted-foreground">Confidence</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">Correlated Events</p>
                    <p className="font-semibold text-foreground">{incident.correlatedEvents}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">First Seen</p>
                    <p className="font-semibold text-foreground text-xs">{incident.firstSeen}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Last Seen</p>
                    <p className="font-semibold text-foreground text-xs">{incident.lastSeen}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Related Incidents</p>
                    <p className="font-semibold text-foreground">{incident.relatedIncidents.length}</p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Events */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              Recent Events (Awaiting Correlation)
            </CardTitle>
            <CardDescription>Events being analyzed for correlation patterns</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentEvents.map((event) => (
              <div key={event.id} className="border border-border/50 rounded-lg p-3 flex items-start justify-between hover:bg-card/80 transition-colors">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-foreground">{event.type}</h4>
                    <Badge className={getSeverityColor(event.severity)}>{event.severity}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{event.description}</p>
                  <p className="text-xs text-muted-foreground">{event.source} • {event.timestamp}</p>
                </div>
                <div className="text-right">
                  <Badge variant="outline">Analyzing...</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Correlation Insights */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Correlation Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-border/50 rounded-lg p-4 space-y-2">
                <h4 className="font-semibold text-foreground">Top Correlation Pattern</h4>
                <p className="text-sm text-muted-foreground">Lateral movement followed by privilege escalation (87% confidence)</p>
                <p className="text-xs text-primary">Detected in 12 incidents this month</p>
              </div>
              <div className="border border-border/50 rounded-lg p-4 space-y-2">
                <h4 className="font-semibold text-foreground">Emerging Threat Pattern</h4>
                <p className="text-sm text-muted-foreground">Multi-stage attack with data exfiltration (92% confidence)</p>
                <p className="text-xs text-primary">4 new incidents in last 24 hours</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
