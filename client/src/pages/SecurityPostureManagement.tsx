import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Shield, CheckCircle, AlertTriangle, TrendingUp, FileText, Zap } from "lucide-react";

interface PostureControl {
  id: string;
  framework: string;
  control: string;
  status: "compliant" | "non-compliant" | "partial" | "not-applicable";
  evidence: number;
  lastChecked: string;
  automatedCheck: boolean;
  riskLevel: "critical" | "high" | "medium" | "low";
}

interface EvidenceItem {
  id: string;
  control: string;
  type: string;
  collectedAt: string;
  source: string;
  status: "valid" | "expired" | "pending";
  expiresAt: string;
}

interface PostureScore {
  framework: string;
  score: number;
  controls: number;
  compliant: number;
  trend: number;
  lastAudit: string;
}

interface DriftAlert {
  id: string;
  control: string;
  framework: string;
  detectedAt: string;
  severity: "critical" | "high" | "medium";
  description: string;
  autoRemediated: boolean;
}

export default function SecurityPostureManagement() {
  const controls: PostureControl[] = [
    {
      id: "PC-001",
      framework: "SOC 2",
      control: "CC6.1 - Logical Access Controls",
      status: "compliant",
      evidence: 12,
      lastChecked: "2026-03-14 08:00",
      automatedCheck: true,
      riskLevel: "high",
    },
    {
      id: "PC-002",
      framework: "ISO 27001",
      control: "A.9.4.1 - Information Access Restriction",
      status: "compliant",
      evidence: 8,
      lastChecked: "2026-03-14 09:15",
      automatedCheck: true,
      riskLevel: "high",
    },
    {
      id: "PC-003",
      framework: "HIPAA",
      control: "164.312(a)(1) - Access Control",
      status: "partial",
      evidence: 5,
      lastChecked: "2026-03-13 14:00",
      automatedCheck: false,
      riskLevel: "critical",
    },
    {
      id: "PC-004",
      framework: "PCI-DSS",
      control: "7.1 - Restrict Access to System Components",
      status: "compliant",
      evidence: 15,
      lastChecked: "2026-03-14 10:30",
      automatedCheck: true,
      riskLevel: "critical",
    },
    {
      id: "PC-005",
      framework: "GDPR",
      control: "Art. 25 - Data Protection by Design",
      status: "compliant",
      evidence: 9,
      lastChecked: "2026-03-14 11:00",
      automatedCheck: true,
      riskLevel: "high",
    },
    {
      id: "PC-006",
      framework: "NIST CSF",
      control: "PR.AC-1 - Identity Management",
      status: "non-compliant",
      evidence: 2,
      lastChecked: "2026-03-12 16:00",
      automatedCheck: false,
      riskLevel: "critical",
    },
  ];

  const evidence: EvidenceItem[] = [
    {
      id: "EV-001",
      control: "CC6.1",
      type: "Access Log Export",
      collectedAt: "2026-03-14 08:00",
      source: "Azure AD",
      status: "valid",
      expiresAt: "2026-04-14",
    },
    {
      id: "EV-002",
      control: "A.9.4.1",
      type: "User Access Review",
      collectedAt: "2026-03-14 09:15",
      source: "Okta",
      status: "valid",
      expiresAt: "2026-04-14",
    },
    {
      id: "EV-003",
      control: "164.312(a)(1)",
      type: "Policy Document",
      collectedAt: "2026-02-01 10:00",
      source: "SharePoint",
      status: "expired",
      expiresAt: "2026-03-01",
    },
    {
      id: "EV-004",
      control: "7.1",
      type: "Firewall Rule Export",
      collectedAt: "2026-03-14 10:30",
      source: "Palo Alto",
      status: "valid",
      expiresAt: "2026-04-14",
    },
    {
      id: "EV-005",
      control: "Art. 25",
      type: "DPIA Report",
      collectedAt: "2026-03-10 14:00",
      source: "OneTrust",
      status: "valid",
      expiresAt: "2026-06-10",
    },
  ];

  const postureScores: PostureScore[] = [
    { framework: "SOC 2", score: 97, controls: 76, compliant: 74, trend: 2, lastAudit: "2026-02-15" },
    { framework: "ISO 27001", score: 96, controls: 114, compliant: 110, trend: 1, lastAudit: "2026-01-20" },
    { framework: "HIPAA", score: 94, controls: 164, compliant: 154, trend: -1, lastAudit: "2025-12-10" },
    { framework: "PCI-DSS", score: 100, controls: 12, compliant: 12, trend: 0, lastAudit: "2026-03-01" },
    { framework: "GDPR", score: 98, controls: 99, compliant: 97, trend: 3, lastAudit: "2026-02-01" },
    { framework: "NIST CSF", score: 88, controls: 108, compliant: 95, trend: -2, lastAudit: "2026-01-15" },
  ];

  const driftAlerts: DriftAlert[] = [
    {
      id: "DA-001",
      control: "PR.AC-1",
      framework: "NIST CSF",
      detectedAt: "2026-03-14 07:45",
      severity: "critical",
      description: "MFA policy disabled on 3 privileged accounts",
      autoRemediated: false,
    },
    {
      id: "DA-002",
      control: "164.312(a)(1)",
      framework: "HIPAA",
      detectedAt: "2026-03-13 22:12",
      severity: "high",
      description: "Access control policy document expired",
      autoRemediated: false,
    },
    {
      id: "DA-003",
      control: "CC6.1",
      framework: "SOC 2",
      detectedAt: "2026-03-13 15:30",
      severity: "medium",
      description: "Unused service account detected — auto-disabled",
      autoRemediated: true,
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "compliant": return "bg-green-500/20 text-green-300";
      case "non-compliant": return "bg-red-500/20 text-red-300";
      case "partial": return "bg-yellow-500/20 text-yellow-300";
      case "not-applicable": return "bg-gray-500/20 text-gray-300";
      default: return "bg-gray-500/20 text-gray-300";
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "critical": return "text-red-400";
      case "high": return "text-orange-400";
      case "medium": return "text-yellow-400";
      case "low": return "text-green-400";
      default: return "text-gray-400";
    }
  };

  const getEvidenceStatusColor = (status: string) => {
    switch (status) {
      case "valid": return "bg-green-500/20 text-green-300";
      case "expired": return "bg-red-500/20 text-red-300";
      case "pending": return "bg-yellow-500/20 text-yellow-300";
      default: return "bg-gray-500/20 text-gray-300";
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "bg-red-500/20 text-red-300";
      case "high": return "bg-orange-500/20 text-orange-300";
      case "medium": return "bg-yellow-500/20 text-yellow-300";
      default: return "bg-gray-500/20 text-gray-300";
    }
  };

  const overallScore = Math.round(postureScores.reduce((s, p) => s + p.score, 0) / postureScores.length);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-foreground flex items-center gap-3">
            <Shield className="w-10 h-10 text-primary" />
            Security Posture Management
          </h1>
          <p className="text-muted-foreground">Continuous compliance monitoring with automated evidence collection and audit-ready documentation</p>
        </div>

        {/* Summary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card className="bg-card/50 border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Overall Posture</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{overallScore}%</div>
              <p className="text-xs text-muted-foreground mt-1">Across all frameworks</p>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Frameworks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{postureScores.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Active frameworks</p>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Drift Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-400">{driftAlerts.filter(d => !d.autoRemediated).length}</div>
              <p className="text-xs text-muted-foreground mt-1">Require attention</p>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Evidence Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{evidence.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Collected automatically</p>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Auto Checks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-400">
                {controls.filter(c => c.automatedCheck).length}/{controls.length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Controls automated</p>
            </CardContent>
          </Card>
        </div>

        {/* Posture Scores */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Framework Posture Scores
            </CardTitle>
            <CardDescription>Real-time compliance posture across all active frameworks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {postureScores.map((ps, idx) => (
                <div key={idx} className="border border-border/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">{ps.framework}</h3>
                      <p className="text-xs text-muted-foreground">{ps.compliant}/{ps.controls} controls compliant • Last audit: {ps.lastAudit}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-sm font-semibold ${ps.trend > 0 ? "text-green-400" : ps.trend < 0 ? "text-red-400" : "text-muted-foreground"}`}>
                        {ps.trend > 0 ? `↑ +${ps.trend}` : ps.trend < 0 ? `↓ ${ps.trend}` : "→ 0"}
                      </span>
                      <span className="text-2xl font-bold text-primary">{ps.score}%</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-border rounded-full h-2">
                      <div
                        className={ps.score >= 95 ? "bg-green-500" : ps.score >= 80 ? "bg-yellow-500" : "bg-red-500"}
                        style={{ width: `${ps.score}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Controls Status */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-primary" />
              Control Compliance Status
            </CardTitle>
            <CardDescription>Automated and manual control checks across frameworks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left py-2 px-3 text-muted-foreground font-semibold">Framework</th>
                    <th className="text-left py-2 px-3 text-muted-foreground font-semibold">Control</th>
                    <th className="text-left py-2 px-3 text-muted-foreground font-semibold">Status</th>
                    <th className="text-left py-2 px-3 text-muted-foreground font-semibold">Risk</th>
                    <th className="text-left py-2 px-3 text-muted-foreground font-semibold">Evidence</th>
                    <th className="text-left py-2 px-3 text-muted-foreground font-semibold">Last Checked</th>
                    <th className="text-left py-2 px-3 text-muted-foreground font-semibold">Automated</th>
                  </tr>
                </thead>
                <tbody>
                  {controls.map((ctrl) => (
                    <tr key={ctrl.id} className="border-b border-border/50 hover:bg-card/30">
                      <td className="py-2 px-3"><Badge variant="outline">{ctrl.framework}</Badge></td>
                      <td className="py-2 px-3 text-xs">{ctrl.control}</td>
                      <td className="py-2 px-3"><Badge className={getStatusColor(ctrl.status)}>{ctrl.status}</Badge></td>
                      <td className="py-2 px-3 font-semibold"><span className={getRiskColor(ctrl.riskLevel)}>{ctrl.riskLevel}</span></td>
                      <td className="py-2 px-3">{ctrl.evidence} items</td>
                      <td className="py-2 px-3 text-xs text-muted-foreground">{ctrl.lastChecked}</td>
                      <td className="py-2 px-3">
                        {ctrl.automatedCheck
                          ? <CheckCircle className="w-4 h-4 text-green-400" />
                          : <span className="text-xs text-muted-foreground">Manual</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Drift Alerts */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-primary" />
              Posture Drift Alerts
            </CardTitle>
            <CardDescription>Detected compliance drift and auto-remediation status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {driftAlerts.map((alert) => (
                <div key={alert.id} className="border border-border/50 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">{alert.description}</h3>
                      <p className="text-xs text-muted-foreground mt-1">{alert.framework} • {alert.control} • {alert.detectedAt}</p>
                    </div>
                    <div className="flex gap-2">
                      <Badge className={getSeverityColor(alert.severity)}>{alert.severity}</Badge>
                      {alert.autoRemediated
                        ? <Badge className="bg-green-500/20 text-green-300">Auto-Remediated</Badge>
                        : <Badge className="bg-red-500/20 text-red-300">Requires Action</Badge>}
                    </div>
                  </div>
                  {!alert.autoRemediated && (
                    <Button size="sm" variant="outline" className="mt-2">Remediate Now</Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Evidence Collection */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Automated Evidence Collection
            </CardTitle>
            <CardDescription>Audit-ready evidence automatically gathered from integrated systems</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left py-2 px-3 text-muted-foreground font-semibold">Control</th>
                    <th className="text-left py-2 px-3 text-muted-foreground font-semibold">Evidence Type</th>
                    <th className="text-left py-2 px-3 text-muted-foreground font-semibold">Source</th>
                    <th className="text-left py-2 px-3 text-muted-foreground font-semibold">Collected</th>
                    <th className="text-left py-2 px-3 text-muted-foreground font-semibold">Expires</th>
                    <th className="text-left py-2 px-3 text-muted-foreground font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {evidence.map((ev) => (
                    <tr key={ev.id} className="border-b border-border/50 hover:bg-card/30">
                      <td className="py-2 px-3 font-semibold">{ev.control}</td>
                      <td className="py-2 px-3 text-xs">{ev.type}</td>
                      <td className="py-2 px-3"><Badge variant="outline">{ev.source}</Badge></td>
                      <td className="py-2 px-3 text-xs text-muted-foreground">{ev.collectedAt}</td>
                      <td className="py-2 px-3 text-xs">{ev.expiresAt}</td>
                      <td className="py-2 px-3"><Badge className={getEvidenceStatusColor(ev.status)}>{ev.status}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Controls */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              Posture Management Controls
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full gap-2">
              <FileText className="w-4 h-4" />
              Generate Audit Package
            </Button>
            <Button variant="outline" className="w-full gap-2">
              <CheckCircle className="w-4 h-4" />
              Run All Automated Checks
            </Button>
            <Button variant="outline" className="w-full gap-2">
              <AlertTriangle className="w-4 h-4" />
              Remediate All Drift Alerts
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
