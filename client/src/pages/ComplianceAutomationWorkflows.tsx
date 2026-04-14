import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, AlertCircle, Clock, Zap, FileText, BarChart3 } from "lucide-react";

interface ComplianceCheck {
  id: string;
  framework: string;
  control: string;
  status: "compliant" | "non-compliant" | "in-progress";
  lastCheck: string;
  nextCheck: string;
  evidence: number;
  automationLevel: number;
}

interface ComplianceFramework {
  id: string;
  name: string;
  status: "compliant" | "non-compliant" | "in-progress";
  controls: number;
  compliantControls: number;
  score: number;
  lastAudit: string;
  nextAudit: string;
}

interface AuditTrail {
  id: string;
  timestamp: string;
  action: string;
  framework: string;
  control: string;
  user: string;
  status: string;
  evidence: string;
}

export default function ComplianceAutomationWorkflows() {
  const frameworks: ComplianceFramework[] = [
    {
      id: "SOC2",
      name: "SOC 2 Type II",
      status: "compliant",
      controls: 76,
      compliantControls: 74,
      score: 97,
      lastAudit: "2026-02-15",
      nextAudit: "2026-08-15",
    },
    {
      id: "ISO27001",
      name: "ISO 27001:2022",
      status: "compliant",
      controls: 114,
      compliantControls: 110,
      score: 96,
      lastAudit: "2026-01-20",
      nextAudit: "2026-07-20",
    },
    {
      id: "HIPAA",
      name: "HIPAA",
      status: "in-progress",
      controls: 164,
      compliantControls: 158,
      score: 96,
      lastAudit: "2025-12-10",
      nextAudit: "2026-06-10",
    },
    {
      id: "PCIDSS",
      name: "PCI-DSS v3.2.1",
      status: "compliant",
      controls: 12,
      compliantControls: 12,
      score: 100,
      lastAudit: "2026-03-01",
      nextAudit: "2026-09-01",
    },
    {
      id: "GDPR",
      name: "GDPR",
      status: "compliant",
      controls: 99,
      compliantControls: 97,
      score: 98,
      lastAudit: "2026-02-01",
      nextAudit: "2026-08-01",
    },
  ];

  const complianceChecks: ComplianceCheck[] = [
    {
      id: "CC-001",
      framework: "SOC 2",
      control: "CC6.1 - Logical Access Controls",
      status: "compliant",
      lastCheck: "2026-03-14 08:15:00",
      nextCheck: "2026-03-21 08:15:00",
      evidence: 12,
      automationLevel: 95,
    },
    {
      id: "CC-002",
      framework: "ISO 27001",
      control: "A.9.2.1 - User Access Management",
      status: "compliant",
      lastCheck: "2026-03-14 09:30:00",
      nextCheck: "2026-03-21 09:30:00",
      evidence: 8,
      automationLevel: 88,
    },
    {
      id: "CC-003",
      framework: "HIPAA",
      control: "164.308(a)(3) - Workforce Security",
      status: "in-progress",
      lastCheck: "2026-03-13 14:22:00",
      nextCheck: "2026-03-20 14:22:00",
      evidence: 5,
      automationLevel: 72,
    },
    {
      id: "CC-004",
      framework: "PCI-DSS",
      control: "1.1 - Firewall Configuration",
      status: "compliant",
      lastCheck: "2026-03-14 10:45:00",
      nextCheck: "2026-03-21 10:45:00",
      evidence: 15,
      automationLevel: 98,
    },
    {
      id: "CC-005",
      framework: "GDPR",
      control: "Article 32 - Security of Processing",
      status: "compliant",
      lastCheck: "2026-03-14 11:20:00",
      nextCheck: "2026-03-21 11:20:00",
      evidence: 10,
      automationLevel: 85,
    },
  ];

  const auditTrail: AuditTrail[] = [
    {
      id: "AT-001",
      timestamp: "2026-03-14 15:32:18",
      action: "Automated Compliance Check",
      framework: "SOC 2",
      control: "CC6.1",
      user: "System",
      status: "PASS",
      evidence: "Access logs reviewed, 0 violations found",
    },
    {
      id: "AT-002",
      timestamp: "2026-03-14 14:15:42",
      action: "Evidence Collection",
      framework: "ISO 27001",
      control: "A.9.2.1",
      user: "Compliance Bot",
      status: "SUCCESS",
      evidence: "User access reviews exported to audit database",
    },
    {
      id: "AT-003",
      timestamp: "2026-03-14 13:48:09",
      action: "Automated Remediation",
      framework: "HIPAA",
      control: "164.308(a)(3)",
      user: "System",
      status: "PARTIAL",
      evidence: "3 of 5 findings auto-remediated, 2 require manual review",
    },
    {
      id: "AT-004",
      timestamp: "2026-03-14 12:22:55",
      action: "Compliance Report Generated",
      framework: "PCI-DSS",
      control: "1.1",
      user: "Compliance Manager",
      status: "EXPORTED",
      evidence: "Monthly compliance report sent to QSA",
    },
    {
      id: "AT-005",
      timestamp: "2026-03-14 11:10:33",
      action: "Policy Update Sync",
      framework: "GDPR",
      control: "Article 32",
      user: "System",
      status: "SYNCED",
      evidence: "3 policy updates applied to 245 employees",
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "compliant":
        return "bg-green-500/20 text-green-300";
      case "non-compliant":
        return "bg-red-500/20 text-red-300";
      case "in-progress":
        return "bg-yellow-500/20 text-yellow-300";
      default:
        return "bg-gray-500/20 text-gray-300";
    }
  };

  const getAuditStatusColor = (status: string) => {
    switch (status) {
      case "PASS":
        return "bg-green-500/20 text-green-300";
      case "FAIL":
        return "bg-red-500/20 text-red-300";
      case "PARTIAL":
        return "bg-yellow-500/20 text-yellow-300";
      case "SUCCESS":
        return "bg-green-500/20 text-green-300";
      case "EXPORTED":
        return "bg-blue-500/20 text-blue-300";
      case "SYNCED":
        return "bg-purple-500/20 text-purple-300";
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
            Compliance Automation Workflows
          </h1>
          <p className="text-muted-foreground">Automated compliance checks and regulatory reporting</p>
        </div>

        {/* Compliance Summary */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card className="bg-card/50 border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Frameworks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{frameworks.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Active frameworks</p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Compliant</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-400">
                {frameworks.filter((f) => f.status === "compliant").length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Frameworks</p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Avg Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">
                {Math.round(frameworks.reduce((sum, f) => sum + f.score, 0) / frameworks.length)}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">Compliance</p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Automated Checks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">
                {complianceChecks.filter((c) => c.automationLevel >= 80).length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">High automation</p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Audit Trail</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{auditTrail.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Records this week</p>
            </CardContent>
          </Card>
        </div>

        {/* Compliance Frameworks */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Compliance Frameworks
            </CardTitle>
            <CardDescription>Regulatory compliance status and audit schedules</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {frameworks.map((framework) => (
                <div key={framework.id} className="border border-border/50 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">{framework.name}</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        {framework.compliantControls} of {framework.controls} controls compliant
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Badge className={getStatusColor(framework.status)}>{framework.status}</Badge>
                      <Badge variant="outline" className="text-lg font-bold">
                        {framework.score}%
                      </Badge>
                    </div>
                  </div>

                  {/* Compliance Progress Bar */}
                  <div className="mb-3">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex-1 bg-border rounded-full h-2">
                        <div
                          className={
                            framework.score >= 95
                              ? "bg-green-500"
                              : framework.score >= 80
                                ? "bg-yellow-500"
                                : "bg-red-500"
                          }
                          style={{ width: `${framework.score}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground text-xs">Last Audit</p>
                      <p className="font-semibold">{framework.lastAudit}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Next Audit</p>
                      <p className="font-semibold">{framework.nextAudit}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Automated Compliance Checks */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-primary" />
              Automated Compliance Checks
            </CardTitle>
            <CardDescription>Continuous monitoring and evidence collection</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {complianceChecks.map((check) => (
                <div key={check.id} className="border border-border/50 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">{check.control}</h3>
                      <p className="text-xs text-muted-foreground mt-1">{check.framework}</p>
                    </div>
                    <Badge className={getStatusColor(check.status)}>{check.status}</Badge>
                  </div>

                  <div className="grid grid-cols-4 gap-4 text-sm mb-3">
                    <div>
                      <p className="text-muted-foreground text-xs">Last Check</p>
                      <p className="font-semibold text-xs">{check.lastCheck}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Next Check</p>
                      <p className="font-semibold text-xs">{check.nextCheck}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Evidence</p>
                      <p className="font-semibold">{check.evidence} items</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Automation</p>
                      <p className="font-semibold text-green-400">{check.automationLevel}%</p>
                    </div>
                  </div>

                  {/* Automation Progress */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-border rounded-full h-1.5">
                      <div
                        className="bg-green-500 h-1.5 rounded-full"
                        style={{ width: `${check.automationLevel}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Immutable Audit Trail */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              Immutable Audit Trail
            </CardTitle>
            <CardDescription>Tamper-proof compliance evidence and regulatory exports</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left py-2 px-3 text-muted-foreground font-semibold">Timestamp</th>
                    <th className="text-left py-2 px-3 text-muted-foreground font-semibold">Action</th>
                    <th className="text-left py-2 px-3 text-muted-foreground font-semibold">Framework</th>
                    <th className="text-left py-2 px-3 text-muted-foreground font-semibold">Control</th>
                    <th className="text-left py-2 px-3 text-muted-foreground font-semibold">User</th>
                    <th className="text-left py-2 px-3 text-muted-foreground font-semibold">Status</th>
                    <th className="text-left py-2 px-3 text-muted-foreground font-semibold">Evidence</th>
                  </tr>
                </thead>
                <tbody>
                  {auditTrail.map((trail) => (
                    <tr key={trail.id} className="border-b border-border/50 hover:bg-card/30">
                      <td className="py-2 px-3 text-xs">{trail.timestamp}</td>
                      <td className="py-2 px-3 text-sm">{trail.action}</td>
                      <td className="py-2 px-3">
                        <Badge variant="outline">{trail.framework}</Badge>
                      </td>
                      <td className="py-2 px-3 text-xs">{trail.control}</td>
                      <td className="py-2 px-3 text-xs">{trail.user}</td>
                      <td className="py-2 px-3">
                        <Badge className={getAuditStatusColor(trail.status)}>{trail.status}</Badge>
                      </td>
                      <td className="py-2 px-3 text-xs text-muted-foreground">{trail.evidence}</td>
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
              <label className="text-sm font-semibold text-foreground">Generate Compliance Report</label>
              <div className="flex gap-2">
                <select className="flex-1 px-3 py-2 rounded border border-border/50 bg-background text-foreground text-sm">
                  <option>Select framework...</option>
                  <option>SOC 2</option>
                  <option>ISO 27001</option>
                  <option>HIPAA</option>
                  <option>PCI-DSS</option>
                  <option>GDPR</option>
                </select>
                <Button className="gap-2">
                  <FileText className="w-4 h-4" />
                  Export
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Schedule Automated Checks</label>
              <Button variant="outline" className="w-full gap-2">
                <Clock className="w-4 h-4" />
                Configure Schedule
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
