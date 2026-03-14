import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, AlertTriangle, Shield, TrendingUp } from "lucide-react";

interface ActiveThreat {
  id: string;
  name: string;
  severity: "critical" | "high" | "medium" | "low";
  detectedAt: string;
  source: string;
  status: "active" | "mitigating" | "contained";
}

interface RealTimeMetric {
  label: string;
  value: number | string;
  change: number;
  unit: string;
}

export default function RealTimeSecurityDashboards() {
  const activeThreats: ActiveThreat[] = [
    {
      id: "THR-001",
      name: "Brute Force Attack - SSH",
      severity: "high",
      detectedAt: "2026-03-14 15:28:42",
      source: "network.ids",
      status: "mitigating",
    },
    {
      id: "THR-002",
      name: "Suspicious API Activity",
      severity: "medium",
      detectedAt: "2026-03-14 15:25:15",
      source: "api.monitor",
      status: "active",
    },
    {
      id: "THR-003",
      name: "Potential Data Exfiltration",
      severity: "critical",
      detectedAt: "2026-03-14 15:22:08",
      source: "dlp.system",
      status: "active",
    },
  ];

  const realTimeMetrics: RealTimeMetric[] = [
    { label: "Active Alerts", value: 12, change: 3, unit: "alerts" },
    { label: "Threat Level", value: "HIGH", change: 2, unit: "" },
    { label: "Incidents/Hour", value: 4.2, change: -0.8, unit: "incidents" },
    { label: "Response Time", value: "2.3s", change: -0.5, unit: "seconds" },
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
      case "mitigating":
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
            <Activity className="w-10 h-10 text-primary animate-pulse" />
            Real-Time Security Dashboards
          </h1>
          <p className="text-muted-foreground">Live threat monitoring and incident tracking for SOC teams</p>
        </div>

        {/* Real-Time Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {realTimeMetrics.map((metric, idx) => (
            <Card key={idx} className="bg-card/50 border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{metric.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">{metric.value}</div>
                <p className={`text-xs mt-1 ${metric.change > 0 ? "text-red-400" : "text-green-400"}`}>
                  {metric.change > 0 ? "↑" : "↓"} {Math.abs(metric.change)} {metric.unit}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Active Threats */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Active Threats (Live)
            </CardTitle>
            <CardDescription>Real-time threat detection and tracking</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {activeThreats.map((threat) => (
              <div
                key={threat.id}
                className="border border-border/50 rounded-lg p-4 space-y-3 hover:bg-card/80 transition-colors animate-pulse"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground">{threat.name}</h3>
                      <Badge className={getSeverityColor(threat.severity)}>{threat.severity.toUpperCase()}</Badge>
                      <Badge variant="outline" className={getStatusColor(threat.status)}>
                        {threat.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{threat.id}</p>
                  </div>
                  <div className="text-right">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                    <p className="text-xs text-muted-foreground mt-1">LIVE</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">Detected At</p>
                    <p className="font-semibold text-foreground text-xs">{threat.detectedAt}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Source</p>
                    <p className="font-semibold text-foreground">{threat.source}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Duration</p>
                    <p className="font-semibold text-foreground">6m 34s</p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* SOC Team Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Ongoing Incidents
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Critical</span>
                  <Badge className="bg-red-900 text-red-100">2</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">High</span>
                  <Badge className="bg-orange-900 text-orange-100">5</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Medium</span>
                  <Badge className="bg-yellow-900 text-yellow-100">8</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Low</span>
                  <Badge className="bg-blue-900 text-blue-100">3</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Alert Trends
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Last Hour</span>
                  <span className="font-semibold">24 alerts</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Last 24 Hours</span>
                  <span className="font-semibold">287 alerts</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">This Week</span>
                  <span className="font-semibold">1,843 alerts</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Avg Response</span>
                  <span className="font-semibold text-green-400">2.3s</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alert Stream */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle>Alert Stream (Live)</CardTitle>
            <CardDescription>Real-time alert feed with WebSocket updates</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 max-h-96 overflow-y-auto">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="border border-border/50 rounded p-2 text-xs flex justify-between items-center hover:bg-card/80 transition-colors">
                <span className="text-muted-foreground">15:{28 - i}:{42 - i} - Alert detected from {["network.ids", "api.monitor", "dlp.system"][i % 3]}</span>
                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
