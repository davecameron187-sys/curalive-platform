import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Calendar,
  FileText,
  Target,
  Zap,
  Eye,
  Download,
  Plus,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

interface ComplianceFramework {
  id: string;
  name: string;
  description: string;
  totalRequirements: number;
  metRequirements: number;
  gapCount: number;
  complianceScore: number;
  lastAssessment: number;
  nextAssessment: number;
  status: "compliant" | "partial" | "non-compliant";
  requirements: ComplianceRequirement[];
}

interface ComplianceRequirement {
  id: string;
  title: string;
  description: string;
  status: "met" | "gap" | "in-progress";
  dueDate: number;
  owner: string;
  evidence: string[];
  remediationPlan: string;
  priority: "critical" | "high" | "medium" | "low";
}

interface RemediationRoadmap {
  id: string;
  framework: string;
  totalGaps: number;
  completedGaps: number;
  inProgressGaps: number;
  remainingGaps: number;
  targetDate: number;
  estimatedCost: string;
  status: "on-track" | "at-risk" | "delayed";
  milestones: Milestone[];
}

interface Milestone {
  id: string;
  title: string;
  dueDate: number;
  completedDate?: number;
  status: "completed" | "in-progress" | "pending";
  tasks: number;
  completedTasks: number;
}

interface ComplianceTimeline {
  id: string;
  framework: string;
  assessmentDate: number;
  complianceScore: number;
  gapCount: number;
  trend: "improving" | "stable" | "declining";
}

export default function ComplianceGapAnalysis() {
  const [frameworks] = useState<ComplianceFramework[]>([
    {
      id: "FW-001",
      name: "SOC 2 Type II",
      description: "Service Organization Control compliance",
      totalRequirements: 64,
      metRequirements: 58,
      gapCount: 6,
      complianceScore: 91,
      lastAssessment: Date.now() - 2592000000,
      nextAssessment: Date.now() + 2592000000,
      status: "partial",
      requirements: [
        {
          id: "REQ-001",
          title: "Access Control",
          description: "Implement role-based access control",
          status: "met",
          dueDate: Date.now() - 86400000,
          owner: "Security Team",
          evidence: ["RBAC-Policy-v2.pdf", "Access-Logs-2026.csv"],
          remediationPlan: "N/A",
          priority: "critical",
        },
        {
          id: "REQ-002",
          title: "Encryption in Transit",
          description: "Encrypt all data in transit",
          status: "gap",
          dueDate: Date.now() + 604800000,
          owner: "Infrastructure Team",
          evidence: [],
          remediationPlan: "Implement TLS 1.3 across all services",
          priority: "critical",
        },
      ],
    },
    {
      id: "FW-002",
      name: "ISO 27001",
      description: "Information Security Management",
      totalRequirements: 114,
      metRequirements: 98,
      gapCount: 16,
      complianceScore: 86,
      lastAssessment: Date.now() - 1814400000,
      nextAssessment: Date.now() + 4320000000,
      status: "partial",
      requirements: [],
    },
    {
      id: "FW-003",
      name: "HIPAA",
      description: "Health Insurance Portability and Accountability Act",
      totalRequirements: 45,
      metRequirements: 42,
      gapCount: 3,
      complianceScore: 93,
      lastAssessment: Date.now() - 1209600000,
      nextAssessment: Date.now() + 5184000000,
      status: "partial",
      requirements: [],
    },
    {
      id: "FW-004",
      name: "PCI-DSS",
      description: "Payment Card Industry Data Security Standard",
      totalRequirements: 12,
      metRequirements: 10,
      gapCount: 2,
      complianceScore: 83,
      lastAssessment: Date.now() - 604800000,
      nextAssessment: Date.now() + 10368000000,
      status: "partial",
      requirements: [],
    },
    {
      id: "FW-005",
      name: "GDPR",
      description: "General Data Protection Regulation",
      totalRequirements: 99,
      metRequirements: 89,
      gapCount: 10,
      complianceScore: 90,
      lastAssessment: Date.now() - 3456000000,
      nextAssessment: Date.now() + 1728000000,
      status: "partial",
      requirements: [],
    },
  ]);

  const [remediationRoadmaps] = useState<RemediationRoadmap[]>([
    {
      id: "RM-001",
      framework: "SOC 2 Type II",
      totalGaps: 6,
      completedGaps: 2,
      inProgressGaps: 2,
      remainingGaps: 2,
      targetDate: Date.now() + 2592000000,
      estimatedCost: "$45,000",
      status: "on-track",
      milestones: [
        {
          id: "MS-001",
          title: "Access Control Implementation",
          dueDate: Date.now() - 86400000,
          completedDate: Date.now() - 86400000,
          status: "completed",
          tasks: 12,
          completedTasks: 12,
        },
        {
          id: "MS-002",
          title: "Encryption Deployment",
          dueDate: Date.now() + 604800000,
          status: "in-progress",
          tasks: 8,
          completedTasks: 5,
        },
        {
          id: "MS-003",
          title: "Audit Trail Implementation",
          dueDate: Date.now() + 1209600000,
          status: "pending",
          tasks: 6,
          completedTasks: 0,
        },
      ],
    },
    {
      id: "RM-002",
      framework: "ISO 27001",
      totalGaps: 16,
      completedGaps: 4,
      inProgressGaps: 6,
      remainingGaps: 6,
      targetDate: Date.now() + 5184000000,
      estimatedCost: "$120,000",
      status: "at-risk",
      milestones: [
        {
          id: "MS-004",
          title: "Policy Development",
          dueDate: Date.now() - 259200000,
          completedDate: Date.now() - 259200000,
          status: "completed",
          tasks: 20,
          completedTasks: 20,
        },
        {
          id: "MS-005",
          title: "Control Implementation",
          dueDate: Date.now() + 2592000000,
          status: "in-progress",
          tasks: 35,
          completedTasks: 18,
        },
      ],
    },
  ]);

  const [complianceTimeline] = useState<ComplianceTimeline[]>([
    {
      id: "TL-001",
      framework: "SOC 2 Type II",
      assessmentDate: Date.now() - 7776000000,
      complianceScore: 78,
      gapCount: 14,
      trend: "improving",
    },
    {
      id: "TL-002",
      framework: "SOC 2 Type II",
      assessmentDate: Date.now() - 5184000000,
      complianceScore: 84,
      gapCount: 10,
      trend: "improving",
    },
    {
      id: "TL-003",
      framework: "SOC 2 Type II",
      assessmentDate: Date.now() - 2592000000,
      complianceScore: 91,
      gapCount: 6,
      trend: "improving",
    },
  ]);

  const handleRunAssessment = (frameworkId: string) => {
    toast.success(`Running assessment for framework ${frameworkId}`);
  };

  const handleViewGaps = (frameworkId: string) => {
    toast.success(`Viewing gaps for framework ${frameworkId}`);
  };

  const handleDownloadRoadmap = (roadmapId: string) => {
    toast.success(`Downloading roadmap ${roadmapId}`);
  };

  const handleGenerateReport = () => {
    toast.success("Compliance report generated");
  };

  const averageScore =
    Math.round(frameworks.reduce((sum, f) => sum + f.complianceScore, 0) / frameworks.length) || 0;
  const totalGaps = frameworks.reduce((sum, f) => sum + f.gapCount, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Compliance Gap Analysis</h1>
        <p className="text-muted-foreground mt-1">
          Automated compliance assessment and remediation roadmaps
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Frameworks</p>
          <p className="text-3xl font-bold text-blue-600">{frameworks.length}</p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Avg Compliance</p>
          <p className="text-3xl font-bold">{averageScore}%</p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Total Gaps</p>
          <p className="text-3xl font-bold text-orange-600">{totalGaps}</p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Roadmaps</p>
          <p className="text-3xl font-bold text-green-600">
            {remediationRoadmaps.length}
          </p>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold flex items-center gap-2">
            <Target className="h-4 w-4" />
            Compliance Frameworks
          </h2>
          <Button onClick={handleGenerateReport} size="sm">
            <Download className="h-3 w-3 mr-1" />
            Report
          </Button>
        </div>

        <div className="space-y-3">
          {frameworks.map((framework) => (
            <div
              key={framework.id}
              className="p-4 border border-border rounded-lg hover:bg-secondary/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-muted-foreground">
                      {framework.id}
                    </span>
                    <span
                      className={`text-xs px-2 py-1 rounded font-semibold ${
                        framework.status === "compliant"
                          ? "bg-green-500/20 text-green-600"
                          : framework.status === "partial"
                            ? "bg-yellow-500/20 text-yellow-600"
                            : "bg-red-500/20 text-red-600"
                      }`}
                    >
                      {framework.status}
                    </span>
                  </div>
                  <h4 className="font-semibold">{framework.name}</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    {framework.description}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleViewGaps(framework.id)}
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    Gaps
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRunAssessment(framework.id)}
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Assess
                  </Button>
                </div>
              </div>

              <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-muted-foreground">Compliance Score</p>
                  <p className="text-xs font-semibold">{framework.complianceScore}%</p>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      framework.complianceScore >= 90
                        ? "bg-green-600"
                        : framework.complianceScore >= 75
                          ? "bg-yellow-600"
                          : "bg-red-600"
                    }`}
                    style={{ width: `${framework.complianceScore}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2 text-xs">
                <div>
                  <p className="text-muted-foreground">Requirements</p>
                  <p className="font-semibold">{framework.totalRequirements}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Met</p>
                  <p className="font-semibold text-green-600">
                    {framework.metRequirements}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Gaps</p>
                  <p className="font-semibold text-orange-600">{framework.gapCount}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Next Assessment</p>
                  <p className="font-semibold">
                    {Math.floor((framework.nextAssessment - Date.now()) / 86400000)}d
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Remediation Roadmaps
        </h2>

        <div className="space-y-3">
          {remediationRoadmaps.map((roadmap) => (
            <div
              key={roadmap.id}
              className="p-4 border border-border rounded-lg hover:bg-secondary/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-muted-foreground">
                      {roadmap.id}
                    </span>
                    <span
                      className={`text-xs px-2 py-1 rounded font-semibold ${
                        roadmap.status === "on-track"
                          ? "bg-green-500/20 text-green-600"
                          : roadmap.status === "at-risk"
                            ? "bg-yellow-500/20 text-yellow-600"
                            : "bg-red-500/20 text-red-600"
                      }`}
                    >
                      {roadmap.status}
                    </span>
                  </div>
                  <h4 className="font-semibold">{roadmap.framework}</h4>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDownloadRoadmap(roadmap.id)}
                >
                  <Download className="h-3 w-3 mr-1" />
                  Download
                </Button>
              </div>

              <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-muted-foreground">Gap Closure Progress</p>
                  <p className="text-xs font-semibold">
                    {roadmap.completedGaps}/{roadmap.totalGaps}
                  </p>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{
                      width: `${(roadmap.completedGaps / roadmap.totalGaps) * 100}%`,
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2 text-xs mb-3">
                <div>
                  <p className="text-muted-foreground">Completed</p>
                  <p className="font-semibold text-green-600">
                    {roadmap.completedGaps}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">In Progress</p>
                  <p className="font-semibold text-blue-600">
                    {roadmap.inProgressGaps}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Remaining</p>
                  <p className="font-semibold text-orange-600">
                    {roadmap.remainingGaps}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Target</p>
                  <p className="font-semibold">
                    {Math.floor((roadmap.targetDate - Date.now()) / 86400000)}d
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                {roadmap.milestones.map((milestone) => (
                  <div key={milestone.id} className="text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-muted-foreground">{milestone.title}</span>
                      <span
                        className={`px-2 py-1 rounded font-semibold ${
                          milestone.status === "completed"
                            ? "bg-green-500/20 text-green-600"
                            : milestone.status === "in-progress"
                              ? "bg-blue-500/20 text-blue-600"
                              : "bg-gray-500/20 text-gray-600"
                        }`}
                      >
                        {milestone.completedTasks}/{milestone.tasks}
                      </span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full ${
                          milestone.status === "completed"
                            ? "bg-green-600"
                            : milestone.status === "in-progress"
                              ? "bg-blue-600"
                              : "bg-gray-400"
                        }`}
                        style={{
                          width: `${(milestone.completedTasks / milestone.tasks) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Compliance Timeline
        </h2>

        <div className="space-y-3">
          {complianceTimeline.map((timeline) => (
            <div
              key={timeline.id}
              className="p-4 border border-border rounded-lg hover:bg-secondary/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="font-semibold">{timeline.framework}</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(timeline.assessmentDate).toLocaleDateString()}
                  </p>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded font-semibold ${
                    timeline.trend === "improving"
                      ? "bg-green-500/20 text-green-600"
                      : timeline.trend === "stable"
                        ? "bg-blue-500/20 text-blue-600"
                        : "bg-red-500/20 text-red-600"
                  }`}
                >
                  {timeline.trend}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-muted-foreground">Compliance Score</p>
                  <p className="font-semibold">{timeline.complianceScore}%</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Gaps</p>
                  <p className="font-semibold">{timeline.gapCount}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
